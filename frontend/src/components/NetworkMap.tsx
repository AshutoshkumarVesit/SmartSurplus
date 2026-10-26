'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

function escapeHTML(value: unknown): string {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]!));
}

interface MarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  details?: Record<string, any>;
}

interface HotspotData {
  latitude: number;
  longitude: number;
  intensity: number;
  provider_name: string;
  avg_waste_kg: number;
}

interface NetworkMapProps {
  providers: MarkerData[];
  ngos: MarkerData[];
  hotspots: HotspotData[];
  showProviders: boolean;
  showNgos: boolean;
  showHeatmap: boolean;
  focusedLocation?: { lat: number; lng: number; zoom?: number } | null;
  onSelectMarker?: (marker: any) => void;
}

export default function NetworkMap({
  providers,
  ngos,
  hotspots,
  showProviders,
  showNgos,
  showHeatmap,
  focusedLocation,
  onSelectMarker,
}: NetworkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<any>(null);
  const providerLayerRef = useRef<any>(null);
  const ngoLayerRef = useRef<any>(null);
  const hotspotLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      // Make L available globally for leaflet.heat UMD module
      if (typeof window !== 'undefined') {
        (window as any).L = L;
      }

      const map = L.map(containerRef.current, {
        center: [19.076, 72.8777], // Mumbai Center
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      providerLayerRef.current = L.layerGroup().addTo(map);
      ngoLayerRef.current = L.layerGroup().addTo(map);
      hotspotLayerRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
      setReady(true);

      // Invalidate size to ensure proper tile rendering
      setTimeout(() => {
        if (isMounted && mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    }

    init();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Providers
  useEffect(() => {
    async function updateProviders() {
      if (!mapRef.current || !providerLayerRef.current) return;
      const L = (await import('leaflet')).default;

      providerLayerRef.current.clearLayers();

      if (!showProviders) return;

      const providerIcon = L.divIcon({
        className: 'custom-provider-icon',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 2px solid #ffffff;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 0 22px rgba(59,130,246,0.9)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(59,130,246,0.6)';">
            🍽️
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      providers.forEach((p) => {
        const marker = L.marker([p.latitude, p.longitude], { icon: providerIcon });
        const popupContent = `
          <div style="min-width: 220px; font-family: inherit; color: #284432;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="font-size: 20px;">🍽️</span>
              <div>
                <h4 style="margin: 0; font-weight: 700; font-size: 14px; color: #284432;">${escapeHTML(p.name)}</h4>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #416d48;">Food Provider</span>
              </div>
            </div>
            <p style="font-size: 12px; color: #748369; margin: 0 0 8px 0;">📍 ${escapeHTML(p.details?.address || 'Mumbai Region')}</p>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
              <div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px;">
                <span style="color: #748369;">Type:</span> <strong style="color: #416d48;">${escapeHTML(p.details?.provider_type || 'Restaurant')}</strong>
              </div>
              <div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px;">
                <span style="color: #748369;">Cuisine:</span> <strong style="color: #284432;">${escapeHTML(p.details?.cuisine_type || 'Multi-Cuisine')}</strong>
              </div>
              ${
                p.details?.food_entries
                  ? `<div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                      <span style="color: #748369;">Logged Batches:</span> <strong style="color: #10b981;">${p.details.food_entries}</strong>
                    </div>`
                  : ''
              }
              ${
                p.details?.high_risk_predictions
                  ? `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                      <span style="color: #f87171;">Surplus Risk Alerts:</span> <strong style="color: #f87171;">${p.details.high_risk_predictions}</strong>
                    </div>`
                  : ''
              }
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectMarker) onSelectMarker({ ...p, markerType: 'provider' });
        });
        providerLayerRef.current.addLayer(marker);
        markersRef.current[`provider-${p.id}`] = marker;
      });
    }

    updateProviders();
  }, [providers, showProviders, onSelectMarker, ready]);

  // Update NGOs
  useEffect(() => {
    async function updateNgos() {
      if (!mapRef.current || !ngoLayerRef.current) return;
      const L = (await import('leaflet')).default;

      ngoLayerRef.current.clearLayers();

      if (!showNgos) return;

      const ngoIcon = L.divIcon({
        className: 'custom-ngo-icon',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #059669);
            border: 2px solid #ffffff;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          " onmouseover="this.style.transform='scale(1.2)'; this.style.boxShadow='0 0 22px rgba(16,185,129,0.9)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 15px rgba(16,185,129,0.6)';">
            🏢
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      ngos.forEach((n) => {
        const marker = L.marker([n.latitude, n.longitude], { icon: ngoIcon });
        const popupContent = `
          <div style="min-width: 220px; font-family: inherit; color: #284432;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="font-size: 20px;">🏢</span>
              <div>
                <h4 style="margin: 0; font-weight: 700; font-size: 14px; color: #284432;">${escapeHTML(n.name)}</h4>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: #416d48;">NGO / Food Bank</span>
              </div>
            </div>
            <p style="font-size: 12px; color: #748369; margin: 0 0 8px 0;">📍 ${escapeHTML(n.details?.address || 'Mumbai Region')}</p>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 6px 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                <span style="color: #748369;">Daily Capacity:</span> <strong style="color: #416d48;">${n.details?.capacity || 0} meals</strong>
              </div>
              <div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                <span style="color: #748369;">Deliveries Completed:</span> <strong style="color: #416d48;">${n.details?.deliveries_completed || 0}</strong>
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectMarker) onSelectMarker({ ...n, markerType: 'ngo' });
        });
        ngoLayerRef.current.addLayer(marker);
        markersRef.current[`ngo-${n.id}`] = marker;
      });
    }

    updateNgos();
  }, [ngos, showNgos, onSelectMarker, ready]);

  // Update Hotspots (Heatmap + Pulsing Warning Zones)
  useEffect(() => {
    async function updateHotspots() {
      if (!mapRef.current || !hotspotLayerRef.current) return;
      const L = (await import('leaflet')).default;

      hotspotLayerRef.current.clearLayers();

      if (!showHeatmap || hotspots.length === 0) return;

      // Try loading leaflet.heat layer
      try {
        if (typeof window !== 'undefined') {
          (window as any).L = L;
          await import('leaflet.heat');
          if ((L as any).heatLayer) {
            const points = hotspots.map((h) => [
              h.latitude,
              h.longitude,
              Math.min(1.0, Math.max(0.3, h.intensity * 1.5)),
            ]);
            const heat = (L as any).heatLayer(points, {
              radius: 42,
              blur: 28,
              maxZoom: 15,
              max: 1.0,
              gradient: {
                0.2: '#10b981',
                0.4: '#3b82f6',
                0.6: '#f59e0b',
                0.8: '#ef4444',
                1.0: '#dc2626',
              },
            });
            hotspotLayerRef.current.addLayer(heat);
          }
        }
      } catch (err) {
        console.warn('leaflet.heat initialization warning:', err);
      }

      // Add interactive vector circles for precise visual hotspot boundaries
      hotspots.forEach((h, idx) => {
        const isCritical = h.intensity > 0.6;
        const color = isCritical ? '#ef4444' : '#f59e0b';
        const circle = L.circle([h.latitude, h.longitude], {
          radius: 400 + h.intensity * 700,
          color: color,
          weight: 1.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: Math.min(0.35, 0.15 + h.intensity * 0.25),
        });

        const popupContent = `
          <div style="min-width: 200px; font-family: inherit; color: #284432;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="font-size: 18px;">🔥</span>
              <h4 style="margin: 0; font-weight: 700; font-size: 13px; color: ${color};">Waste Hotspot</h4>
            </div>
            <p style="font-size: 13px; font-weight: 600; color: #284432; margin: 0 0 6px 0;">${escapeHTML(h.provider_name)}</p>
            <div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span style="color: #748369;">Surplus Intensity:</span> <strong style="color: ${color};">${(h.intensity * 100).toFixed(0)}%</strong>
            </div>
            <div style="background: #f1f5eb; padding: 6px 8px; border-radius: 6px; font-size: 12px; display: flex; justify-content: space-between;">
              <span style="color: #748369;">Average Surplus:</span> <strong style="color: #284432;">${h.avg_waste_kg} kg</strong>
            </div>
          </div>
        `;
        circle.bindPopup(popupContent);
        hotspotLayerRef.current.addLayer(circle);
        markersRef.current[`hotspot-${idx}`] = circle;
      });
    }

    updateHotspots();
  }, [hotspots, showHeatmap, ready]);

  // Handle focused location (FlyTo)
  useEffect(() => {
    if (mapRef.current && focusedLocation) {
      mapRef.current.flyTo(
        [focusedLocation.lat, focusedLocation.lng],
        focusedLocation.zoom || 14,
        { duration: 1.2 }
      );
    }
  }, [focusedLocation]);

  return (
    <div
      ref={containerRef}
      id="smartsurplus-network-map"
      className="w-full h-full"
      style={{ minHeight: '600px', width: '100%', background: '#eff3e8' }}
    />
  );
}
