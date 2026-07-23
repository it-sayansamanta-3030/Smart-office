import { useState, useEffect } from 'react';
import { getAttendance, API_BASE } from '../api';

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m; // minutes from midnight
};

const formatMinutes = (mins) => {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
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
    if (!log.checkIn) return { text: '-' };
    
    let endMins;
    if (log.checkOut) {
      endMins = parseTime(log.checkOut);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === todayStr) {
        endMins = currentMins;
      } else {
        return { text: 'Missed Check-Out' };
      }
    }
    
    const manualMins = Math.max(0, endMins - parseTime(log.checkIn));
    // Use BLE realTimeMins if available and greater than 0, otherwise fallback to manual difference
    const totalMins = (log.realTimeMins && log.realTimeMins > 0) ? log.realTimeMins : manualMins;
    
    return { text: formatMinutes(totalMins) };
  };

  const getOvertimeStatus = (log) => {
    if (!log.checkIn) return '-';
    
    let endMins;
    if (log.checkOut) {
      endMins = parseTime(log.checkOut);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === todayStr) {
        endMins = currentMins;
      } else {
        return '-'; // Can't compute accurate OT if missed checkout on past day
      }
    }

    const inMins = parseTime(log.checkIn);
    const standardStart = 9 * 60; // 9:00 AM
    const standardEnd = 17 * 60; // 5:00 PM

    let ot = 0;
    if (inMins < standardStart) {
      ot += (standardStart - inMins);
    }
    if (endMins > standardEnd) {
      ot += (endMins - standardEnd);
    }

    if (ot > 0) {
      return <span style={{ color: '#3498db', fontWeight: 'bold' }}>+{formatMinutes(ot)} OT</span>;
    }
    return <span style={{ color: 'rgba(255,255,255,0.4)' }}>None</span>;
  };

  const downloadReport = () => {
    window.location.href = `${API_BASE}/attendance/export?date=${selectedDate}&t=${Date.now()}`;
  };

  return (
    <div>
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Attendance</h1>
          <p>Monitor daily check-ins and accurate real-time working hours.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={downloadReport}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#2980b9'}
            onMouseOut={(e) => e.target.style.background = '#3498db'}
          >
            ↓ Download Daily Report
          </button>
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
                <th>Check In</th>
                <th>Check Out</th>
                <th>Real Work Time</th>
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
                  const { text: workTimeText } = calculateWorkTime(log);
                  
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
                      <td style={{ color: '#fff' }}>{log.checkIn || '-'}</td>
                      <td style={{ color: '#fff' }}>{log.checkOut || (log.checkIn && selectedDate === new Date().toISOString().split('T')[0] ? 'Working...' : '-')}</td>
                      <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>{workTimeText}</td>
                      <td>{getOvertimeStatus(log)}</td>
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
