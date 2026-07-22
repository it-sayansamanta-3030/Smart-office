const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/analytics/attendance — attendance stats for charts
router.get('/attendance', async (req, res) => {
  const [{ data: attendance }, { count: totalEmployees }] = await Promise.all([
    supabase.from('attendance').select('*'),
    supabase.from('employees').select('*', { count: 'exact', head: true })
  ]);

  const dates = {};
  const today = todayStr();

  (attendance || []).forEach(r => {
    if (!dates[r.date]) {
      dates[r.date] = { date: r.date, total: 0, onTime: 0, late: 0, absent: 0 };
    }
    dates[r.date].total++;
    if (r.status === 'on-time') dates[r.date].onTime++;
    if (r.status === 'late') dates[r.date].late++;
  });

  // Add absent counts
  Object.values(dates).forEach(d => {
    d.absent = (totalEmployees || 0) - d.total;
  });

  // Sort by date
  const sorted = Object.values(dates).sort((a, b) => a.date.localeCompare(b.date));

  // Today's summary
  const todayRecords = (attendance || []).filter(r => r.date === today);
  const present = todayRecords.length;
  const total = totalEmployees || 0;
  const todaySummary = {
    present,
    absent: total - present,
    late: todayRecords.filter(r => r.status === 'late').length,
    onTime: todayRecords.filter(r => r.status === 'on-time').length,
    total,
    rate: total > 0 ? Math.round((present / total) * 100) : 0,
  };

  res.json({
    status: 'success',
    data: {
      daily: sorted,
      today: todaySummary,
    },
  });
});

// GET /api/analytics/occupancy — desk occupancy stats
router.get('/occupancy', async (req, res) => {
  const { data: desks } = await supabase.from('desks').select('*');
  const dList = desks || [];
  
  const occupied = dList.filter(d => d.status === 'occupied').length;
  const available = dList.filter(d => d.status === 'available').length;
  const away = dList.filter(d => d.status === 'away').length;

  // Zone breakdown
  const zones = {};
  dList.forEach(d => {
    if (!zones[d.zone]) {
      zones[d.zone] = { zone: d.zone, occupied: 0, available: 0, away: 0, total: 0 };
    }
    zones[d.zone][d.status]++;
    zones[d.zone].total++;
  });

  res.json({
    status: 'success',
    data: {
      total: dList.length,
      occupied,
      available,
      away,
      rate: dList.length > 0 ? Math.round((occupied / dList.length) * 100) : 0,
      zones: Object.values(zones),
    },
  });
});

// GET /api/analytics/tasks — task completion metrics
router.get('/tasks', async (req, res) => {
  const [{ data: tasks }, { data: employees }] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('employees').select('*')
  ]);

  const tList = tasks || [];
  const eList = employees || [];

  const todo = tList.filter(t => t.status === 'todo').length;
  const inProgress = tList.filter(t => t.status === 'in-progress').length;
  const done = tList.filter(t => t.status === 'done').length;
  const total = tList.length;

  // Priority breakdown
  const high = tList.filter(t => t.priority === 'high').length;
  const medium = tList.filter(t => t.priority === 'medium').length;
  const low = tList.filter(t => t.priority === 'low').length;

  // Top performers (most completed tasks)
  const completedByEmployee = {};
  tList.filter(t => t.status === 'done').forEach(t => {
    if (t.assigneeId) {
      completedByEmployee[t.assigneeId] = (completedByEmployee[t.assigneeId] || 0) + 1;
    }
  });

  const topPerformers = Object.entries(completedByEmployee)
    .map(([empId, count]) => {
      const emp = eList.find(e => e.id === parseInt(empId));
      return { employeeId: parseInt(empId), name: emp ? emp.name : 'Unknown', avatar: emp ? emp.avatar : '??', completed: count };
    })
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  res.json({
    status: 'success',
    data: {
      total,
      todo,
      inProgress,
      done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      priority: { high, medium, low },
      topPerformers,
    },
  });
});

module.exports = router;
