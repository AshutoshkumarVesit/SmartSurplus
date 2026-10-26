'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Brand from './Brand';
import Icon, { type IconName } from './Icon';

type NavItem = { label: string; icon: IconName; href: string; research?: boolean };
export const navigation: Record<string, NavItem[]> = {
  provider: [
    { label: 'Overview', icon: 'grid', href: '/dashboard/provider' },
    { label: 'Food preparation', icon: 'plus', href: '/dashboard/provider/upload' },
    { label: 'Surplus predictions', icon: 'chart', href: '/dashboard/provider/predictions' },
    { label: 'Network map', icon: 'map', href: '/map' },
    { label: 'Measured waste', icon: 'chart', href: '/dashboard/provider/research', research: true },
    { label: 'NGO matching lab', icon: 'heart', href: '/dashboard/provider/matching', research: true },
  ],
  ngo: [
    { label: 'Overview', icon: 'grid', href: '/dashboard/ngo' },
    { label: 'Food matches', icon: 'heart', href: '/dashboard/ngo/matches' },
    { label: 'Network map', icon: 'map', href: '/map' },
  ],
  admin: [
    { label: 'Overview', icon: 'grid', href: '/dashboard/admin' },
    { label: 'People & partners', icon: 'users', href: '/dashboard/admin/users' },
    { label: 'Redistribution log', icon: 'list', href: '/dashboard/admin/logs' },
    { label: 'Network map', icon: 'map', href: '/map' },
    { label: 'Measured waste', icon: 'chart', href: '/dashboard/provider/research', research: true },
    { label: 'NGO matching lab', icon: 'heart', href: '/dashboard/provider/matching', research: true },
  ],
};
export default function Sidebar({ open = false, onClose = () => {} }: { open?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const panel = useRef<HTMLElement>(null);
  const [mobile, setMobile] = useState(false);
  const items = navigation[user?.role || 'provider'];
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => { setMobile(query.matches); if (!query.matches) onClose(); };
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [onClose]);
  useEffect(() => { if (panel.current) panel.current.inert = mobile && !open; }, [mobile, open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || []).filter(el => el.getClientRects().length > 0);
    elements()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const targets = elements();
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [open, onClose]);
  return <>
    {open && <button className="sidebar-backdrop" aria-label="Close navigation" tabIndex={-1} onClick={onClose} />}
    <aside id="workspace-navigation" ref={panel} className={`workspace-sidebar ${open ? 'is-open' : ''}`} aria-hidden={mobile && !open || undefined} aria-label="Workspace navigation" role={open ? 'dialog' : undefined} aria-modal={open || undefined}>
      <div className="sidebar-brand"><Brand /><button className="icon-button mobile-menu" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div>
      <div className="sidebar-section-label">Your workspace</div>
      <nav className="sidebar-nav">{[false, true].map(research => <div key={String(research)}>{research && items.some(i => i.research) && <p className="sidebar-section-label research-label">Research tools</p>}{items.filter(i => !!i.research === research).map(item => <Link key={item.href} href={item.href} onClick={onClose} aria-current={pathname === item.href ? 'page' : undefined} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}><Icon name={item.icon} /><span>{item.label}</span>{pathname === item.href && <span className="active-dot" />}</Link>)}</div>)}</nav>
      <div className="sidebar-note"><Icon name="leaf" /><p>Good food deserves<br /><strong>a second destination.</strong></p></div>
      <div className="sidebar-account"><span className="avatar">{user?.name.charAt(0).toUpperCase()}</span><div><strong>{user?.name}</strong><span className="capitalize">{user?.role} account</span></div><button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button></div>
    </aside>
  </>;
}
