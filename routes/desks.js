const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

// GET /api/desks — get all desks with occupancy info
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('desks').select('*, employee:employees(*)').order('id');
  if (error) return res.status(500).json({ status: 'error', message: error.message });
  
  const enriched = data.map(d => ({
    ...d,
    employeeName: d.employee ? d.employee.name : null,
    employeeRole: d.employee ? d.employee.role : null,
    employeeAvatar: d.employee ? d.employee.avatar : null,
    employee: undefined // cleanup
  }));
  res.json({ status: 'success', data: enriched });
});

// PUT /api/desks/:id/assign — assign an employee to a desk
router.put('/:id/assign', async (req, res) => {
  const { employeeId } = req.body;
  const deskId = parseInt(req.params.id);

  // Release employee from any other desk
  await supabase.from('desks').update({ employeeId: null, status: 'available' }).eq('employeeId', employeeId);

  // Assign to new desk
  const { data: updatedDesk, error } = await supabase
    .from('desks')
    .update({ employeeId: parseInt(employeeId), status: 'occupied' })
    .eq('id', deskId)
    .select('*, employee:employees(*)')
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.json({
    status: 'success',
    data: {
      ...updatedDesk,
      employeeName: updatedDesk.employee ? updatedDesk.employee.name : null,
      employeeRole: updatedDesk.employee ? updatedDesk.employee.role : null,
      employeeAvatar: updatedDesk.employee ? updatedDesk.employee.avatar : null,
      employee: undefined
    },
  });
});

// PUT /api/desks/:id/release — release a desk
router.put('/:id/release', async (req, res) => {
  const deskId = parseInt(req.params.id);
  const { data, error } = await supabase
    .from('desks')
    .update({ employeeId: null, status: 'available' })
    .eq('id', deskId)
    .select()
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.json({ status: 'success', data });
});

module.exports = router;
