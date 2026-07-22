import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Plus, MapPin, Search, Edit, Trash2 } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, API_BASE } from '../api';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ empId: '', name: '', gender: '', role: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ESP32 Connection state (mock)
  const [espConnected, setEspConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    
    const source = new EventSource(`${API_BASE}/esp32/stream`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping' || data.type === 'timeout') {
          // Re-fetch to get updated state
          fetchEmployees();
        }
      } catch (e) {}
    };
    
    // Fallback: Hard refresh from database every 15 seconds in case Render drops the live stream
    const pollTimer = setInterval(() => fetchEmployees(), 15000);
    
    return () => {
      source.close();
      clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveTime = (emp) => {
    if (!emp.currentRoom || !emp.history || emp.history.length === 0) return '-';
    const lastEvent = emp.history[emp.history.length - 1];
    if (lastEvent.room !== emp.currentRoom) return '-';
    
    const entryTime = new Date(lastEvent.timestamp);
    const diffMs = Math.max(0, currentTime - entryTime);
    
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({ 
        empId: emp.empId || '', 
        name: emp.name || '', 
        gender: emp.gender || '', 
        role: emp.role || '' 
      });
    } else {
      setEditingId(null);
      setFormData({ empId: '', name: '', gender: '', role: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        empId: formData.empId,
        name: formData.name,
        role: formData.role,
        gender: formData.gender,
      };

      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      fetchEmployees();
      handleCloseModal();
    } catch (err) {
      alert('Error saving employee: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Error deleting employee: ' + err.message);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.empId?.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = employees.filter(emp => emp.status === 'In' || (emp.currentRoom && emp.currentRoom !== 'None')).length;
  const totalCount = employees.length;

  const mainHallway = employees.filter(e => e.currentRoom === 'Main Hallway');
  const cafeteria = employees.filter(e => e.currentRoom === 'Cafeteria');

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="page-header animate-in" style={{ margin: 0 }}>
          <h1>Dashboard</h1>
          <p>Live overview of office occupancy</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '8px 16px', borderRadius: '8px', 
            backgroundColor: espConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: espConnected ? '#10b981' : '#ef4444',
            border: `1px solid ${espConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}>
            {espConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span style={{ fontWeight: 600, fontSize: '14px' }}>System {espConnected ? 'Online' : 'Offline'}</span>
          </div>

          <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>{presentCount} / {totalCount}</span>
            <span style={{ color: '#94a3b8', fontSize: '14px', marginLeft: '6px' }}>Present</span>
          </div>

          <button 
            onClick={() => setEspConnected(!espConnected)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: '8px', 
              backgroundColor: '#1e293b', color: '#e2e8f0', 
              border: '1px solid #334155', cursor: 'pointer' 
            }}
          >
            <Wifi size={16} /> Connect ESP32
          </button>

          <button 
            onClick={() => handleOpenModal()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: '8px', 
              backgroundColor: '#3b82f6', color: '#fff', 
              border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Room Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Main Hallway */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
              <MapPin size={20} color="#3b82f6" /> Main Hallway
            </h3>
            <span style={{ padding: '4px 12px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
              {mainHallway.length} Employees
            </span>
          </div>
          {mainHallway.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>Room is empty</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mainHallway.map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span style={{ color: '#e2e8f0' }}>{emp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cafeteria */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
              <MapPin size={20} color="#3b82f6" /> Cafeteria
            </h3>
            <span style={{ padding: '4px 12px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
              {cafeteria.length} Employees
            </span>
          </div>
          {cafeteria.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>Room is empty</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cafeteria.map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span style={{ color: '#e2e8f0' }}>{emp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Data Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px', width: '300px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', 
              backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', outline: 'none' 
            }}
          />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Current Location</th>
                <th>Time in Room</th>
                <th>Total Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-row">
                      <div className="avatar" style={{ fontSize: '12px', width: '36px', height: '36px' }}>
                        {emp.name ? emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <div className="employee-name">{emp.name}</div>
                        <div className="stat-label">ID: {emp.empId || '-'} • {emp.role || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: emp.status === 'In' ? '#10b981' : '#ef4444' }}></div>
                      <span style={{ color: emp.status === 'In' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{emp.status || 'Out'}</span>
                    </div>
                  </td>
                  <td style={{ color: '#e2e8f0' }}>{emp.currentRoom || '-'}</td>
                  <td style={{ color: '#94a3b8' }}>{formatLiveTime(emp)}</td>
                  <td style={{ color: '#94a3b8' }}>-</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(emp)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(emp.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-card" style={{ width: '400px', padding: '24px', backgroundColor: '#0f172a' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px' }}>{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Employee ID (e.g., EM001)</label>
                <input required type="text" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Gender</label>
                <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Role</label>
                <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #334155', color: '#e2e8f0', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
