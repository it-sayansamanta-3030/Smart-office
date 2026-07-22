import { useState, useEffect } from 'react';
import { getAttendance, API_BASE } from '../api';

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m; // minutes from midnight
};

const formatMinutes = (mins) => {
  if (mins < 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMins, setCurrentMins] = useState(new Date().getHours() * 60 + new Date().getMinutes());

  // Update current time every minute for live working time calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMins(new Date().getHours() * 60 + new Date().getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchLogs = (dateStr) => {
    getAttendance(dateStr).then(res => {
      setLogs(res.data);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs(selectedDate);
    
    const source = new EventSource(`${API_BASE}/esp32/stream`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping' || data.type === 'timeout') {
          fetchLogs(selectedDate);
        }
      } catch (e) {}
    };
    
    // Fallback: Hard refresh from database every 15 seconds
    const pollTimer = setInterval(() => fetchLogs(selectedDate), 15000);
    
    return () => {
      source.close();
      clearInterval(pollTimer);
    };
  }, [selectedDate]);

  const calculateWorkTime = (log) => {
    if (!log.checkIn) return { totalMins: 0, text: '-' };
    let endMins;
    if (log.checkOut) {
      endMins = parseTime(log.checkOut);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === todayStr) {
        endMins = currentMins;
      } else {
        return { totalMins: 0, text: 'Missed Check-Out' };
      }
    }
    const totalMins = Math.max(0, endMins - parseTime(log.checkIn));
    return { totalMins, text: formatMinutes(totalMins) };
  };

  const getOvertimeStatus = (totalMins) => {
    if (totalMins === 0) return '-';
    const target = 8 * 60; // 480 mins
    if (totalMins < target) {
      return <span style={{ color: '#f39c12' }}>{formatMinutes(target - totalMins)} remaining</span>;
    } else if (totalMins === target) {
      return <span style={{ color: '#2ecc71' }}>Goal Reached</span>;
    } else {
      return <span style={{ color: '#3498db' }}>+{formatMinutes(totalMins - target)} Overtime</span>;
    }
  };

  return (
    <div>
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Attendance</h1>
          <p>Monitor daily check-ins and working hours.</p>
        </div>
        <div>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#1a1f2e',
              color: 'white',
              fontSize: '1rem',
              colorScheme: 'dark'
            }}
          />
        </div>
      </div>

      <div className="glass-card animate-in">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Time</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No records found.</td></tr>
              ) : (
                logs.map((log) => {
                  const { totalMins, text: workTimeText } = calculateWorkTime(log);
                  
                  return (
                    <tr key={log.employeeId}>
                      <td>
                        <div className="employee-row">
                          <div className="avatar" style={{ opacity: log.status === 'Absent' ? 0.5 : 1 }}>
                            {log.employeeName ? log.employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <div className="employee-name">{log.employeeName || 'Unknown'}</div>
                            <div className="stat-label">{log.employeeRole || 'Employee'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${log.status.toLowerCase() === 'absent' ? 'absent' : log.status.replace('_', '-')}`} 
                              style={log.status.toLowerCase() === 'absent' ? { background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' } : {}}>
                          {log.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: '#fff' }}>{log.checkIn || '-'}</td>
                      <td style={{ color: '#fff' }}>{log.checkOut || (log.checkIn && selectedDate === new Date().toISOString().split('T')[0] ? 'Working...' : '-')}</td>
                      <td style={{ color: '#fff', fontWeight: 'bold' }}>{workTimeText}</td>
                      <td>{getOvertimeStatus(totalMins)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
