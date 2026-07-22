export default function StatsCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  const isUp = trend >= 0;
  
  return (
    <div className="glass-card stat-card animate-in">
      <div className="stat-card-header">
        <div className={`stat-icon ${color}`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`stat-trend ${isUp ? 'up' : 'down'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  );
}
