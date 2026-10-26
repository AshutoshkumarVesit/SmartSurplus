'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RankingInfo, RankingSnapshot, RankingMethod, RankResult } from '@/lib/ngo-ranking';

const methods: RankingMethod[] = ['default', 'LightGBM', 'RandomForest', 'NearestFeasible', 'EarliestFeasible', 'HistoryDemand'];
export default function MatchingLab() {
  const [info, setInfo] = useState<RankingInfo | null>(null);
  const [text, setText] = useState('');
  const [method, setMethod] = useState<RankingMethod>('default');
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [context, setContext] = useState<'synthetic_example' | 'user_snapshot'>('user_snapshot');
  const [result, setResult] = useState<RankResult | null>(null);
  const [population, setPopulation] = useState('fresh_population_test');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.getRankingInfo().then(setInfo).catch(e => setError(e.message)); }, []);
  const load = async (i: number) => {
    setBusy(true); setError(''); setResult(null);
    try {
      const sample = await api.getRankingExample(i);
      setText(JSON.stringify(sample.request, null, 2)); setContext('synthetic_example');
      setCount(sample.examples); setIndex(i);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load scenario.'); }
    finally { setBusy(false); }
  };
  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true); setResult(null);
    try {
      const snapshot = JSON.parse(text) as RankingSnapshot;
      setResult(await api.rankNGOs({ ...snapshot, context }, method));
    } catch (e) { setError(e instanceof Error ? e.message : 'Ranking failed.'); }
    finally { setBusy(false); }
  };
  const scores = info?.policy_results.filter(r => r.population === population) || [];
  return <div className="page-wrapper">

    <main id="main-content" className="workspace-page space-y-8">
      <header><p className="text-xs uppercase tracking-wide text-emerald-800 mb-2">Separate redistribution experiment</p><h1 className="text-3xl font-bold">NGO Matching & Delivery Ranking</h1><p className="mt-3 text-slate-600 max-w-3xl">Rank NGO/courier options for a confirmed donation offer. Check capacity, food, storage and declared time windows before comparing expected receipt and delivery duration.</p></header>
      {error && <p role="alert" className="rounded-lg border border-red-400/40 p-4 text-red-700">{error}</p>}
      <section className="rounded-xl border border-amber-400/30 bg-amber-50 p-5 space-y-2"><h2 className="font-semibold text-amber-800">Experimental proposal, separate from surplus prediction</h2><p className="text-sm">The ranking models use synthetic scenarios. A proposal reserves no NGO capacity or courier. Declared deadlines and donor confirmation do not establish food safety. Confirmed donatable kg must come from an actual offer; predicted waste is not an offer.</p><p className="text-sm text-slate-500">Real parcel records train a separate ETA benchmark below. They do not validate NGO acceptance, food delivery or spoilage.</p></section>
      {info && <>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Synthetic candidate rows</p><p className="text-2xl font-semibold mt-2">{info.rows.toLocaleString()}</p><p className="text-xs text-slate-500 mt-2">6,000 offer snapshots × 10 options</p></div>
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Default validation choice</p><p className="text-2xl font-semibold mt-2">{info.default_policy}</p><p className="text-xs text-slate-500 mt-2">Expected receipt minus delay preference</p></div>
          <div className="border border-slate-200 rounded-xl p-5"><p className="text-sm text-slate-500">Offer groups per split</p><p className="text-2xl font-semibold mt-2">4,200 / 900 / 900</p><p className="text-xs text-slate-500 mt-2">Train / validation / chronological test</p></div>
        </div>
        <section className="space-y-4"><div className="flex flex-wrap justify-between gap-4 items-center"><h2 className="text-xl font-semibold">Synthetic policy comparison</h2><label className="text-sm">Population <select value={population} onChange={e => setPopulation(e.target.value)} className="ml-2 p-2 rounded bg-white border border-slate-300"><option value="fresh_population_test">Fresh seed: 1,000 new offer snapshots</option><option value="chronological_test">Chronological test: 900 offer snapshots</option></select></label></div>
          <p className="text-sm text-slate-500">Each policy chooses at most one option per offer. Received share = simulated received kg / offered kg, including unmatched offers. Alternatives have counterfactual simulator outcomes; this is not a shared-capacity fleet schedule.</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-white"><tr>{['Policy', 'Received (kg)', 'Received share', 'Unmatched', 'Constraint violations'].map(h => <th scope="col" key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{scores.map(r => <tr key={r.method} className="border-t border-slate-200"><th scope="row" className="p-3 font-medium">{r.method}</th><td className="p-3">{r.received_kg.toFixed(1)}</td><td className="p-3">{(100 * r.received_share).toFixed(2)}%</td><td className="p-3">{r.unmatched}</td><td className="p-3">{r.constraint_violations}</td></tr>)}</tbody></table></div>
          <p className="text-xs text-slate-500">NearestUnfiltered is an intentionally ungated diagnostic, never an available API policy. Zero violations for gated methods reflect implemented rules, not measured real-world safety.</p>
        </section>
        <section className="space-y-4"><div className="flex flex-wrap gap-4 justify-between items-center"><h2 className="text-xl font-semibold">Inspect an offer and rank its candidates</h2><div className="flex gap-3"><button disabled={busy} onClick={() => load(0)} className="px-4 py-2 border border-emerald-700 rounded-lg text-emerald-800 disabled:opacity-50">Load synthetic example</button>{count > 0 && <button disabled={busy} onClick={() => load((index + 1) % count)} className="px-4 py-2 border border-slate-300 rounded-lg">Next example</button>}</div></div>
          <p className="text-sm text-slate-500">Current inputs include confirmed kg, positions, route/travel estimates, receiving windows, kg capacity, declared storage/food compatibility and earlier recipient/courier history summaries. Reports older than 120 minutes are rejected under this prototype policy.</p>
          <form onSubmit={run} className="space-y-4 border border-slate-200 rounded-xl p-5"><label className="text-sm block">Policy <select className="ml-3 p-2 rounded bg-white border border-slate-300" value={method} onChange={e => { setMethod(e.target.value as RankingMethod); setResult(null); }}>{methods.map(m => <option key={m} value={m}>{m === 'default' ? `Validation choice (${info.default_policy})` : m}</option>)}</select></label>
            <label className="block text-sm">Offer and candidate snapshot (JSON)<textarea rows={12} required value={text} onChange={e => { setText(e.target.value); setContext('user_snapshot'); setResult(null); }} className="block w-full mt-2 bg-white border border-slate-300 rounded p-3 text-xs font-mono" placeholder="Load a documented synthetic example to inspect the input contract." /></label>
            <button disabled={busy || !text} className="px-5 py-3 btn-primary rounded-lg font-semibold disabled:opacity-50">{busy ? 'Working…' : 'Rank feasible options'}</button><span className="ml-4 text-xs text-slate-500">{context === 'synthetic_example' ? 'Synthetic example' : 'User-supplied snapshot · unvalidated field use'}</span>
          </form>
          {result && <div className="space-y-4" role="status"><div className="p-5 rounded-xl border border-emerald-700/30 bg-emerald-50"><p className="text-sm text-emerald-800">{result.method} · {result.confirmed_quantity_kg.toFixed(3)} confirmed kg</p><h3 className="text-xl font-semibold mt-2">{result.selected_candidate_id ? `Proposed option: ${result.selected_candidate_id}` : 'No feasible candidate'}</h3><p className="text-sm mt-3">{result.interpretation}</p></div>
            {result.ranked.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm text-left border border-slate-200"><caption className="text-left text-slate-600 py-3">Eligible options, best first. Expected received fraction is a synthetic regression estimate, not a calibrated probability.</caption><thead className="bg-white"><tr>{['NGO / courier', 'Route (km)', 'Predicted receipt (kg)', 'Elapsed (min)', 'Notes'].map(h => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead><tbody>{result.ranked.map(c => <tr key={c.candidate_id} className="border-t border-slate-200"><th scope="row" className="p-3 font-medium">{c.ngo_id}<span className="block text-xs text-slate-500">{c.courier_id}</span></th><td className="p-3">{c.route_distance_km.toFixed(2)}</td><td className="p-3">{c.estimated_received_kg == null ? 'Rule policy' : c.estimated_received_kg.toFixed(3)}</td><td className="p-3">{c.predicted_elapsed_minutes?.toFixed(1)}</td><td className="p-3 text-xs">{c.model_eta_exceeds_window ? 'Model ETA exceeds a declared window. ' : ''}{c.extrapolated_features?.length ? `Outside training range: ${c.extrapolated_features.join(', ')}. ` : ''}{c.missing_feature_count ? `${c.missing_feature_count} missing features use training imputation.` : ''}</td></tr>)}</tbody></table></div>}
            {result.rejected.length > 0 && <details className="border border-slate-200 rounded-lg p-4" open><summary className="cursor-pointer font-medium">{result.rejected.length} rejected options and reasons</summary><ul className="mt-4 space-y-3 text-sm">{result.rejected.map(c => <li key={c.candidate_id}><span className="font-medium">{c.ngo_id} / {c.courier_id}:</span> <span className="text-slate-500">{c.rejection_reasons.map(r => r.replaceAll('_', ' ')).join('; ')}</span></li>)}</ul></details>}
          </div>}
        </section>
        {info.real_parcel_eta && <section className="space-y-4 border-t border-slate-200 pt-8"><h2 className="text-xl font-semibold">Separate real-data ETA benchmark</h2><p className="text-sm text-slate-600"><a href="https://huggingface.co/datasets/Cainiao-AI/LaDe-D" className="underline text-emerald-800" target="_blank" rel="noreferrer">LaDe-D, Jilin</a>: {info.real_parcel_eta.raw_rows.toLocaleString()} measured parcel records; {info.real_parcel_eta.retained_rows.toLocaleString()} retained. May–August train ({info.real_parcel_eta.train_rows.toLocaleString()}), September validation ({info.real_parcel_eta.validation_rows.toLocaleString()}), October test ({info.real_parcel_eta.test_rows.toLocaleString()}).</p><p className="text-sm text-slate-500">Target is acceptance-to-completion time, including batching and queueing. Errors are large and test R² is negative. These models are saved separately and do not score food/NGO candidates.</p><table className="w-full text-sm text-left"><thead><tr>{['Method', 'MAE (min)', 'RMSE (min)', 'R²'].map(h => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead><tbody>{info.real_parcel_eta.results.map(r => <tr key={r.method} className="border-t border-slate-200"><th scope="row" className="p-3 font-medium">{r.method}</th><td className="p-3">{r.mae_minutes.toFixed(2)}</td><td className="p-3">{r.rmse_minutes.toFixed(2)}</td><td className="p-3">{r.r2.toFixed(3)}</td></tr>)}</tbody></table></section>}
      </>}
    </main>
  </div>;
}
