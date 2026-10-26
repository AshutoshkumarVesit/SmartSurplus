'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { ErrorNotice, EmptyState } from '@/components/Feedback';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPredictions()
      .then(setPredictions)
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const trendData = predictions.slice(-20).map(p => ({
    name: `${p.food_type.charAt(0).toUpperCase() + p.food_type.slice(1)} (${p.expiry_hours || 6}h)`,
    surplus: p.predicted_surplus_kg,
  }));

  const riskColors: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-400/10', text: 'text-amber-500', border: 'border-amber-400/20', dot: 'bg-amber-500' },
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  };

  return (
    <div className="page-wrapper">
      {/* Background Ambience */}



      <main id="main-content" className="workspace-page space-y-8">
        {error && <ErrorNotice message={error} retry={() => window.location.reload()} />}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-gradient">Experimental Surplus Forecast</h1>
          <p className="mt-2 text-slate-500 font-medium">This model uses synthetic training data. Its unserved-surplus target has no compatible real field validation yet.</p>
          <a href="/dashboard/provider/research" className="inline-block mt-3 text-emerald-800 underline">Open the separate measured kitchen + serving waste experiment</a>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[#ffffff] border border-slate-200 rounded-2xl" />)}
          </div>
        ) : (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Trend Chart */}
            <div className="glass-card p-6 lg:p-8 mb-8 pb-16">
              <h3 className="mb-6 text-lg font-bold text-slate-900 tracking-tight">Predicted Surplus Trend</h3>
              <div className="w-full mt-4 overflow-x-auto pb-4 custom-scrollbar">
                <div style={{ minWidth: `${Math.max(800, trendData.length * 60)}px`, height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 80 }} barCategoryGap="20%">
                      <defs>
                        <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5e8550" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#5e8550" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5ebdf" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tick={{ angle: -90, textAnchor: 'end', dy: 10 }} height={120} interval={0} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: '#ffffff', backdropFilter: 'blur(10px)', border: '1px solid #e1e8d8', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#36523b' }} />
                      <Bar dataKey="surplus" fill="url(#surplusGrad)" radius={[6, 6, 0, 0]} barSize={40} name="Surplus Amount (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Model Predictions List */}
            <div className="space-y-4">
              {!predictions.length && !error && <EmptyState icon="chart" title="No surplus estimates yet" text="Add a food preparation record to generate your first estimate." href="/dashboard/provider/upload" action="Add food record" />}
              {predictions.slice().reverse().map((p, i) => {
                const colors = riskColors[p.waste_risk] || riskColors.low;
                return (
                  <div key={i} className="glass-card p-5 animate-fade-in  transition-transform" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${colors.bg} ${colors.border}`}>
                          <Icon name="chart" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg capitalize tracking-tight">{p.food_type}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                            <span className="text-slate-500">Input: <span className="text-slate-900">{p.actual_quantity_kg} kg</span></span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">Surplus: <span className="text-emerald-800 font-bold">{p.predicted_surplus_kg} kg</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-start sm:self-center">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{p.prediction_lower_kg != null ? `${p.prediction_lower_kg.toFixed(2)}–${p.prediction_upper_kg.toFixed(2)} kg` : "History incomplete"}</p>
                          <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">90% interval · synthetic calibration</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}>
                          <span className={`h-2 w-2 rounded-full ${colors.dot} animate-pulse`}></span>
                          {p.waste_risk}
                        </span>
                      </div>
                    </div>

                    {p.recommendations?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 pl-2 border-l-2 border-l-blue-500">
                        <p className="text-sm font-medium text-emerald-800">
                          <span className="text-emerald-800 mr-2">→</span> {p.recommendations[0]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
