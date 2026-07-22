const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/attendance — get attendance records (optional ?date=YYYY-MM-DD filter)
router.get('/', async (req, res) => {
  const targetDate = req.query.date || todayStr();
  
  // Fetch all employees
  const { data: employees, error: empErr } = await supabase.from('employees').select('*').order('id', { ascending: true });
  if (empErr) return res.status(500).json({ status: 'error', message: empErr.message });

  // Fetch attendance records for the target date
  const { data: attendance, error: attErr } = await supabase.from('attendance')
    .select('*')
    .eq('date', targetDate);
  if (attErr) return res.status(500).json({ status: 'error', message: attErr.message });

  // Merge them
  const enriched = employees.map(emp => {
    const record = attendance.find(a => a.employeeId === emp.id);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      empIdStr: emp.empId,
      date: targetDate,
      status: record ? record.status : 'Absent', // e.g. on-time, late, or Absent
      checkIn: record ? record.checkIn : null,
      checkOut: record ? record.checkOut : null,
      recordId: record ? record.id : null
    };
  });

  res.json({ status: 'success', data: enriched });
});

// POST /api/attendance/checkin — clock in
router.post('/checkin', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ status: 'error', message: 'employeeId is required' });

  const today = todayStr();
  
  // Check if already checked in
  const { data: existing } = await supabase.from('attendance')
    .select('*').eq('employeeId', employeeId).eq('date', today).maybeSingle();
    
  if (existing) {
    return res.status(409).json({ status: 'error', message: 'Already checked in today' });
  }

  const now = new Date();
  const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

  // Get max ID
  const { data: maxIdRecord } = await supabase.from('attendance').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
  const nextId = (maxIdRecord ? maxIdRecord.id : 0) + 1;

  const { data: record, error } = await supabase.from('attendance')
    .insert({
      id: nextId,
      employeeId: parseInt(employeeId),
      date: today,
      checkIn: checkInTime,
      status: isLate ? 'late' : 'on-time'
    })
    .select('*, employee:employees(*)')
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.status(201).json({
    status: 'success',
    data: {
      ...record,
      employeeName: record.employee ? record.employee.name : 'Unknown',
      employeeRole: record.employee ? record.employee.role : '',
      employeeAvatar: record.employee ? record.employee.avatar : '??',
      employee: undefined
    },
  });
});

// POST /api/attendance/checkout — clock out
router.post('/checkout', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ status: 'error', message: 'employeeId is required' });

  const today = todayStr();
  const { data: record, error: fetchErr } = await supabase.from('attendance')
    .select('*').eq('employeeId', employeeId).eq('date', today).maybeSingle();

  if (fetchErr) return res.status(500).json({ status: 'error', message: fetchErr.message });
  if (!record) return res.status(404).json({ status: 'error', message: 'No check-in found for today' });
  if (record.checkOut) return res.status(409).json({ status: 'error', message: 'Already checked out today' });

  const now = new Date();
  const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { data: updated, error } = await supabase.from('attendance')
    .update({ checkOut: checkOutTime })
    .eq('id', record.id)
    .select('*, employee:employees(*)')
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.json({
    status: 'success',
    data: {
      ...updated,
      employeeName: updated.employee ? updated.employee.name : 'Unknown',
      employeeRole: updated.employee ? updated.employee.role : '',
      employeeAvatar: updated.employee ? updated.employee.avatar : '??',
      employee: undefined
    },
  });
});

module.exports = router;
