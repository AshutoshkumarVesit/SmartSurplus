"""
Matching Engine - Matches surplus food with nearest NGOs.
Uses distance + urgency + quantity for priority scoring.
"""
import math
from typing import List
from app.core.database import db


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def calculate_urgency(expiry_hours: float, is_perishable: bool) -> float:
    """Calculate urgency score (0-10) based on expiry and perishability."""
    base_urgency = max(0, min(10, 10 - (expiry_hours / 2.4)))
    if is_perishable:
        base_urgency = min(10, base_urgency * 1.3)
    return round(base_urgency, 1)


def find_best_matches(prediction_id: str, provider_id: str, food_type: str,
                      quantity_kg: float, expiry_hours: float = 6.0,
                      is_perishable: bool = True, top_n: int = 3) -> List[dict]:
    """Find the best NGO matches for a surplus prediction."""
    provider = db.get_user_by_id(provider_id)
    if not provider or not provider.get("latitude"):
        return []

    p_lat, p_lon = provider["latitude"], provider["longitude"]
    urgency = calculate_urgency(expiry_hours, is_perishable)

    ngos = db.get_users_by_role("ngo")
    candidates = []

    for ngo in ngos:
        if not ngo.get("latitude"):
            continue

        distance = haversine_distance(p_lat, p_lon, ngo["latitude"], ngo["longitude"])

        # Priority score = (urgency * quantity) / distance
        priority = round((urgency * quantity_kg) / max(distance, 0.1), 2)

        # Check NGO capacity
        active_matches = [m for m in db.get_matches_by_ngo(ngo["id"])
                          if m.get("status") in ("pending", "accepted", "picked_up")]
        active_qty = sum(m.get("quantity_kg", 0) for m in active_matches)
        remaining_capacity = ngo.get("capacity", 100) - active_qty

        if remaining_capacity < quantity_kg * 0.5:
            priority *= 0.5  # Penalize near-capacity NGOs

        candidates.append({
            "prediction_id": prediction_id,
            "provider_id": provider_id,
            "provider_name": provider.get("name", ""),
            "ngo_id": ngo["id"],
            "ngo_name": ngo["name"],
            "food_type": food_type,
            "quantity_kg": quantity_kg,
            "distance_km": distance,
            "urgency_score": urgency,
            "priority_score": priority,
        })

    # Sort by priority (highest first)
    candidates.sort(key=lambda c: c["priority_score"], reverse=True)

    # Create matches for top N
    matches = []
    for c in candidates[:top_n]:
        match = db.add_match(c)
        matches.append(match)

    return matches
