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

  // 1. Find employee by the dedicated empId column
  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .eq('empId', employeeId)
    .single();

  if (fetchError || !employee) {
    console.error('Employee not found:', fetchError);
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  // --- AUTO CHECK-IN LOGIC ---
  if (employee.status !== 'In') {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('attendance')
      .select('*').eq('employeeId', employee.id).eq('date', today).maybeSingle();
      
    if (!existing) {
      const now = new Date();
      const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
      
      const { data: maxIdRecord } = await supabase.from('attendance').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
      const nextId = (maxIdRecord ? maxIdRecord.id : 0) + 1;

      await supabase.from('attendance').insert({
        id: nextId,
        employeeId: employee.id,
        date: today,
        checkIn: checkInTime,
        status: isLate ? 'late' : 'on-time'
      });
    }
  }
  // ---------------------------

  // 2. Update employee record
  const history = employee.history || [];
  const pingEvent = {
    room: roomId,
    timestamp: new Date().toISOString()
  };
  
  history.push(pingEvent);
  
  const updates = {
    status: 'In',
    currentRoom: roomId,
    lastKnownRoom: roomId,
    history: history
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
      empId: employee.empId,
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

// --- LIVE TRACKING BACKGROUND SWEEPER ---
// Runs every 10 seconds to check for timed-out employees
setInterval(async () => {
  try {
    // 1. Fetch all employees currently 'In' a room
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, empId, name, currentRoom, history')
      .eq('status', 'In')
      .not('currentRoom', 'is', null);

    if (error || !employees) return;

    const now = new Date();
    const TIMEOUT_MS = 15000; // 15 seconds

    for (const emp of employees) {
      if (!emp.history || emp.history.length === 0) continue;

      // Check the most recent ping timestamp
      const lastPing = new Date(emp.history[emp.history.length - 1].timestamp);
      
      // If the last ping was more than 60 seconds ago, mark them as 'Out'
      if (now - lastPing > TIMEOUT_MS) {
        // Update database
        await supabase
          .from('employees')
          .update({ currentRoom: null, status: 'Out' })
          .eq('id', emp.id);

        // --- AUTO CHECK-OUT LOGIC ---
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: record } = await supabase.from('attendance')
          .select('*').eq('employeeId', emp.id).eq('date', todayStr).maybeSingle();
          
        if (record) {
           const outNow = new Date();
           const checkOutTime = `${String(outNow.getHours()).padStart(2, '0')}:${String(outNow.getMinutes()).padStart(2, '0')}`;
           await supabase.from('attendance').update({ checkOut: checkOutTime }).eq('id', record.id);
        }
        // ----------------------------

        // Broadcast a timeout SSE event so frontend updates instantly
        const eventData = JSON.stringify({
          type: 'timeout',
          data: {
            empId: emp.empId,
            employeeName: emp.name,
            room: emp.currentRoom
          }
        });

        clients.forEach(client => {
          try {
            client.write(`data: ${eventData}\n\n`);
          } catch(e) {}
        });
        console.log(`[Sweeper] Marked ${emp.empId} as Out (timeout)`);
      }
    }
  } catch (err) {
    console.error('[Sweeper Error]', err);
  }
}, 10000);

module.exports = router;
