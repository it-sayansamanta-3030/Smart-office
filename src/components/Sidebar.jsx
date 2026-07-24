import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, ListTodo, Activity, Menu, X, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: Users, label: 'Attendance' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <>
      <button className="mobile-toggle text-textPrimary" onClick={toggle}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={toggle} />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Activity size={24} color="white" />
          </div>
          <div>
            <h2>SmartOffice</h2>
            <span>Workspace OS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink 
              key={to} 
              to={to} 
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 16px', marginTop: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink 
            to="/emergency" 
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <Activity color="#ef4444" />
            <span style={{ fontWeight: 600 }}>Emergency Mode</span>
          </NavLink>

          <button 
            onClick={() => {
              setIsOpen(false);
              onLogout && onLogout();
            }}
            className="sidebar-link"
            style={{ width: '100%', textAlign: 'left', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)', cursor: 'pointer' }}
          >
            <LogOut />
            <span style={{ fontWeight: 500 }}>Sign Out</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="status-dot"></div>
            <span>System Operational</span>
          </div>
        </div>
      </aside>
    </>
  );
}
