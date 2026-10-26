import Icon, { type IconName } from './Icon';
interface Props { icon: string; label: string; value: string | number; colorClass?: string; trend?: string; trendUp?: boolean; }
export default function StatsCard({ label, value, trend, trendUp }: Props) {
  const name: IconName = /user|ngo|provider|partner/i.test(label) ? 'users' : /match|deliver/i.test(label) ? 'heart' : /history|time|pending/i.test(label) ? 'clock' : /predict|surplus|waste/i.test(label) ? 'chart' : 'box';
  return <div className="stat-card"><div className="stat-heading"><span>{label}</span><span className="stat-icon"><Icon name={name} /></span></div><p className="stat-value">{value}</p>{trend && <p className={`stat-trend ${trendUp ? 'positive' : ''}`}>{trendUp ? '↑' : '↓'} {trend}</p>}</div>;
}
