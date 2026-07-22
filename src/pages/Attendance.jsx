import { useState, useEffect } from 'react';
import { CheckCircle, LogOut } from 'lucide-react';
import { getAttendance, checkIn, checkOut, API_BASE } from '../api';

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    getAttendance().then(res => {
      setLogs(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLogs();
    
    // Listen for SSE updates to refresh data live
    const source = new EventSource(`${API_BASE}/esp32/stream`);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping' || data.type === 'timeout') {
          fetchLogs();
        }
      } catch (e) {}
    };
    return () => source.close();
  }, []);

  const handleAction = async (employeeId, type) => {
    try {
      if (type === 'checkin') await checkIn(employeeId);
      else await checkOut(employeeId);
      fetchLogs();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header animate-in">
        <h1>Attendance</h1>
        <p>Monitor daily check-ins and working hours.</p>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.employeeId}>
                  <td>
                    <div className="employee-row">
                      <div className="avatar">
                        {log.employeeName ? log.employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <div className="employee-name">{log.employeeName || 'Unknown'}</div>
                        <div className="stat-label">{log.employeeRole || 'Employee'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${log.status.replace('_', '-')}`}>
                      {log.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: '#fff' }}>{log.checkIn || '-'}</td>
                  <td style={{ color: '#fff' }}>{log.checkOut || '-'}</td>
                  <td>
                    {!log.checkIn ? (
                      <button className="btn btn-primary" onClick={() => handleAction(log.employeeId, 'checkin')}>
                        <CheckCircle size={16} /> Check In
                      </button>
                    ) : !log.checkOut ? (
                      <button className="btn btn-ghost" onClick={() => handleAction(log.employeeId, 'checkout')}>
                        <LogOut size={16} /> Check Out
                      </button>
                    ) : (
                      <span className="badge done">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
