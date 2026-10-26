export type WasteMethod = 'default' | 'LightGBM' | 'RandomForest' | 'TrainingMedian' | 'Past5DayMean' | 'PreviousMeasuredDay';
export type WasteHistoryDay = { service_date: string; ksw_kg: number | null; diners: number | null };
export type WasteForecastRequest = {
  service_date: string; menu_code: number; history: WasteHistoryDay[];
  method: WasteMethod; context: 'source_school_replay' | 'new_canteen_exploration';
};
export type WasteScore = { segment: string; method: string; rows: number; mae_kg: number; rmse_kg: number; r2: number };
export type WasteInfo = {
  target: string; default_method: string; default_selection: string;
  source: { title: string; url: string; doi: string; license: string; authors: string; rows: number };
  split: { history_days: number; train_days: number; validation_days: number; test_days: number; test_start: string; test_end: string; intervention_test_days: number };
  validation_mae_kg: Record<string, number>; limitations: string[]; test_status: string;
};
export type WasteBenchmark = {
  results: WasteScore[];
  predictions: { date: string; phase: string; method: string; actual_kg: number; predicted_kg: number }[];
};
export type WasteExample = { request: WasteForecastRequest; observed_ksw_kg: number; available_dates: string[]; source_doi: string };
export type WasteForecast = {
  predicted_ksw_kg: number; method: string; comparison: Record<string, number | null>;
  latest_history_date: string; history_days: number; missing_feature_count: number;
  interpretation: string; population_note: string; donation_eligible: boolean;
};

// Intentionally small numeric/date CSV contract. No target-day outcome is accepted.
export function parseWasteHistory(text: string): WasteHistoryDay[] {
  const lines = text.trim().replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  const columns = lines.shift()?.split(',').map(s => s.trim()) || [];
  if (columns.join(',') !== 'service_date,ksw_kg,diners') {
    throw new Error('CSV header must be service_date,ksw_kg,diners. Leave missing observations blank.');
  }
  if (lines.length < 20 || lines.length > 730) throw new Error('Supply 20 to 730 past service-day rows.');
  return lines.map((line, index) => {
    const cells = line.split(',').map(s => s.trim());
    if (cells.length !== 3 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[0])) throw new Error(`Invalid date or column count on CSV row ${index + 2}.`);
    const ksw = cells[1] === '' ? null : Number(cells[1]);
    const diners = cells[2] === '' ? null : Number(cells[2]);
    if (ksw !== null && (!Number.isFinite(ksw) || ksw < 0)) throw new Error(`Waste must be nonnegative or blank on row ${index + 2}.`);
    if (diners !== null && (!Number.isInteger(diners) || diners <= 0)) throw new Error(`Diners must be a positive integer or blank on row ${index + 2}.`);
    return { service_date: cells[0], ksw_kg: ksw, diners };
  });
}

export function historyCSV(history: WasteHistoryDay[]): string {
  return 'service_date,ksw_kg,diners\n' + history.map(r => `${r.service_date},${r.ksw_kg ?? ''},${r.diners ?? ''}`).join('\n');
}
