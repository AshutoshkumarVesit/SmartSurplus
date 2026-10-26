'use client';

import React, { useEffect, useState } from 'react';
import { ErrorNotice, EmptyState } from '@/components/Feedback';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.getAllUsers().then(setUsers).catch(err => setError(err instanceof Error ? err.message : 'Unable to load data.')).finally(() => setLoading(false)); }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const roleColors: Record<string, string> = { provider: '#487a58', ngo: '#387347', admin: '#92794c' };

  return (
    <div className="page-wrapper">

      <main id="main-content" className="workspace-page space-y-8">
        {error && <ErrorNotice message={error} retry={() => window.location.reload()} />}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{users.length} registered users</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'provider', 'ngo', 'admin'].map(r => (
              <button key={r} aria-pressed={filter === r} onClick={() => setFilter(r)}
                className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: filter === r ? '#edf3e5' : 'var(--surface-container)',
                  color: filter === r ? 'var(--secondary)' : 'var(--on-surface-variant)',
                  border: `1px solid ${filter === r ? '#b9ccab' : 'rgba(68, 71, 86, 0.15)'}`,
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 loading-shimmer" />)}</div>
        ) : (
          <div className="glass-card-static overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-container-low)' }}>
                  {['Name', 'Username', 'Email', 'Role', 'Address', 'Type'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users match this filter.</td></tr>}
                {filtered.map((u, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors" style={{ borderTop: '1px solid rgba(68, 71, 86, 0.1)' }}>
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--on-surface-variant)' }}>@{u.username}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--on-surface-variant)' }}>{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
                        style={{ background: `${roleColors[u.role]}12`, color: roleColors[u.role], border: `1px solid ${roleColors[u.role]}25` }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs max-w-[150px] truncate" style={{ color: 'var(--on-surface-variant)' }}>{u.address || '-'}</td>
                    <td className="py-3 px-4 text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>{u.provider_type || (u.capacity ? `Cap: ${u.capacity}` : '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
