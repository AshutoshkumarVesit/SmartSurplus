"use client";
import React, { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

type Option = Record<string, string | number>;
type Catalog = { items: Option[]; cities: Option[]; venue_types: Option[]; localities: Option[] };
const historyFields = [
  ["forecast_kg", "Expected demand (kg)"],
  ["historical_avg_consumption", "Past 7-day average sales (kg)"],
  ["historical_28day_consumption", "Past 28-day average sales (kg)"],
  ["lag1_sold_kg", "Previous-day sales (kg)"],
  ["lag7_sold_kg", "Sales 7 days ago (kg)"],
  ["roll7_surplus_rate", "Past 7-day surplus ratio (0–1)"],
  ["roll28_surplus_rate", "Past 28-day surplus ratio (0–1)"],
];
export default function UploadFoodPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [foodType, setFoodType] = useState("rice");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({ item_id: 1, city_id: 1,
    venue_type_id: 1, locality_type_id: 1, quantity_kg: 10, carry_in_kg: 0,
    expiry_hours: 6, prepared_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) });
  useEffect(() => { api.getModelInfo().then(info => setCatalog(info.catalog))
    .catch(err => { if (err instanceof ApiError && err.status === 404) setLegacy(true); else setError(err.message); }); }, []);
  const update = (key: string, value: string | number) => setForm(f => ({...f, [key]: value}));
  const input = "input-premium";
  const select = (key: string, label: string, rows: Option[], id: string, name: string) =>
    <label className="block text-sm text-slate-600" key={key}>{label}
      <select className={input} value={form[key]} onChange={e => update(key, Number(e.target.value))}>
        {rows.map(row => <option key={row[id]} value={row[id]}>{row[name]}</option>)}
      </select>
    </label>;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (legacy) {
        await api.uploadFoodData({ food_type: foodType.trim(), quantity_kg: form.quantity_kg, expiry_hours: form.expiry_hours, prepared_at: form.prepared_at + "T12:00:00" });
        router.push("/dashboard/provider/predictions"); return;
      }
      if (!catalog) throw new Error("Food catalog is not loaded");
      const item = catalog.items.find((i: Option) => i.item_id === form.item_id);
      if (!item) throw new Error("Select a catalog item");
      const payload: Record<string, string | number | null> = {...form, food_type: item.item_name,
        prepared_at: form.prepared_at + "T12:00:00"};
      historyFields.forEach(([key]) => { payload[key] = form[key] === "" || form[key] == null ? null : Number(form[key]); });
      await api.uploadFoodData(payload); router.push("/dashboard/provider/predictions");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Prediction failed"); }
    finally { setLoading(false); }
  }
  return <div className="page-wrapper">
    <main id="main-content" className="workspace-page space-y-8">
      <h1 className="text-3xl font-bold mb-3">Daily food preparation</h1>
      <p className="text-slate-500 mb-6">Estimate daily surplus for a catalog item. This model was trained on simulated food-business data; confirm actual available food before planning redistribution.</p>
      {error && <p role="alert" className="p-4 mb-5 bg-red-500/10 text-red-700 rounded-xl">{error}</p>}
      {legacy && <p className="research-notice">The connected API supports basic food records. Catalog and demand-history inputs require the research-enabled backend.</p>}
      {!catalog && !legacy ? error ? <button className="btn-secondary" onClick={() => window.location.reload()}>Retry loading catalog</button> : <p role="status">Loading the trained food catalog…</p> : <form onSubmit={submit} className="glass-card p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          {catalog && <>{select("item_id", "Food item", catalog.items, "item_id", "item_name")}
          {select("city_id", "City", catalog.cities, "city_id", "city")}
          {select("venue_type_id", "Business type", catalog.venue_types, "venue_type_id", "venue_type")}
          {select("locality_type_id", "Locality", catalog.localities, "locality_type_id", "locality_type")}</>}
          {legacy && <label>Food item<input className={input} required value={foodType} onChange={e => setFoodType(e.target.value)} /></label>}
          <label>Date<input required type="date" className={input} value={form.prepared_at} onChange={e=>update("prepared_at",e.target.value)}/></label>
          <label>Prepared food (kg)<input required type="number" min="0.001" step="any" className={input} value={form.quantity_kg} onChange={e=>update("quantity_kg",Number(e.target.value))}/></label>
          {!legacy && <label>Carry-in food (kg)<input required type="number" min="0" step="any" className={input} value={form.carry_in_kg} onChange={e=>update("carry_in_kg",Number(e.target.value))}/></label>}
          <label>Pickup expiry window (hours)<input required type="number" min="0.01" step="any" className={input} value={form.expiry_hours} onChange={e=>update("expiry_hours",Number(e.target.value))}/></label>
        </div>
        {!legacy && <details className="border-t border-slate-200 pt-5"><summary className="cursor-pointer font-semibold">Optional demand history</summary>
          <p className="text-sm text-slate-500 my-4">Enter measured history preceding this date. Leave unknown values blank. History improves predictions; estimates with incomplete history have no uncertainty interval.</p>
          <div className="grid sm:grid-cols-2 gap-5">{historyFields.map(([key,label])=><label key={key}>{label}<input type="number" step="any" min="0" max={key.endsWith("rate") ? 1 : undefined} className={input} value={form[key] ?? ""} onChange={e=>update(key,e.target.value)}/></label>)}</div>
        </details>}
        <button disabled={loading} type="submit" className="btn-primary disabled:opacity-50">{loading ? "Predicting…" : "Save and predict surplus"}</button>
      </form>}
    </main></div>;
}
