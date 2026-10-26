'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar, { navigation } from './Sidebar';
import Icon from './Icon';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const allowed = !!user && (pathname === '/map' || user.role === 'admin' || pathname.startsWith(`/dashboard/${user.role}`));
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    else if (!loading && user && !allowed) router.replace(`/dashboard/${user.role}`);
  }, [loading, user, allowed, router]);
  useEffect(close, [pathname, close]);
  if (loading || !allowed) return <div className="session-loading" role="status"><span className="spinner" /> Opening your workspace…</div>;
  const title = navigation[user.role].find(item => item.href === pathname)?.label || 'Workspace';
  return <div className="workspace"><a className="skip-link" href="#main-content">Skip to content</a><Sidebar open={open} onClose={close} /><div className="workspace-body"><header className="workspace-topbar"><div className="flex items-center gap-3"><button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(true)}><Icon name="menu" /></button><span className="breadcrumb"><span className="capitalize">{user.role} workspace</span><span aria-hidden="true">/</span><strong>{title}</strong></span></div><div className="flex items-center gap-3"><span className="prototype-chip">Research prototype</span><span className="avatar" title={user.name}>{user.name.charAt(0).toUpperCase()}</span></div></header>{children}<footer className="workspace-footer">SmartSurplus<span>Thoughtful planning. Better food redistribution.</span></footer></div></div>;
}
