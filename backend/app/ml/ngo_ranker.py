"""Shared NGO candidate features and deterministic operational constraints.

No model can override these gates. Declared windows are not biological safety.
"""
import math
import pandas as pd

MAX_REPORT_AGE_MIN = 120.0  # Explicit prototype policy, not an empirical estimate.
FEATURES = ['quantity_kg','route_distance_km','approach_minutes','queue_minutes',
    'travel_minutes','loading_minutes','unloading_minutes','ready_minutes',
    'pickup_remaining_minutes','delivery_remaining_minutes','open_minutes',
    'close_minutes','shift_remaining_minutes','report_age_minutes',
    'recipient_acceptance_rate','recipient_history_count','courier_ontime_rate',
    'courier_history_count','rain_mm','temperature_c','traffic_index',
    'demand_kg','capacity_ratio','demand_ratio','nominal_elapsed_minutes',
    'deadline_slack_minutes','required_cold','required_hot']


def haversine(lat1,lon1,lat2,lon2):
    a,b=math.radians(lat1),math.radians(lat2)
    h=math.sin((b-a)/2)**2+math.cos(a)*math.cos(b)*math.sin(math.radians(lon2-lon1)/2)**2
    return 6371*2*math.asin(math.sqrt(min(1,max(0,h))))


def candidate_row(offer,candidate):
    decision=pd.Timestamp(offer['decision_at'])
    delta=lambda value:(pd.Timestamp(value)-decision).total_seconds()/60
    qty=float(offer['confirmed_quantity_kg'])
    storage=offer['required_storage']; cold=storage=='cold_storage';hot=storage=='hot_holding'
    distance=haversine(offer['latitude'],offer['longitude'],candidate['latitude'],candidate['longitude'])
    ready=max(0.,delta(offer['pickup_ready_at']))
    queue=max(0.,delta(candidate['courier_available_at']))
    approach=float(candidate['approach_minutes']);travel=float(candidate['travel_minutes'])
    loading=float(offer['loading_minutes']);unloading=float(candidate['unloading_minutes'])
    pickup=max(ready,queue+approach)
    opening=delta(candidate['receiving_start_at']);closing=delta(candidate['receiving_end_at'])
    eta=max(opening,pickup+loading+travel+unloading)
    pickup_limit=delta(offer['pickup_deadline_at']);deadline=delta(offer['delivery_deadline_at'])
    shift_end=delta(candidate['courier_shift_end_at'])
    report_age=-delta(candidate['report_updated_at'])
    capacity=candidate['available_capacity_kg']
    reasons=[]
    gates=[(offer['quality_confirmed'],'donor_quality_not_confirmed'),
        (candidate['accepting'],'ngo_not_accepting'),
        (offer['food_category'] in candidate['accepted_categories'],'food_category_incompatible'),
        (not (candidate['vegetarian_only'] and offer['dietary_type']=='nonveg'),'diet_incompatible'),
        (storage in candidate['storage_capabilities'],'ngo_storage_incompatible'),
        (storage in candidate['courier_storage_capabilities'],'transport_storage_incompatible'),
        (capacity is not None,'capacity_unknown'),
        (capacity is not None and capacity>=qty,'capacity_insufficient'),
        (candidate['vehicle_capacity_kg']>=qty,'vehicle_capacity_insufficient'),
        (0<=report_age<=MAX_REPORT_AGE_MIN,'capacity_report_stale_or_future'),
        (pickup<=pickup_limit,'pickup_window_missed'),
        (eta<=min(deadline,closing,shift_end),'estimated_arrival_outside_window')]
    for ok,reason in gates:
        if not ok:reasons.append(reason)
    route=float(candidate['route_distance_km'])
    if route+1e-6<distance:reasons.append('route_shorter_than_straight_line')
    cap=float(capacity) if capacity is not None else float('nan')
    row=dict(quantity_kg=qty,route_distance_km=route,approach_minutes=approach,
        queue_minutes=queue,travel_minutes=travel,loading_minutes=loading,unloading_minutes=unloading,
        ready_minutes=ready,pickup_remaining_minutes=pickup_limit,delivery_remaining_minutes=deadline,
        open_minutes=opening,close_minutes=closing,shift_remaining_minutes=shift_end,
        report_age_minutes=report_age,recipient_acceptance_rate=candidate['recipient_acceptance_rate'],
        recipient_history_count=candidate['recipient_history_count'],courier_ontime_rate=candidate['courier_ontime_rate'],
        courier_history_count=candidate['courier_history_count'],rain_mm=offer['rain_mm'],
        temperature_c=offer['temperature_c'],traffic_index=offer['traffic_index'],demand_kg=candidate['demand_kg'],
        capacity_ratio=cap/qty,demand_ratio=candidate['demand_kg']/qty,nominal_elapsed_minutes=eta,
        deadline_slack_minutes=min(deadline,closing,shift_end)-eta,required_cold=int(cold),required_hot=int(hot))
    return row,dict(eligible=not reasons,reasons=reasons,nominal_elapsed_minutes=eta,
                    nominal_pickup_minutes=pickup,straight_distance_km=distance)
