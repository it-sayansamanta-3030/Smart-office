const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m; // minutes from midnight
}

function calculateOvertimeMins(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const inMins = parseTime(checkIn);
  const outMins = parseTime(checkOut);
  
  const standardStart = 9 * 60; // 9:00 AM
  const standardEnd = 17 * 60; // 5:00 PM
  
  let ot = 0;
  if (inMins < standardStart) {
    ot += (standardStart - inMins);
  }
  if (outMins > standardEnd) {
    ot += (outMins - standardEnd);
  }
  return ot;
}

function formatMinutes(mins) {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function calculateRealTimeMins(history, targetDate) {
  if (!history || !Array.isArray(history) || history.length === 0) return 0;
  
  const pings = history
    .filter(h => h.timestamp.startsWith(targetDate))
    .map(h => new Date(h.timestamp).getTime())
    .sort((a, b) => a - b);
    
  if (pings.length === 0) return 0;
  
  let totalMs = 0;
  let currentSessionStart = pings[0];
  let lastPing = pings[0];
  
  for (let i = 1; i < pings.length; i++) {
    const ping = pings[i];
    // If gap is less than or equal to 65 seconds (65000ms), continue session
    if (ping - lastPing <= 65000) {
      lastPing = ping;
    } else {
      // Gap too large, close session
      totalMs += (lastPing - currentSessionStart);
      currentSessionStart = ping;
      lastPing = ping;
    }
  }
  // Add the last session
  totalMs += (lastPing - currentSessionStart);
  
  // If there's only 1 ping or very short, give it at least 1 minute if they checked in
  if (totalMs === 0 && pings.length > 0) return 1;
  
  return Math.round(totalMs / 60000);
}

// GET /api/attendance/export?month=YYYY-MM — export CSV
router.get('/export', async (req, res) => {
  const month = req.query.month;
  if (!month) return res.status(400).json({ status: 'error', message: 'month query param required (YYYY-MM)' });
  
  const { data: employees, error: empErr } = await supabase.from('employees').select('*').order('id', { ascending: true });
  if (empErr) return res.status(500).json({ status: 'error', message: empErr.message });
  
  const { data: attendance, error: attErr } = await supabase.from('attendance')
    .select('*')
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`);
  if (attErr) return res.status(500).json({ status: 'error', message: attErr.message });

  // Group attendance by employee and date
  const recordsByEmpAndDate = {};
  attendance.forEach(a => {
    if (!recordsByEmpAndDate[a.employeeId]) recordsByEmpAndDate[a.employeeId] = {};
    recordsByEmpAndDate[a.employeeId][a.date] = a;
  });

  // Get all unique dates in that month from records (or we could generate all days of the month)
  let dates = new Set();
  attendance.forEach(a => dates.add(a.date));
  dates = Array.from(dates).sort();

  let csvContent = 'Employee ID,Name,Date,Status,Time In,Time Out,Real Work Time,Overtime\n';
  
  employees.forEach(emp => {
    dates.forEach(date => {
      const record = recordsByEmpAndDate[emp.id]?.[date];
      if (record) {
        const realTimeMins = calculateRealTimeMins(emp.history, date);
        const otMins = calculateOvertimeMins(record.checkIn, record.checkOut);
        
        csvContent += `${emp.empId},"${emp.name}",${date},${record.status},${record.checkIn || '-'},${record.checkOut || '-'},"${formatMinutes(realTimeMins)}","${formatMinutes(otMins)}"\n`;
      } else {
        // Assume absent if no record for a date where others have records
        csvContent += `${emp.empId},"${emp.name}",${date},Absent,-,-,0m,0m\n`;
      }
    });
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${month}.csv"`);
  res.send(csvContent);
});

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
    const realTimeMins = calculateRealTimeMins(emp.history, targetDate);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      empIdStr: emp.empId,
      date: targetDate,
      status: record ? record.status : 'Absent',
      checkIn: record ? record.checkIn : null,
      checkOut: record ? record.checkOut : null,
      recordId: record ? record.id : null,
      realTimeMins: realTimeMins
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
