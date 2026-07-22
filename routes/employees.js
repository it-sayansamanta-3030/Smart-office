const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

// Helper to encode virtual fields into the existing schema
const encodeEmployee = (emp) => {
  const { id, name, empId, gender, role, currentRoom, lastKnownRoom, timeInRoom, totalHoursToday, history } = emp;
  const extraData = JSON.stringify({
    role,
    currentRoom,
    lastKnownRoom,
    timeInRoom,
    totalHoursToday,
    history: history || []
  });
  return {
    name,
    email: empId,
    avatar: gender,
    status: currentRoom || 'Out',
    department: extraData
  };
};

// Helper to decode virtual fields from the existing schema
const decodeEmployee = (row) => {
  let extra = {};
  try {
    extra = JSON.parse(row.department || '{}');
  } catch (e) {}

  return {
    id: row.id,
    name: row.name,
    empId: row.email,
    gender: row.avatar,
    role: extra.role || row.role || '',
    currentRoom: extra.currentRoom || (['Main Hallway', 'Cafeteria'].includes(row.status) ? row.status : null),
    lastKnownRoom: extra.lastKnownRoom || null,
    timeInRoom: extra.timeInRoom || 0,
    totalHoursToday: extra.totalHoursToday || 0,
    history: extra.history || [],
    status: (extra.currentRoom || ['Main Hallway', 'Cafeteria'].includes(row.status)) ? 'In' : 'Out'
  };
};

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('employees').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success', data: data.map(decodeEmployee) });
});

router.post('/', async (req, res) => {
  const encoded = encodeEmployee(req.body);
  const { data, error } = await supabase.from('employees').insert(encoded).select();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.status(201).json({ status: 'success', data: decodeEmployee(data[0]) });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Need to merge with existing extra data so we don't overwrite currentRoom when editing profile
  const { data: existing } = await supabase.from('employees').select('*').eq('id', id).single();
  if (existing) {
    const decoded = decodeEmployee(existing);
    const updated = { ...decoded, ...req.body };
    const encoded = encodeEmployee(updated);
    
    const { data, error } = await supabase.from('employees').update(encoded).eq('id', id).select();
    if (error) return res.status(500).json({ status: 'error', message: error.message });
    return res.json({ status: 'success', data: decodeEmployee(data[0]) });
  }
  res.status(404).json({ status: 'error', message: 'Not found' });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Clean up foreign key references to avoid constraint errors
  await supabase.from('desks').update({ employeeId: null, status: 'available' }).eq('employeeId', id);
  await supabase.from('tasks').update({ assigneeId: null }).eq('assigneeId', id);
  await supabase.from('attendance').delete().eq('employeeId', id);

  // Now delete the employee
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.json({ status: 'success' });
});

module.exports = router;
