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
    <div>
      <div className="page-header animate-in" style={{ borderLeft: '4px solid #ef4444', paddingLeft: '16px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
          <ShieldAlert size={32} />
          Emergency Mode
        </h1>
        <p>Real-time headcount and location tracking.</p>
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
          <div key={room} className="glass-card animate-in">
            <div className="chart-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 className="chart-card-title">{room}</h3>
              <p className="chart-card-subtitle">Headcount: {groupedByRoom[room].length}</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupedByRoom[room].length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No one detected in this room.</p>
              ) : (
                groupedByRoom[room].map(emp => (
                  <div key={emp.empId || emp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#e2e8f0' }}>
                      {emp.avatar || (emp.name ? emp.name.substring(0, 2).toUpperCase() : '??')}
                    </div>
                    <div>
                      <h4 style={{ color: '#e2e8f0', fontWeight: 500 }}>{emp.name}</h4>
                      <p style={{ color: '#94a3b8', fontSize: '13px' }}>ID: {emp.empId || `N/A`} • Dept: {emp.department}</p>
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
