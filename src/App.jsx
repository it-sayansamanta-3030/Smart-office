import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import EmergencyMode from './pages/EmergencyMode';
import Login from './pages/Login';
import { ShieldAlert, X } from 'lucide-react';
import { API_BASE } from './api';

export default function App() {
  const [toast, setToast] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state on load
  useEffect(() => {
    const auth = localStorage.getItem('admin_office_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('admin_office_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_office_auth');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Connect to SSE stream for real-time ESP32 ping alerts
    const source = new EventSource(`${API_BASE}/esp32/stream`);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
          setToast(data.data);
          // Auto-hide toast after 5 seconds
          setTimeout(() => setToast(null), 5000);
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    return () => source.close();
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout bg-bgPrimary relative">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/emergency" element={<EmergencyMode />} />
        </Routes>
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div 
          className="animate-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1e293b',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
        >
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.2)' }}>
            <ShieldAlert size={20} color="#3b82f6" />
          </div>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Real-time Detection</h4>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              <strong style={{ color: '#e2e8f0' }}>{toast.employeeName}</strong> detected at <strong style={{ color: '#e2e8f0' }}>{toast.room}</strong>
            </p>
          </div>
          <button onClick={() => setToast(null)} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
