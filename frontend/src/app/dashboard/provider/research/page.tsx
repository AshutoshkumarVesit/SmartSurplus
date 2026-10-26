'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { historyCSV, parseWasteHistory } from '@/lib/measured-waste';
import type { WasteInfo, WasteBenchmark, WasteExample, WasteForecast, WasteMethod } from '@/lib/measured-waste';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const labels: Record<string, string> = { LightGBM: 'LightGBM', RandomForest: 'Random Forest', TrainingMedian: 'Training median', Past5DayMean: 'Past-five-day mean', PreviousMeasuredDay: 'Previous measured day' };
const methods = ['LightGBM', 'RandomForest', 'TrainingMedian', 'Past5DayMean', 'PreviousMeasuredDay'];

export default function MeasuredWastePage() {
  const [info, setInfo] = useState<WasteInfo | null>(null);
  const [benchmark, setBenchmark] = useState<WasteBenchmark | null>(null);
  const [example, setExample] = useState<WasteExample | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState('');
  const [menu, setMenu] = useState('');
  const [history, setHistory] = useState('');
  const [method, setMethod] = useState<WasteMethod>('default');
  const [context, setContext] = useState<'source_school_replay' | 'new_canteen_exploration'>('new_canteen_exploration');
  const [forecast, setForecast] = useState<WasteForecast | null>(null);
  const [segment, setSegment] = useState('all_test');

  useEffect(() => {
    Promise.all([api.getWasteInfo(), api.getWasteBenchmark()])
      .then(([i, b]) => { setInfo(i); setBenchmark(b); })
      .catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const edited = () => { setForecast(null); setContext('new_canteen_exploration'); setError(''); };
  const loadExample = async (serviceDate?: string) => {
    setBusy(true); setError(''); setForecast(null);
    try {
      const x = await api.getWasteExample(serviceDate);
      setExample(x); setDate(x.request.service_date); setMenu(String(x.request.menu_code));
      setHistory(historyCSV(x.request.history)); setContext('source_school_replay');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load source records.'); }
    finally { setBusy(false); }
  };
  const runForecast = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setForecast(null);
    try {
      setForecast(await api.forecastWaste({ service_date: date, menu_code: Number(menu),
        history: parseWasteHistory(history), method, context }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Forecast failed.'); }
    finally { setBusy(false); }
  };
  const uploadHistory = async (file?: File) => {
    if (!file) return;
    setError('');
    if (file.size > 100_000) { setError('History CSV must be smaller than 100 KB.'); return; }
    try { const text = await file.text(); parseWasteHistory(text); setHistory(text); edited(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Invalid history CSV.'); }
  };
  const data = benchmark ? Object.values(benchmark.predictions.reduce<Record<string, Record<string, string | number>>>((acc, p) => {
    if (!acc[p.date]) acc[p.date] = { date: p.date, measured: p.actual_kg };
    acc[p.date][p.method] = p.predicted_kg; return acc;
  }, {})) : [];
  const scores = benchmark?.results.filter(r => r.segment === segment) || [];

  return <div className="page-wrapper">

    <main id="main-content" className="workspace-page space-y-8">
      <header>
        <p className="text-xs uppercase tracking-wide text-emerald-800 mb-2">Prediction research · real measured records</p>
        <h1 className="text-3xl font-bold">Measured Waste Forecast</h1>
        <p className="mt-3 text-slate-600 max-w-3xl">Estimate daily kitchen + serving waste. Compare Random Forest, LightGBM and simple history baselines on a dated school dataset.</p>
      </header>
      {error && <div role="alert" className="p-4 rounded-lg border border-red-400/40 text-red-700 bg-red-50">{error}</div>}
      {loading && <p role="status">Loading measured-data experiment…</p>}
      {info && benchmark && <>
        <section className="p-5 rounded-xl border border-amber-400/30 bg-amber-50">
          <h2 className="font-semibold text-amber-800">Research scope</h2>
          <p className="mt-2 text-sm leading-relaxed">This target includes kitchen and serving waste. It does not estimate donatable unserved food. Forecasts on this page create no food listing or NGO match. Pure-surplus prediction and NGO allocation remain separate research tracks.</p>
          <p className="mt-2 text-sm text-slate-600">The models were trained on one Finnish school. Accuracy at other canteens has not been established.</p>
        </section>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Measured source days</p><p className="text-2xl font-semibold mt-2">{info.source.rows}</p></div>
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Train / validation / test days</p><p className="text-2xl font-semibold mt-2">80 / 25 / 30</p><p className="text-xs text-slate-500 mt-2">20 earlier days provide history.</p></div>
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Default selected on validation</p><p className="text-2xl font-semibold mt-2">{labels[info.default_method]}</p><p className="text-xs text-slate-500 mt-2">MAE {info.validation_mae_kg[info.default_method].toFixed(3)} kg/day</p></div>
        </div>
        <section className="space-y-4">
          <div className="flex flex-wrap justify-between gap-4 items-center">
            <h2 className="text-xl font-semibold">Observed test performance</h2>
            <label className="text-sm text-slate-600">Test segment <select value={segment} onChange={e => setSegment(e.target.value)} className="ml-2 p-2 bg-white border border-slate-300 rounded">
              <option value="all_test">All 30 days</option><option value="baseline_test">10 baseline days</option><option value="intervention_test">20 intervention days</option>
            </select></label>
          </div>
          <p className="text-sm text-slate-500">{info.split.test_start}–{info.split.test_end}. Lower errors are better. Last 20 days include an art intervention. This reproduces the existing holdout, not a new test.</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg"><table className="w-full text-sm text-left">
            <caption className="sr-only">Measured combined kitchen and serving waste errors, kilograms per day</caption>
            <thead className="bg-white text-slate-600"><tr>{['Method', 'Days', 'MAE (kg/day)', 'RMSE (kg/day)', 'R²'].map(x => <th scope="col" key={x} className="p-3">{x}</th>)}</tr></thead>
            <tbody>{scores.map(r => <tr key={r.method} className="border-t border-slate-200"><th scope="row" className="p-3 font-medium">{labels[r.method]}</th><td className="p-3">{r.rows}</td><td className="p-3">{r.mae_kg.toFixed(3)}</td><td className="p-3">{r.rmse_kg.toFixed(3)}</td><td className="p-3">{r.r2.toFixed(3)}</td></tr>)}</tbody>
          </table></div>
          <p className="text-sm text-slate-600">On the overall test, the past-five-day mean has lower MAE than either tree model. All overall R² values are negative. The default remains the validation-selected model.</p>
        </section>
        <section className="space-y-4 border border-slate-200 rounded-xl p-5">
          <h2 className="text-xl font-semibold">Measured and predicted waste across the test period</h2>
          <p className="text-sm text-slate-500">Horizontal axis: school service date. Vertical axis: kitchen + serving waste (kg/day). Forecasts use earlier measured days; model parameters remain fixed.</p>
          <div className="h-80 w-full" role="img" aria-label="Daily measured waste, LightGBM, Random Forest and past-five-day mean forecasts">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 20, left: 12, bottom: 25 }}>
              <CartesianGrid stroke="#e4eadd" strokeDasharray="3 3" /><XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} minTickGap={35} /><YAxis stroke="#94a3b8" label={{ value: 'kg/day', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #475569' }} /><Legend />
              <Line dataKey="measured" name="Measured waste" stroke="#274d36" dot={false} strokeWidth={2} />
              <Line dataKey="LightGBM" name="LightGBM" stroke="#6f9854" dot={false} />
              <Line dataKey="RandomForest" name="Random Forest" stroke="#ba9a62" dot={false} />
              <Line dataKey="Past5DayMean" name="Past-five-day mean" stroke="#8d8680" dot={false} />
            </LineChart></ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">Source: {info.source.authors}. <a href={info.source.url} target="_blank" rel="noreferrer" className="underline text-emerald-800">{info.source.title}</a> · {info.source.license}.</p>
        </section>
        <section className="space-y-5">
          <div className="flex flex-wrap gap-4 items-center justify-between"><h2 className="text-xl font-semibold">Run a one-day-ahead research forecast</h2><button type="button" onClick={() => loadExample()} disabled={busy} className="px-4 py-2 rounded-lg border border-emerald-700 text-emerald-800 disabled:opacity-50">Load real source example</button></div>
          {example && <label className="block text-sm">Replay a published test date <select aria-label="Replay date" className="ml-2 p-2 bg-white border border-slate-300 rounded" value={context === 'source_school_replay' ? date : ''} disabled={busy} onChange={e => { if (e.target.value) loadExample(e.target.value); }}><option value="">Choose a source date</option>{example.available_dates.map(d => <option key={d} value={d}>{d}</option>)}</select></label>}
          <form onSubmit={runForecast} className="space-y-5 border border-slate-200 rounded-xl p-5">
            <div className="grid md:grid-cols-3 gap-4">
              <label className="text-sm">Forecast service date<input type="date" required value={date} onChange={e => { setDate(e.target.value); edited(); }} className="block w-full mt-2 p-3 rounded bg-white border border-slate-300" /></label>
              <label className="text-sm">Source menu code (1–25)<input type="number" required min={1} max={25} step={1} value={menu} onChange={e => { setMenu(e.target.value); edited(); }} className="block w-full mt-2 p-3 rounded bg-white border border-slate-300" /></label>
              <label className="text-sm">Forecast method<select value={method} onChange={e => { setMethod(e.target.value as WasteMethod); setForecast(null); }} className="block w-full mt-2 p-3 rounded bg-white border border-slate-300"><option value="default">Validation choice ({info.default_method})</option>{methods.map(m => <option key={m} value={m}>{labels[m]}</option>)}</select></label>
            </div>
            <p className="text-sm text-slate-500">Menu codes refer to this source&apos;s 25-meal cycle. A local menu with the same number is not necessarily equivalent. Other canteens are exploratory use.</p>
            <label className="block text-sm">Past service-day observations (CSV)<textarea required rows={8} value={history} placeholder="service_date,ksw_kg,diners" onChange={e => { setHistory(e.target.value); edited(); }} className="block w-full mt-2 p-3 rounded bg-white border border-slate-300 font-mono text-sm" /></label>
            <div className="flex flex-wrap gap-4 items-center"><label className="text-sm text-emerald-800">Load history CSV <input type="file" accept=".csv,text/csv" className="ml-2 text-sm max-w-full" onChange={e => uploadHistory(e.target.files?.[0])} /></label><p className="text-xs text-slate-500">20–730 distinct earlier dates. Blank values stay missing; no forecast-day outcome is accepted.</p></div>
            <button disabled={busy || !history || !date || !menu} className="px-5 py-3 btn-primary rounded-lg font-semibold disabled:opacity-50">{busy ? 'Working…' : 'Estimate kitchen + serving waste'}</button>
          </form>
          {forecast && <div role="status" className="p-6 border border-emerald-700/30 rounded-xl bg-emerald-50 space-y-3">
            <p className="text-sm text-emerald-800">{labels[forecast.method]} · combined kitchen + serving waste</p><p className="text-3xl font-semibold">{forecast.predicted_ksw_kg.toFixed(3)} kg/day</p>
            {context === 'source_school_replay' && example && <p>Observed on this published day: {example.observed_ksw_kg.toFixed(3)} kg. Absolute error: {Math.abs(forecast.predicted_ksw_kg - example.observed_ksw_kg).toFixed(3)} kg.</p>}
            <p className="text-sm">{forecast.interpretation}</p><p className="text-sm text-slate-500">{forecast.history_days} history days; latest observation {forecast.latest_history_date}. {forecast.missing_feature_count} missing input features use the training imputer.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{Object.entries(forecast.comparison).map(([m, value]) => <p key={m}>{labels[m]}: {value === null ? 'insufficient recent observations' : `${value.toFixed(3)} kg`}</p>)}</div>
          </div>}
        </section>
      </>}
    </main>
  </div>;
}
