const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

// Store active SSE clients
let clients = [];

// GET /api/esp32/stream — SSE endpoint for real-time frontend updates
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  // Send an initial connected message
  res.write('data: {"type": "connected"}\n\n');

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// POST /api/esp32/ping — Handle hardware ping
router.post('/ping', async (req, res) => {
  const { employeeId, roomId } = req.body;
  if (!employeeId || !roomId) {
    return res.status(400).json({ success: false, message: 'Missing employeeId or roomId' });
  }

  // 1. Find employee by email (which acts as empId)
  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .eq('email', employeeId)
    .single();

  if (fetchError || !employee) {
    console.error('Employee not found:', fetchError);
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  // Decode extra data
  let extra = {};
  try {
    extra = JSON.parse(employee.department || '{}');
  } catch(e) {}

  // 2. Update employee record
  const history = extra.history || [];
  const pingEvent = {
    room: roomId,
    timestamp: new Date().toISOString()
  };
  
  history.push(pingEvent);
  
  extra.currentRoom = roomId;
  extra.lastKnownRoom = roomId;
  extra.history = history;

  const updates = {
    status: roomId, // Store current room in status
    department: JSON.stringify(extra)
  };

  const { error: updateError } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employee.id);

  if (updateError) {
    console.error('Update error:', updateError);
    return res.status(500).json({ success: false });
  }

  // 3. Notify connected SSE clients
  const eventData = JSON.stringify({
    type: 'ping',
    data: {
      employeeName: employee.name,
      empId: employee.email, // We use email column for empId
      room: roomId,
      timestamp: pingEvent.timestamp
    }
  });

  clients.forEach(client => {
    client.write(`data: ${eventData}\n\n`);
  });

  // 4. Respond to ESP32
  res.json({ success: true });
});

module.exports = router;
