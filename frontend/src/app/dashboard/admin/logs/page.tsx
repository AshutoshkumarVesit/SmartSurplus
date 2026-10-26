'use client';

import React, { useEffect, useState } from 'react';
import { ErrorNotice, EmptyState } from '@/components/Feedback';
import { api } from '@/lib/api';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getLogs().then(setLogs).catch(err => setError(err instanceof Error ? err.message : 'Unable to load data.')).finally(() => setLoading(false)); }, []);

  const actionColors: Record<string, string> = { delivered: '#387347', accepted: '#487a58', rejected: '#ac5860', pending: '#c6a15b' };

  return (
    <div className="page-wrapper">

      <main id="main-content" className="workspace-page space-y-8">
        {error && <ErrorNotice message={error} retry={() => window.location.reload()} />}
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Redistribution Logs</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--on-surface-variant)' }}>Audit trail of all redistribution activities.</p>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 loading-shimmer" />)}</div>
        ) : logs.length === 0 ? (
          <div className="glass-card-static p-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold">No redistribution logs yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Logs will appear here as redistributions happen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice().reverse().map((log, i) => (
              <div key={i} className="glass-card p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${actionColors[log.action] || '#717584'}12` }}>
                    {log.action === 'delivered' ? '✅' : log.action === 'accepted' ? '✔️' : '❌'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      <span style={{ color: 'var(--secondary)' }}>{log.provider_name}</span>
                      {' → '}
                      <span style={{ color: 'var(--primary)' }}>{log.ngo_name}</span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.food_type} • {log.quantity_kg} kg</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
                    style={{ background: `${actionColors[log.action]}12`, color: actionColors[log.action], border: `1px solid ${actionColors[log.action]}25` }}>
                    {log.action}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{log.timestamp?.slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
