/**
 * SmartSurplus API Client
 * Handles all backend API calls with JWT token management.
 */

import type { WasteInfo, WasteBenchmark, WasteExample, WasteForecastRequest, WasteForecast } from './measured-waste';
import type { RankingInfo, RankingExample, RankingSnapshot, RankingMethod, RankResult } from './ngo-ranking';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smartsurplus_token');
}

export function setToken(token: string) {
  localStorage.setItem('smartsurplus_token', token);
}

export function clearToken() {
  localStorage.removeItem('smartsurplus_token');
  localStorage.removeItem('smartsurplus_user');
}

export function setUser(user: any) {
  localStorage.setItem('smartsurplus_user', JSON.stringify(user));
}

export function getUser(): any {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('smartsurplus_user');
  try {
    const parsed = u ? JSON.parse(u) : null;
    return parsed && ['provider', 'ngo', 'admin'].includes(parsed.role) && typeof parsed.name === 'string' ? parsed : null;
  } catch { return null; }
}

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try { res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers }); }
  catch { throw new Error('Cannot reach the backend. Check that the API server is running, then try again.'); }

  if (res.status === 401 && endpoint !== '/login' && endpoint !== '/register') {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((item: { msg?: string }) => item.msg || 'Invalid input').join('; ')
      : err.detail;
    throw new ApiError(res.status === 404 && endpoint.startsWith('/research/') ? 'This research module is not available on the connected backend. Start the research-enabled API to use this page.' : detail || 'Request failed', res.status);
  }

  return res.json();
}

// Auth
export const api = {
  register: (data: any) => request('/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/login', { method: 'POST', body: JSON.stringify(data) }),

  // Provider
  uploadFoodData: (data: any) => {
    const payload = {
      ...data,
      quantity_kg: Number(data.quantity_kg ?? data.quantity_prepared),
      expiry_hours: Number(data.expiry_hours ?? data.shelf_life_hours ?? 6),
    };
    return request('/food-data', { method: 'POST', body: JSON.stringify(payload) });
  },
  getModelInfo: () => request('/model-info'),
  getFoodData: () => request('/food-data'),
  getPredictions: () => request('/predictions'),
  runPrediction: () => request('/predict', { method: 'POST' }),

  // Measured kitchen + serving waste: independent research, no donation writes.
  getWasteInfo: (): Promise<WasteInfo> => request('/research/waste/info'),
  getWasteBenchmark: (): Promise<WasteBenchmark> => request('/research/waste/benchmark'),
  getWasteExample: (serviceDate?: string): Promise<WasteExample> =>
    request('/research/waste/example' + (serviceDate ? `?service_date=${encodeURIComponent(serviceDate)}` : '')),
  forecastWaste: (data: WasteForecastRequest): Promise<WasteForecast> =>
    request('/research/waste/forecast', { method: 'POST', body: JSON.stringify(data) }),

  getRankingInfo: (): Promise<RankingInfo> => request('/research/ngo-matching/info'),
  getRankingExample: (index = 0): Promise<RankingExample> => request(`/research/ngo-matching/example?index=${index}`),
  rankNGOs: (snapshot: RankingSnapshot, method: RankingMethod): Promise<RankResult> =>
    request('/research/ngo-matching/rank', { method: 'POST', body: JSON.stringify({ ...snapshot, method }) }),

  // NGO
  getNgoMatches: () => request('/ngo/matches'),
  acceptMatch: (matchId: string, action: string) =>
    request('/ngo/accept', { method: 'POST', body: JSON.stringify({ match_id: matchId, action }) }),
  confirmDelivery: (matchId: string, qty: number, notes?: string) =>
    request('/ngo/confirm', { method: 'POST', body: JSON.stringify({ match_id: matchId, quantity_received_kg: qty, notes }) }),

  // Admin
  getStats: () => request('/admin/stats'),
  getAllUsers: () => request('/admin/users'),
  getLogs: () => request('/admin/logs'),
  getAllPredictions: () => request('/admin/predictions'),
  getAllMatches: () => request('/admin/matches'),
  getAllFoodData: () => request('/admin/food-data'),

  // Map
  getProviderMarkers: () => request('/map/providers'),
  getNgoMarkers: () => request('/map/ngos'),
  getHotspots: () => request('/map/hotspots'),
};
