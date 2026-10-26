"""Stateless matching proposals from confirmed food and current snapshots."""
from pathlib import Path
from functools import lru_cache
import json,sys,hashlib
import numpy as np,pandas as pd
from app.ml.ngo_ranker import FEATURES,candidate_row
from app.ml.model_runtime import validate_model_runtime
BACKEND=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(BACKEND/'ml_packages'))
ART=BACKEND/'app/ml/artifacts/ngo_ranking'


@lru_cache(maxsize=1)
def assets():
    validate_model_runtime()
    import joblib
    if not (ART/'manifest.json').exists():raise RuntimeError('NGO ranking artifacts are unavailable. Run backend/export_ngo_ranker.py.')
    manifest=json.loads((ART/'manifest.json').read_text(encoding='utf-8'))
    for name,digest in manifest['sha256'].items():
        path=ART/name
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest()!=digest:
            raise RuntimeError('NGO model artifact integrity check failed: '+name)
    meta=json.loads((ART/'metadata.json').read_text(encoding='utf-8'))
    models={name:joblib.load(ART/(name+'.joblib')) for name in ['RandomForest','LightGBM']}
    if any(obj['features']!=FEATURES or obj['target']!='fraction_of_confirmed_offer_received_within_declared_windows' for obj in models.values()):
        raise RuntimeError('NGO matching target/feature contract mismatch')
    return meta,models


def info():return assets()[0]


def example(index=0):
    assets()
    examples=json.loads((ART/'examples.json').read_text(encoding='utf-8'))
    if index<0 or index>=len(examples):raise ValueError('Example index outside available range')
    return {'request':examples[index],'examples':len(examples),'data_origin':'synthetic'}


def rank(request):
    meta,models=assets();offer=request.offer.model_dump(mode='json')
    method=meta['default_policy'] if request.method=='default' else request.method
    features=[];gates=[];candidates=[]
    for candidate in request.candidates:
        c=candidate.model_dump(mode='json');x,g=candidate_row(offer,c)
        features.append(x);gates.append(g);candidates.append(c)
    frame=pd.DataFrame(features,columns=FEATURES)
    estimates={}
    for name,obj in models.items():
        matrix=obj['imputer'].transform(frame)
        estimates[name]=(np.clip(obj['fraction_model'].predict(matrix),0,1),np.maximum(0,obj['eta_model'].predict(matrix)))
    ranked=[];rejected=[]
    for i,(c,x,g) in enumerate(zip(candidates,features,gates)):
        common=dict(candidate_id=c['candidate_id'],ngo_id=c['ngo_id'],courier_id=c['courier_id'],
            eligible=g['eligible'],rejection_reasons=g['reasons'],straight_distance_km=g['straight_distance_km'],
            route_distance_km=c['route_distance_km'],nominal_elapsed_minutes=g['nominal_elapsed_minutes'],
            declared_margin_minutes=x['deadline_slack_minutes'])
        if not g['eligible']:
            rejected.append(common);continue
        if method in models:
            fraction=float(estimates[method][0][i]);elapsed=float(estimates[method][1][i]);score=fraction-.001*elapsed
        else:
            fraction=None;elapsed=g['nominal_elapsed_minutes']
            score={'NearestFeasible':-g['straight_distance_km'],'EarliestFeasible':-elapsed,
                'HistoryDemand':(c['recipient_acceptance_rate'] if c['recipient_acceptance_rate'] is not None else .5)*min(1,x['demand_ratio'])-.001*elapsed}[method]
        # Out-of-range input warning compares only training feature support.
        support=meta['feature_support']
        extrapolated=[f for f in FEATURES if pd.notna(x[f]) and (x[f]<support[f]['min']-1e-6 or x[f]>support[f]['max']+1e-6)]
        ranked.append(dict(**common,ranking_score=float(score),estimated_received_fraction=fraction,
            estimated_received_kg=None if fraction is None else fraction*offer['confirmed_quantity_kg'],
            predicted_elapsed_minutes=float(elapsed),extrapolated_features=extrapolated,
            missing_feature_count=int(pd.isna(frame.iloc[i]).sum()),
            model_eta_exceeds_window=bool(elapsed>min(x['delivery_remaining_minutes'],x['close_minutes'],x['shift_remaining_minutes']))))
    ranked.sort(key=lambda r:(-r['ranking_score'],r['nominal_elapsed_minutes'],r['candidate_id']))
    return dict(method=method,offer_id=offer['offer_id'],confirmed_quantity_kg=offer['confirmed_quantity_kg'],
        selected_candidate_id=ranked[0]['candidate_id'] if ranked else None,
        status='proposal_only' if ranked else 'no_feasible_candidate',ranked=ranked,rejected=rejected,
        scope='synthetic_snapshot_model',allocation_reserved=False,food_safety_validated=False,
        interpretation='Ranking proposal only. Recheck recipient capacity and courier state before reservation. Declared windows do not establish biological safety.',
        context=request.context)
