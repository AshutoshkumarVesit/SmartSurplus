'use client';

import React, { useEffect, useState } from 'react';
import { ErrorNotice, EmptyState } from '@/components/Feedback';
import { api } from '@/lib/api';

export default function NgoMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getNgoMatches().then(setMatches).catch(err => setError(err instanceof Error ? err.message : 'Unable to load data.')).finally(() => setLoading(false)); }, []);

  const statusColors: Record<string, string> = { pending: '#c6a15b', accepted: '#487a58', picked_up: '#92794c', delivered: '#387347', rejected: '#ac5860' };

  return (
    <div className="page-wrapper">

      <main id="main-content" className="workspace-page space-y-8">
        {error && <ErrorNotice message={error} retry={() => window.location.reload()} />}
        <h1 className="text-2xl font-semibold tracking-tight mb-2">All Matches</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--on-surface-variant)' }}>Complete history of all surplus-to-NGO matches.</p>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 loading-shimmer" />)}</div>
        ) : (
          <div className="space-y-3">
            {!matches.length && !error && <EmptyState icon="heart" title="No matches yet" text="Your food offers and collection history will appear here." />}
            {matches.map((m, i) => (
              <div key={i} className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${statusColors[m.status]}12` }}>
                    {m.status === 'delivered' ? '✅' : m.status === 'accepted' ? '📦' : '📬'}
                  </div>
                  <div>
                    <p className="font-semibold">{m.provider_name}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{m.food_type} • {m.quantity_kg} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{m.distance_km} km</span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold capitalize"
                    style={{ background: `${statusColors[m.status]}12`, color: statusColors[m.status], border: `1px solid ${statusColors[m.status]}25` }}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
