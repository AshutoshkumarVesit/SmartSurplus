"""Rank actual registered NGOs through the frozen model, without reserving food."""
from datetime import datetime, timezone, timedelta
from math import isfinite
from uuid import uuid4
from app.core.database import db
from app.ml.ngo_ranker import haversine
from app.models.ngo_ranking import RankRequest
from app.services.ngo_ranking_service import rank, assets


def located(user):
    try:
        lat, lon = float(user['latitude']), float(user['longitude'])
        return isfinite(lat) and isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180
    except (KeyError, TypeError, ValueError):
        return False


def public_ngo(ngo, now):
    profile = ngo.get('donation_availability')
    reasons = []
    if not located(ngo): reasons.append('location_missing')
    if not profile:
        reasons.append('availability_not_reported')
    else:
        if not profile['accepting']: reasons.append('ngo_not_accepting')
        age = (now - datetime.fromisoformat(profile['report_updated_at'])).total_seconds() / 60
        if not 0 <= age <= 120: reasons.append('capacity_report_stale_or_future')
        if datetime.fromisoformat(profile['receiving_end_at']) <= now: reasons.append('receiving_window_closed')
    return dict(ngo_id=ngo['id'], ngo_name=ngo['name'], address=ngo.get('address') or '',
                latitude=ngo.get('latitude'), longitude=ngo.get('longitude'),
                capacity_people_per_day=ngo.get('capacity'), availability=profile,
                profile_issues=reasons)


def registry(provider):
    now = datetime.now(timezone.utc)
    return dict(provider={k: provider.get(k) for k in ['id','name','latitude','longitude']},
                ngos=[public_ngo(ngo, now) for ngo in db.get_users_by_role('ngo')],
                default_method=assets()[0]['default_policy'],
                directory_source='platform_registry', max_report_age_minutes=120)


def save_availability(ngo, payload):
    now = datetime.now(timezone.utc)
    if payload.receiving_end_at <= now:
        raise ValueError('Receiving window must end in the future')
    ngo['donation_availability'] = {
        **payload.model_dump(mode='json'), 'report_updated_at': now.isoformat(),
        'source': 'ngo_reported',
    }
    return public_ngo(ngo, now)


def history(ngo, now):
    completed = []
    for match in db.get_matches_by_ngo(ngo['id']):
        if match.get('status') not in ['accepted','picked_up','delivered','rejected']: continue
        timestamp = match.get('response_recorded_at')
        if not timestamp: continue
        if datetime.fromisoformat(timestamp) < now: completed.append(match)
    return (sum(m['status'] != 'rejected' for m in completed) / len(completed), len(completed)) if completed else (None, 0)


def rank_registered(provider, payload):
    if not located(provider):
        raise ValueError('Your provider profile needs valid map coordinates before ranking nearby NGOs')
    if not payload.quality_confirmed:
        raise ValueError('Confirm that the food quantity and quality have been checked before matching')
    food_name = payload.food_name.strip()
    if payload.food_id:
        food = next((f for f in db.get_food_data_by_provider(provider['id']) if f['id'] == payload.food_id), None)
        if not food: raise ValueError('Select a food record belonging to your provider account')
        if payload.confirmed_quantity_kg > food['quantity_kg'] + food.get('carry_in_kg', 0):
            raise ValueError('Confirmed donation cannot exceed the quantity in this food record')
        food_name = food['food_type']
    now = datetime.now(timezone.utc)
    delivery_end = now + timedelta(minutes=payload.delivery_within_minutes)
    offer = dict(offer_id='PLATFORM-' + uuid4().hex[:16], decision_at=now,
        confirmed_quantity_kg=payload.confirmed_quantity_kg, quality_confirmed=True,
        food_category=payload.food_category, dietary_type=payload.dietary_type,
        required_storage=payload.required_storage, latitude=provider['latitude'], longitude=provider['longitude'],
        pickup_ready_at=now, pickup_deadline_at=now + timedelta(minutes=payload.pickup_within_minutes),
        delivery_deadline_at=delivery_end, loading_minutes=payload.loading_minutes,
        rain_mm=payload.rain_mm, temperature_c=payload.temperature_c, traffic_index=payload.traffic_index)
    candidates, incomplete = [], []
    directory = {}
    for ngo in db.get_users_by_role('ngo'):
        item = public_ngo(ngo, now)
        directory[ngo['id']] = item
        profile = item['availability']
        if not profile or not located(ngo):
            incomplete.append(dict(**item, eligible=False, rejection_reasons=item['profile_issues']))
            continue
        # Reported kg capacity is already the currently available amount, not a people conversion.
        distance = haversine(provider['latitude'], provider['longitude'], ngo['latitude'], ngo['longitude'])
        road = distance * payload.road_distance_factor
        rate, count = history(ngo, now)
        candidates.append(dict(candidate_id='NGO-' + ngo['id'], ngo_id=ngo['id'],
            courier_id='provider-arranged-' + provider['id'], latitude=ngo['latitude'], longitude=ngo['longitude'],
            available_capacity_kg=profile['available_capacity_kg'], accepting=profile['accepting'],
            accepted_categories=profile['accepted_categories'], vegetarian_only=profile['vegetarian_only'],
            storage_capabilities=profile['storage_capabilities'], courier_storage_capabilities=payload.transport_storage,
            vehicle_capacity_kg=payload.vehicle_capacity_kg, report_updated_at=profile['report_updated_at'],
            route_distance_km=road, travel_minutes=road / payload.average_speed_kmh * 60 * payload.traffic_index,
            approach_minutes=0, courier_available_at=now, courier_shift_end_at=delivery_end,
            receiving_start_at=profile['receiving_start_at'], receiving_end_at=profile['receiving_end_at'],
            unloading_minutes=profile['unloading_minutes'], recipient_acceptance_rate=rate,
            recipient_history_count=count, courier_ontime_rate=None, courier_history_count=0,
            demand_kg=profile['demand_kg']))
    # Score in chunks so every registered NGO can be considered beyond the research API's 100-option limit.
    ranked, rejected = [], incomplete
    method = assets()[0]['default_policy'] if payload.method == 'default' else payload.method
    for offset in range(0, len(candidates), 100):
        result = rank(RankRequest(offer=offer, candidates=candidates[offset:offset+100], method=payload.method))
        for item in result['ranked'] + result['rejected']:
            ngo = directory[item['ngo_id']]
            item.update(ngo_name=ngo['ngo_name'], address=ngo['address'],
                        available_capacity_kg=ngo['availability']['available_capacity_kg'],
                        receiving_end_at=ngo['availability']['receiving_end_at'],
                        availability_source=ngo['availability']['source'],
                        report_updated_at=ngo['availability']['report_updated_at'])
            item['estimated_delivery_minutes'] = max(item['nominal_elapsed_minutes'], item.get('predicted_elapsed_minutes', 0))
            # Platform recommendations also require the learned ETA to fit the declared window.
            if item.get('model_eta_exceeds_window'):
                item['eligible'] = False
                item['rejection_reasons'] = [*item['rejection_reasons'], 'model_eta_exceeds_declared_window']
            (ranked if item['eligible'] else rejected).append(item)
    ranked.sort(key=lambda item: (-item['ranking_score'], item['nominal_elapsed_minutes'], item['candidate_id']))
    return dict(method=method, directory_source='platform_registry', generated_at=now.isoformat(),
        food_name=food_name, confirmed_quantity_kg=payload.confirmed_quantity_kg,
        delivery_deadline_at=delivery_end.isoformat(), total_registered_ngos=len(directory),
        recommended_ngo_id=ranked[0]['ngo_id'] if ranked else None,
        status='proposal_only' if ranked else 'no_feasible_candidate', ranked=ranked, rejected=rejected,
        allocation_reserved=False, food_safety_validated=False,
        route_source='distance_estimate_not_live_routing',
        assumptions=dict(average_speed_kmh=payload.average_speed_kmh, road_distance_factor=payload.road_distance_factor,
            traffic_index=payload.traffic_index, rain_mm=payload.rain_mm, temperature_c=payload.temperature_c,
            delivery_mode='provider_arranged', courier_history='unavailable'),
        interpretation='Registered NGOs ranked by the synthetic-trained model using reported availability and estimated travel. Confirm arrangements and handling conditions with the NGO; no capacity is reserved.')
