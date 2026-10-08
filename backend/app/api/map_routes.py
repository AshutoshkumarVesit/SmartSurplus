"""
Map routes - provider/NGO markers, hotspot data for heatmap.
"""
from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import MapMarker, HotspotData
from app.core.database import db
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/providers", response_model=List[MapMarker])
async def get_provider_markers(current_user: dict = Depends(get_current_user)):
    providers = db.get_users_by_role("provider")
    markers = []
    for p in providers:
        if p.get("latitude") and p.get("longitude"):
            food_count = len(db.get_food_data_by_provider(p["id"]))
            predictions = db.get_predictions_by_provider(p["id"])
            high_risk = sum(1 for pred in predictions if pred.get("waste_risk") == "high")
            markers.append({
                "id": p["id"],
                "name": p["name"],
                "latitude": p["latitude"],
                "longitude": p["longitude"],
                "type": "provider",
                "details": {
                    "provider_type": p.get("provider_type", ""),
                    "cuisine_type": p.get("cuisine_type", ""),
                    "address": p.get("address", ""),
                    "food_entries": food_count,
                    "high_risk_predictions": high_risk,
                },
            })
    return markers


@router.get("/ngos", response_model=List[MapMarker])
async def get_ngo_markers(current_user: dict = Depends(get_current_user)):
    ngos = db.get_users_by_role("ngo")
    markers = []
    for n in ngos:
        if n.get("latitude") and n.get("longitude"):
            match_count = len(db.get_matches_by_ngo(n["id"]))
            delivered = sum(1 for m in db.get_matches_by_ngo(n["id"]) if m.get("status") == "delivered")
            markers.append({
                "id": n["id"],
                "name": n["name"],
                "latitude": n["latitude"],
                "longitude": n["longitude"],
                "type": "ngo",
                "details": {
                    "capacity": n.get("capacity", 0),
                    "address": n.get("address", ""),
                    "total_matches": match_count,
                    "deliveries_completed": delivered,
                },
            })
    return markers


@router.get("/hotspots", response_model=List[HotspotData])
async def get_hotspots(current_user: dict = Depends(get_current_user)):
    """Generate waste hotspot data based on prediction history."""
    providers = db.get_users_by_role("provider")
    hotspots = []
    for p in providers:
        predictions = db.get_predictions_by_provider(p["id"])
        if not predictions or not p.get("latitude"):
            continue

        total_waste = sum(pred.get("predicted_surplus_kg", 0) for pred in predictions)
        high_risk_count = sum(1 for pred in predictions if pred.get("waste_risk") == "high")
        avg_waste = total_waste / len(predictions) if predictions else 0

        # Intensity = normalized waste (0-1)
        intensity = min(1.0, (high_risk_count / max(len(predictions), 1)) * 2)

        if intensity > 0.1:
            hotspots.append({
                "latitude": p["latitude"],
                "longitude": p["longitude"],
                "intensity": round(intensity, 2),
                "provider_name": p["name"],
                "avg_waste_kg": round(avg_waste, 1),
            })

    return sorted(hotspots, key=lambda h: h["intensity"], reverse=True)
