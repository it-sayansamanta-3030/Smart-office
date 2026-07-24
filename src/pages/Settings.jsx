import { Monitor, Moon, Sun, Briefcase, Droplets, CheckCircle, Activity, LayoutDashboard, Users } from 'lucide-react';

const themes = [
  { id: 'theme-dark', name: 'Dark Mode (Default)', icon: Moon, description: 'Deep space black for reduced eye strain' },
  { id: 'theme-light', name: 'Clean Light', icon: Sun, description: 'Crisp white and gray for bright environments' },
  { id: 'theme-corporate', name: 'Corporate Blue', icon: Briefcase, description: 'Professional navy and slate tones' },
  { id: 'theme-midnight', name: 'Midnight Purple', icon: Monitor, description: 'Sleek dark purple and indigo styling' },
  { id: 'theme-mint', name: 'Fresh Mint', icon: Droplets, description: 'Soft teal and green for a calm interface' }
];

export default function Settings({ currentTheme, setTheme }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Customize your workspace appearance and preferences.</p>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Left Column: Theme Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={20} color="var(--accent-cyan)" />
              Theme Selection
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Select a professional theme for the dashboard. Changes are applied immediately across the entire application.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {themes.map(theme => {
                const isActive = currentTheme === theme.id;
                const Icon = theme.icon;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                      background: isActive ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'var(--bg-surface)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '8px', 
                        background: isActive ? 'var(--gradient-primary)' : 'var(--border-medium)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isActive ? '#fff' : 'var(--text-secondary)'
                      }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{theme.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{theme.description}</span>
                      </div>
                    </div>
                    {isActive && <CheckCircle color="var(--accent-emerald)" size={24} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutDashboard size={20} color="var(--accent-primary)" />
              Live Preview
            </h2>
            
            {/* Mock Dashboard Preview */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>Welcome Back</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>System is operational</p>
                </div>
                <div className="avatar">A</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className="stat-icon primary" style={{ width: '32px', height: '32px' }}><Users size={16} /></div>
                    <span className="stat-trend up" style={{ fontSize: '0.65rem' }}>+12%</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>124</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Employees</div>
                </div>

                <div className="stat-card" style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div className="stat-icon emerald" style={{ width: '32px', height: '32px' }}><Activity size={16} /></div>
                    <span className="stat-trend up" style={{ fontSize: '0.65rem' }}>+5%</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>98%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendance Rate</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '0.9rem' }}>Recent Activity</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: i === 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>System Update</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Theme applied successfully</div>
                      </div>
                      <span className="badge done">Just now</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
