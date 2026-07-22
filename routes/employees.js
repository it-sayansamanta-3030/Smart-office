const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('employees').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  
  // Format data for frontend (e.g. status 'In' vs 'Out')
  const formatted = data.map(row => ({
    ...row,
    status: (row.currentRoom || ['Main Hallway', 'Cafeteria'].includes(row.status)) ? 'In' : 'Out'
  }));

  res.json({ status: 'success', data: formatted });
});

router.post('/', async (req, res) => {
  const payload = {
    empId: req.body.empId,
    name: req.body.name,
    gender: req.body.gender,
    role: req.body.role,
    status: 'Out'
  };
  const { data, error } = await supabase.from('employees').insert(payload).select();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  res.status(201).json({ status: 'success', data: data[0] });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = {
    empId: req.body.empId,
    name: req.body.name,
    gender: req.body.gender,
    role: req.body.role
  };
  const { data, error } = await supabase.from('employees').update(payload).eq('id', id).select();
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  if (!data || data.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });

  res.json({ status: 'success', data: data[0] });
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
