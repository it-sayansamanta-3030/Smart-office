const express = require('express');
const router = express.Router();
const supabase = require('../data/supabase');

// GET /api/tasks — list all tasks (optional ?status=todo|in-progress|done)
router.get('/', async (req, res) => {
  const { status } = req.query;
  
  let query = supabase.from('tasks').select('*, assignee:employees(*)').order('id');
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ status: 'error', message: error.message });

  const enriched = data.map(t => ({
    ...t,
    assigneeName: t.assignee ? t.assignee.name : 'Unassigned',
    assigneeAvatar: t.assignee ? t.assignee.avatar : '??',
    assignee: undefined
  }));

  res.json({ status: 'success', data: enriched });
});

// POST /api/tasks — create a new task
router.post('/', async (req, res) => {
  const { title, description, priority, assigneeId, deadline, status: taskStatus } = req.body;

  if (!title) return res.status(400).json({ status: 'error', message: 'title is required' });

  // Get max ID to avoid sequence issues with seeded data
  const { data: maxIdTask } = await supabase.from('tasks').select('id').order('id', { ascending: false }).limit(1).maybeSingle();
  const nextId = (maxIdTask ? maxIdTask.id : 0) + 1;

  const { data: newTask, error } = await supabase.from('tasks')
    .insert({
      id: nextId,
      title,
      description: description || '',
      status: taskStatus || 'todo',
      priority: priority || 'medium',
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      deadline: deadline || null,
    })
    .select('*, assignee:employees(*)')
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });

  res.status(201).json({
    status: 'success',
    data: {
      ...newTask,
      assigneeName: newTask.assignee ? newTask.assignee.name : 'Unassigned',
      assigneeAvatar: newTask.assignee ? newTask.assignee.avatar : '??',
      assignee: undefined
    },
  });
});

// PUT /api/tasks/:id — update a task
router.put('/:id', async (req, res) => {
  const { title, description, status: taskStatus, priority, assigneeId, deadline } = req.body;
  
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (taskStatus !== undefined) updates.status = taskStatus;
  if (priority !== undefined) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId ? parseInt(assigneeId) : null;
  if (deadline !== undefined) updates.deadline = deadline;

  const { data: updatedTask, error } = await supabase.from('tasks')
    .update(updates)
    .eq('id', parseInt(req.params.id))
    .select('*, assignee:employees(*)')
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });
  if (!updatedTask) return res.status(404).json({ status: 'error', message: 'Task not found' });

  res.json({
    status: 'success',
    data: {
      ...updatedTask,
      assigneeName: updatedTask.assignee ? updatedTask.assignee.name : 'Unassigned',
      assigneeAvatar: updatedTask.assignee ? updatedTask.assignee.avatar : '??',
      assignee: undefined
    },
  });
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase.from('tasks')
    .delete()
    .eq('id', parseInt(req.params.id))
    .select()
    .single();

  if (error) return res.status(500).json({ status: 'error', message: error.message });
  if (!data) return res.status(404).json({ status: 'error', message: 'Task not found' });

  res.json({ status: 'success', data });
});

module.exports = router;
