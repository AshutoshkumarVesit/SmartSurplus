'use client';

import AppShell from '@/components/AppShell';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Dynamically import NetworkMap to avoid SSR issues with Leaflet
const NetworkMap = dynamic(() => import('@/components/NetworkMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-[#f7f8f2]/70">
      <span className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold uppercase tracking-wide text-sm">
        Loading partner map…
      </p>
    </div>
  ),
});

export default function MapPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const [showProviders, setShowProviders] = useState(true);
  const [showNgos, setShowNgos] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, n, h] = await Promise.all([
        api.getProviderMarkers(),
        api.getNgoMarkers(),
        api.getHotspots(),
      ]);
      setProviders(p || []);
      setNgos(n || []);
      setHotspots(h || []);
    } catch (err: any) {
      console.error('Failed to load map data:', err);
      setError(err?.message || 'Failed to load geospatial data');
    } finally {
      setLoading(false);
    }
  };

  const handleFocusHotspot = (h: any) => {
    setFocusedLocation({ lat: h.latitude, lng: h.longitude, zoom: 15 });
  };

  return (
    <AppShell><div className="page-wrapper">
      {/* Background Ambience */}




      <main id="main-content" className="workspace-page space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-gradient">
              Network map
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Explore reported provider locations, NGO partners and estimated surplus hotspots.
            </p>
          </div>

          {/* Layer toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="toggle-providers-btn"
              aria-pressed={showProviders}
              onClick={() => setShowProviders(!showProviders)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                showProviders
                  ? 'bg-blue-500/10 text-emerald-800 border-blue-500/30'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={showProviders ? '' : 'grayscale opacity-50'}>🍽️</span> Providers ({providers.length})
            </button>
            <button
              id="toggle-ngos-btn"
              aria-pressed={showNgos}
              onClick={() => setShowNgos(!showNgos)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                showNgos
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={showNgos ? '' : 'grayscale opacity-50'}>🏢</span> NGOs ({ngos.length})
            </button>
            <button
              id="toggle-hotspots-btn"
              aria-pressed={showHeatmap}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                showHeatmap
                  ? 'bg-red-500/10 text-red-700 border-red-500/30'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={showHeatmap ? '' : 'grayscale opacity-50'}>🔥</span> Hotspots ({hotspots.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={loadMapData}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-bold transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Map Viewport Container */}
          <div className="glass-card overflow-hidden h-[620px] border border-slate-200 relative rounded-2xl">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#f7f8f2]/50">
                <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-wide text-sm">
                  Loading Satellite & Spatial Nodes...
                </p>
              </div>
            ) : (
              <NetworkMap
                providers={providers}
                ngos={ngos}
                hotspots={hotspots}
                showProviders={showProviders}
                showNgos={showNgos}
                showHeatmap={showHeatmap}
                focusedLocation={focusedLocation}
                onSelectMarker={setSelectedMarker}
              />
            )}
          </div>

          {/* Sidebar Panels */}
          <div className="space-y-6">
            {/* Map legend */}
            <div className="glass-card p-6 border border-slate-200">
              <h3 className="text-sm font-bold tracking-wide text-slate-600 uppercase mb-4">
                Map legend
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500">
                    <span className="text-sm">🍽️</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Food Providers</p>
                    <p className="text-xs text-emerald-800 font-medium">{providers.length} provider locations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500">
                    <span className="text-sm">🏢</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">NGOs & Shelters</p>
                    <p className="text-xs text-emerald-700 font-medium">{ngos.length} NGO locations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-red-500/50 bg-gradient-to-br from-red-500/40 to-orange-500/40">
                    <span className="text-sm">🔥</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Waste Hotspots</p>
                    <p className="text-xs text-red-700 font-medium">Estimated surplus concentrations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected partner or Top Hotspots */}
            {selectedMarker ? (
              <div className="glass-card p-6 border border-blue-500/30 bg-blue-500/5 transition-all">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Selected partner
                  </span>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="text-slate-500 hover:text-slate-900 text-xs font-bold px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span>{selectedMarker.markerType === 'provider' ? '🍽️' : '🏢'}</span>
                  {selectedMarker.name}
                </h4>
                <p className="text-xs text-slate-500 mb-3">📍 {selectedMarker.details?.address || 'Mumbai'}</p>

                {selectedMarker.markerType === 'provider' ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-500">Type</span>
                      <span className="font-semibold text-emerald-800">{selectedMarker.details?.provider_type}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-500">Cuisine</span>
                      <span className="font-semibold text-slate-900">{selectedMarker.details?.cuisine_type}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-500">Surplus Alerts</span>
                      <span className="font-semibold text-red-700">{selectedMarker.details?.high_risk_predictions || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-500">Meal Capacity</span>
                      <span className="font-semibold text-emerald-700">{selectedMarker.details?.capacity} meals</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-50">
                      <span className="text-slate-500">Completed Deliveries</span>
                      <span className="font-semibold text-emerald-800">{selectedMarker.details?.deliveries_completed || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Surplus hotspots List */}
            <div className="glass-card p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold tracking-wide text-slate-600 uppercase">
                  Surplus hotspots
                </h3>
                <span className="text-xs text-slate-500 font-medium">Click to focus</span>
              </div>
              <div className="space-y-3">
                {!hotspots.length && <p className="text-xs text-slate-500">No surplus hotspots are reported in the current data.</p>}{hotspots.slice(0, 5).map((h, i) => (
                  <button type="button"
                    key={i}
                    onClick={() => handleFocusHotspot(h)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all border border-transparent hover:border-red-500/30 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors flex items-center gap-1.5">
                        <span>🔥</span> {h.provider_name}
                      </p>
                      <span className={`text-xs font-semibold ${h.intensity > 0.6 ? 'text-red-700' : 'text-amber-800'}`}>
                        {h.avg_waste_kg} kg
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#ffffff] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all group-hover:brightness-125"
                        style={{
                          width: `${h.intensity * 100}%`,
                          background:
                            h.intensity > 0.6
                              ? 'linear-gradient(90deg, #c6a15b, #ba7868)'
                              : 'linear-gradient(90deg, #5d8960, #c6a15b)',
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div></AppShell>
  );
}
