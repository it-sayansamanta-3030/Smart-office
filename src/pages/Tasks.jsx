import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getTasks, createTask, updateTask } from '../api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: 1, priority: 'medium' });

  const fetchTasks = () => {
    getTasks().then(res => {
      setTasks(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleDragStart = (e, id) => e.dataTransfer.setData('taskId', id);
  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over');
  
  const handleDrop = async (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    try {
      await updateTask(id, { status });
      fetchTasks();
    } catch (e) { alert(e.message); }
  };

  const handleCreate = async () => {
    if (!newTask.title) return;
    try {
      await createTask(newTask);
      setShowModal(false);
      setNewTask({ title: '', description: '', assigneeId: 1, priority: 'medium' });
      fetchTasks();
    } catch (e) { alert(e.message); }
  };

  const columns = [
    { id: 'todo', title: 'To Do', icon: '📋' },
    { id: 'in_progress', title: 'In Progress', icon: '⏳' },
    { id: 'done', title: 'Done', icon: '✅' }
  ];

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      <div className="page-header animate-in flex justify-between items-end">
        <div>
          <h1>Tasks Board</h1>
          <p>Drag and drop tasks to update progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="kanban-board animate-in">
        {columns.map(col => (
          <div key={col.id} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                {col.icon} {col.title}
              </div>
              <div className="kanban-count">
                {tasks.filter(t => t.status === col.id).length}
              </div>
            </div>
            
            <div 
              className="kanban-cards"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {tasks.filter(t => t.status === col.id).map(task => (
                <div 
                  key={task.id} 
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`badge ${task.priority}`}>{task.priority}</span>
                    <div className="avatar sm">{task.assignee?.avatar || '?'}</div>
                  </div>
                  <h4 className="task-card-title">{task.title}</h4>
                  <p className="task-card-desc">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">Create New Task</h2>
            <div className="flex flex-col gap-4">
              <input 
                placeholder="Task Title" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
              />
              <textarea 
                placeholder="Description" 
                rows={3}
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
              />
              <select 
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate}>Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
