export type RankingMethod = 'default' | 'LightGBM' | 'RandomForest' | 'NearestFeasible' | 'EarliestFeasible' | 'HistoryDemand';
export type PolicyScore = { method: string; population: string; offers: number; selected: number; unmatched: number; received_kg: number; offered_kg: number; received_share: number; constraint_violations: number; selected_mean_actual_minutes: number };
export type RankingInfo = {
  default_policy: string; rows: number; offers: number; options_per_offer: number;
  policy_results: PolicyScore[]; allocation: string; safety: string;
  real_parcel_eta: { raw_rows: number; retained_rows: number; train_rows: number; validation_rows: number; test_rows: number; results: { method: string; mae_minutes: number; rmse_minutes: number; r2: number }[] } | null;
};
export type RankedCandidate = {
  candidate_id: string; ngo_id: string; courier_id: string; eligible: boolean;
  rejection_reasons: string[]; straight_distance_km: number; route_distance_km: number;
  nominal_elapsed_minutes: number; declared_margin_minutes: number;
  ranking_score?: number; estimated_received_fraction?: number | null;
  estimated_received_kg?: number | null; predicted_elapsed_minutes?: number;
  extrapolated_features?: string[]; missing_feature_count?: number; model_eta_exceeds_window?: boolean;
};
export type RankResult = {
  method: string; offer_id: string; confirmed_quantity_kg: number; selected_candidate_id: string | null;
  status: string; ranked: RankedCandidate[]; rejected: RankedCandidate[];
  interpretation: string; allocation_reserved: boolean; food_safety_validated: boolean;
};
export type RankingSnapshot = { offer: Record<string, unknown>; candidates: Record<string, unknown>[]; context: 'synthetic_example' | 'user_snapshot' };
export type RankingExample = { request: RankingSnapshot; examples: number; data_origin: string };
