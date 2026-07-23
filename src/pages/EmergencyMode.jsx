import { useState, useEffect } from 'react';
import { ShieldAlert, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../api';

export default function EmergencyMode() {
  const [employees, setEmployees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`);
      const json = await res.json();
      if (json.status === 'success') {
        setEmployees(json.data.employees);
        setRooms(json.data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch emergency state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Poll every 5 seconds to keep emergency view up-to-date
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8">Loading Emergency Data...</div>;

  const validRooms = ["Main Hallway", "Cafeteria"];

  // Group employees by room. We only consider valid rooms.
  // Anyone with a lastKnownRoom that is not a valid room is considered Unaccounted For or simply not in those rooms.
  // The requirement says: "shows every employee's lastKnownRoom, grouped by room... grouping should only ever show these 2 rooms".
  
  const groupedByRoom = {};
  validRooms.forEach(room => {
    groupedByRoom[room] = [];
  });

  let accountedFor = 0;
  let unaccountedFor = 0;

  employees.forEach(emp => {
    if (emp.lastKnownRoom && validRooms.includes(emp.lastKnownRoom)) {
      groupedByRoom[emp.lastKnownRoom].push(emp);
      accountedFor++;
    } else {
      unaccountedFor++;
    }
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px',
        padding: '24px', borderRadius: '16px',
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
        borderLeft: '4px solid #ef4444',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <ShieldAlert size={40} color="#ef4444" />
        </div>
        <div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Emergency Command Center
          </h1>
          <p style={{ color: '#fca5a5', margin: 0, fontSize: '15px' }}>Real-time evacuation & headcount tracking active.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <Users size={24} color="#ef4444" />
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Total Employees</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{employees.length}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle size={24} color="#10b981" />
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Accounted For</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{accountedFor}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.1)' }}>
              <AlertTriangle size={24} color="#f59e0b" />
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Unaccounted For</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{unaccountedFor}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {validRooms.map(room => (
          <div key={room} style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.02)'
          }}>
            <div style={{ 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              paddingBottom: '16px', marginBottom: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>{room}</h3>
              <span style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', 
                padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 
              }}>
                {groupedByRoom[room].length} Personnel
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedByRoom[room].length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No one detected in this room.</p>
              ) : (
                groupedByRoom[room].map(emp => (
                  <div key={emp.empId || emp.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{ 
                      width: '44px', height: '44px', borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 600, color: '#e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {emp.avatar || (emp.name ? emp.name.substring(0, 2).toUpperCase() : '??')}
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 600, margin: '0 0 4px 0', fontSize: '15px' }}>{emp.name}</h4>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>ID: <span style={{ color: '#e2e8f0' }}>{emp.empId || `N/A`}</span> • Role: <span style={{ color: '#e2e8f0' }}>{emp.role || 'Employee'}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
