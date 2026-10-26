import Link from 'next/link';
import Icon, { type IconName } from './Icon';
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-banner" role="alert"><span>{message}</span>{retry && <button type="button" onClick={retry}>Try again</button>}</div>;
}
export function LoadingState() {
  return <div role="status" aria-label="Loading workspace data" className="space-y-5"><span className="sr-only">Loading data…</span><div className="grid grid-cols-2 gap-4"><div className="skeleton h-28" /><div className="skeleton h-28" /></div><div className="skeleton h-64" /></div>;
}
export function EmptyState({ title, text, href, action, icon = 'box' }: { title: string; text: string; href?: string; action?: string; icon?: IconName }) {
  return <div className="empty-state"><Icon name={icon} /><h3>{title}</h3><p>{text}</p>{href && <Link href={href}>{action || 'Get started'} →</Link>}</div>;
}
export function StatusBadge({ status }: { status: string }) {
  const kind = ['high','rejected'].includes(status) ? 'danger' : ['pending','medium'].includes(status) ? 'warning' : ['delivered','low','accepted'].includes(status) ? 'success' : '';
  return <span className={`badge ${kind ? `badge-${kind}` : ''}`}>{status.replaceAll('_',' ')}</span>;
}
