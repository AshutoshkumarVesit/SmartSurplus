"""Read-only research forecasts; no food-entry, donation or matching writes."""
from pathlib import Path
from functools import lru_cache
import json, sys, hashlib
import numpy as np
import pandas as pd
from app.ml.measured_waste_features import FEATURES, forecast_frame
from app.ml.model_runtime import validate_model_runtime

BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND / 'ml_packages'))
ART = BACKEND / 'app/ml/artifacts/measured_waste'


@lru_cache(maxsize=1)
def assets():
    validate_model_runtime()
    if not (ART / 'manifest.json').exists():
        raise RuntimeError('Measured-waste artifacts unavailable. Run backend/export_measured_waste.py.')
    import joblib
    manifest = json.loads((ART / 'manifest.json').read_text(encoding='utf-8'))
    for name, expected in manifest['sha256'].items():
        path = ART / name
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise RuntimeError('Measured-waste artifact integrity check failed: ' + name)
    meta = json.loads((ART / 'metadata.json').read_text(encoding='utf-8'))
    models = {name: joblib.load(ART / (name + '.joblib')) for name in ['LightGBM', 'RandomForest']}
    if any(obj['features'] != FEATURES or obj['target'] != 'KSW kg' for obj in models.values()):
        raise RuntimeError('Measured-waste feature or target contract mismatch')
    return meta, models


def research_info():
    meta, _ = assets()
    return meta


def benchmark():
    meta, _ = assets()
    predictions = pd.read_csv(ART / 'test_predictions.csv')
    return {'target': meta['target'], 'unit': 'kg/day', 'results': meta['test_results'],
            'predictions': predictions.to_dict('records'), 'split': meta['split'],
            'scope': meta['scope']}


def example(service_date=None):
    meta, _ = assets()
    d = pd.read_csv(ART / 'observations.csv')
    test = d.loc[d.split.eq('test')]
    chosen = str(service_date) if service_date else str(test.service_date.iloc[0])
    matching = test.loc[test.service_date.eq(chosen)]
    if matching.empty: raise ValueError('Replay date must be one of the published test service dates')
    current = matching.iloc[0]
    past = d.loc[d.service_date.lt(chosen)].tail(20)
    history = [{'service_date': r.service_date,
                'ksw_kg': None if pd.isna(r.ksw_kg) else float(r.ksw_kg),
                'diners': None if pd.isna(r.diners) else int(r.diners)} for r in past.itertuples()]
    return {'request': {'service_date': chosen, 'menu_code': int(current.menu_code),
                        'history': history, 'method': 'default', 'context': 'source_school_replay'},
            'observed_ksw_kg': float(current.ksw_kg),
            'available_dates': test.service_date.tolist(), 'source_doi': meta['source']['doi']}


def forecast(request):
    meta, models = assets()
    history = [r.model_dump() for r in request.history]
    x = forecast_frame(request.service_date, request.menu_code, history)
    predictions = {}
    for name, obj in models.items():
        matrix = obj['preprocessor'].transform(x[obj['features']])
        predictions[name] = max(0., float(obj['model'].predict(matrix)[0]))
    predictions['TrainingMedian'] = meta['training_median_kg']
    for name, field in [('Past5DayMean', 'ksw_mean5'), ('PreviousMeasuredDay', 'ksw_lag1')]:
        value = float(x[field].iloc[0])
        predictions[name] = value if np.isfinite(value) else None
    method = meta['default_method'] if request.method == 'default' else request.method
    value = predictions[method]
    if value is None: raise ValueError('Requested baseline is unavailable for the supplied missing history')
    return {'target': meta['target'], 'unit': 'kg/day', 'service_date': str(request.service_date),
            'method': method, 'predicted_ksw_kg': value, 'comparison': predictions,
            'history_days': len(history), 'latest_history_date': str(max(r['service_date'] for r in history)),
            'missing_feature_count': int(x.isna().sum().sum()),
            'source_doi': meta['source']['doi'], 'context': request.context,
            'scope': meta['scope'], 'donation_eligible': False,
            'interpretation': 'Kitchen + serving waste estimate. Donatable unserved surplus is not estimated.',
            'population_note': 'Trained on one Finnish school. Other canteens are unvalidated exploratory use.'}
