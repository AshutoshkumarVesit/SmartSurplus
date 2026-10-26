'use client';
import React, { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import StatsCard from '@/components/StatsCard';
import { ErrorNotice, EmptyState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load overview.'); }
    finally { setLoading(false); }
  };

  const statusColors: Record<string, string> = { pending: '#c6a15b', accepted: '#87a96b', delivered: '#5d8960', rejected: '#ba7868' };

  return (
    <div className="page-wrapper">
      {/* Background Ambience */}




      <main id="main-content" className="workspace-page space-y-8">
        {error && <ErrorNotice message={error} retry={() => window.location.reload()} />}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Network overview</h1>
            <p className="mt-2 text-slate-500 font-medium">Review partner activity, food records and redistribution status.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm shadow-md">
            <Icon name="refresh" width="15" /> Refresh overview
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-[600px] rounded-2xl bg-[#ffffff] border border-slate-200" />
          </div>
        ) : !stats ? <EmptyState title="Overview unavailable" text="Try refreshing the overview to reconnect to the backend." /> : (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* System Overview */}
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Partner network</h2>
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard icon="🏢" label="Food providers" value={stats.total_providers} colorClass="from-blue-500 to-indigo-600" />
              <StatsCard icon="🤝" label="NGO partners" value={stats.total_ngos} colorClass="from-emerald-400 to-teal-500" />
              <StatsCard icon="📦" label="Food records" value={stats.total_food_entries} colorClass="from-violet-500 to-fuchsia-600" />
              <StatsCard icon="🧠" label="Surplus estimates" value={stats.total_predictions} colorClass="from-amber-400 to-orange-500" />
            </div>

            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Redistribution totals</h2>
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard icon="🔄" label="Active Redistributions" value={stats.active_matches} colorClass="from-blue-500 to-indigo-600" />
              <StatsCard icon="✅" label="Completed Deliveries" value={stats.successful_deliveries} colorClass="from-emerald-400 to-teal-500" />
              <StatsCard icon="⚖️" label="Food received (recorded)" value={`${stats.total_waste_saved_kg} kg`} colorClass="from-violet-500 to-fuchsia-600" />
              <StatsCard icon="🎯" label="Synthetic Test MAE" value={stats.model_test_mae_kg != null ? `${stats.model_test_mae_kg.toFixed(3)} kg` : "Model unavailable"} colorClass="from-blue-400 to-cyan-500" />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              {/* Top Generators Chart */}
              <div className="glass-card p-6 lg:p-8">
                <h3 className="mb-6 text-lg font-bold text-slate-900 tracking-tight">Predicted Surplus by Provider</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.top_generators || []} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5ebdf" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="provider_name" type="category" stroke="#94a3b8" fontSize={12} width={100} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#ffffff', backdropFilter: 'blur(8px)', border: '1px solid #e1e8d8', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#36523b' }} itemStyle={{ color: '#ba7868', fontWeight: 600 }} />
                      <Bar dataKey="total_qty" name="Predicted Surplus (kg)" fill="#ba7868" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Chart */}
              <div className="glass-card p-6 lg:p-8">
                <h3 className="mb-6 text-lg font-bold text-slate-900 tracking-tight">Match status</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(stats.match_status_distribution || {}).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                        {Object.entries(stats.match_status_distribution || {}).map(([name], i) => (
                          <Cell key={i} fill={statusColors[name] || '#334155'}  />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', backdropFilter: 'blur(8px)', border: '1px solid #e1e8d8', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#36523b' }} itemStyle={{ color: '#36523b', fontWeight: 600, textTransform: 'capitalize' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="border-b border-slate-200 bg-[#ffffff]/50 p-6">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Redistributions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#ffffff]/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Provider</th>
                      <th className="px-6 py-4">NGO Match</th>
                      <th className="px-6 py-4">Food Category</th>
                      <th className="px-6 py-4">Volume</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(stats.recent_redistributions || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{row.provider_name}</td>
                        <td className="px-6 py-4 text-emerald-800">{row.ngo_name}</td>
                        <td className="px-6 py-4 capitalize">{row.food_type}</td>
                        <td className="px-6 py-4 font-bold text-slate-600">{row.quantity_kg} kg</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider
                            ${row.status === 'pending' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-400/10 text-amber-500 border border-amber-400/20'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${row.status==='pending'?'bg-red-500':'bg-amber-500'}`}></span>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
