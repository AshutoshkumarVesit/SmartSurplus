import type { RankedCandidate } from './ngo-ranking';
export const foodCategories = ['grain','bread','protein','vegetable','dairy','fruit','soup','dessert'] as const;
export const storageOptions = ['ambient','cold_storage','hot_holding'] as const;
export type AvailabilityInput = {
  accepting: boolean; available_capacity_kg: number; demand_kg: number;
  accepted_categories: string[]; vegetarian_only: boolean; storage_capabilities: string[];
  receiving_start_at: string; receiving_end_at: string; unloading_minutes: number;
};
export type Availability = AvailabilityInput & { report_updated_at: string; source: 'seeded_demo' | 'ngo_reported' };
export type RegisteredNGO = { ngo_id: string; ngo_name: string; address: string; latitude: number | null; longitude: number | null; capacity_people_per_day: number | null; availability: Availability | null; profile_issues: string[] };
export type Registry = { provider: { id: string; name: string; latitude: number | null; longitude: number | null }; ngos: RegisteredNGO[]; default_method: string; directory_source: string; max_report_age_minutes: number };
export type MatchInput = {
  food_id?: string; food_name: string; confirmed_quantity_kg: number; quality_confirmed: boolean;
  food_category: string; dietary_type: string; required_storage: string;
  pickup_within_minutes: number; delivery_within_minutes: number;
  vehicle_capacity_kg: number; transport_storage: string[]; loading_minutes: number;
  average_speed_kmh: number; road_distance_factor: number; traffic_index: number;
  rain_mm: number; temperature_c: number; method: 'default' | 'LightGBM' | 'RandomForest';
};
export type PlatformCandidate = Partial<RankedCandidate> & { ngo_id: string; ngo_name: string; address: string; available_capacity_kg?: number; availability?: Availability | null; availability_source?: string; report_updated_at?: string; receiving_end_at?: string; estimated_delivery_minutes?: number; rejection_reasons: string[] };
export type PlatformRank = { method: string; generated_at: string; food_name: string; confirmed_quantity_kg: number; delivery_deadline_at: string; total_registered_ngos: number; recommended_ngo_id: string | null; status: string; ranked: PlatformCandidate[]; rejected: PlatformCandidate[]; allocation_reserved: false; route_source: string; interpretation: string };
const reasons: Record<string,string> = {
  availability_not_reported: 'NGO has not reported its available kg and receiving hours',
  location_missing: 'Map location is missing', ngo_not_accepting: 'Not currently accepting food',
  capacity_unknown: 'Available capacity has not been reported', capacity_insufficient: 'Insufficient available kg capacity',
  capacity_report_stale_or_future: 'Availability needs refreshing (reports are valid for 2 hours)',
  receiving_window_closed: 'Receiving window has closed', food_category_incompatible: 'Does not accept this food category',
  diet_incompatible: 'Accepts vegetarian food only', ngo_storage_incompatible: 'Required storage is not available at the NGO',
  transport_storage_incompatible: 'Delivery vehicle does not provide required storage', vehicle_capacity_insufficient: 'Food exceeds vehicle capacity',
  pickup_window_missed: 'Estimated pickup misses the pickup window', estimated_arrival_outside_window: 'Estimated arrival misses a declared time window',
  model_eta_exceeds_declared_window: 'Model-estimated delivery time exceeds a declared window',
  route_shorter_than_straight_line: 'Route estimate is shorter than the straight-line distance', donor_quality_not_confirmed: 'Confirm the food quality first',
};
export const reasonLabel = (reason: string) => reasons[reason] || reason.replaceAll('_',' ');
export const displayStorage = (storage: string) => ({ambient:'Ambient',cold_storage:'Cold storage',hot_holding:'Hot holding'}[storage] || storage);
