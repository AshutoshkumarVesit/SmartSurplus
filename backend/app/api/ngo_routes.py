"""
NGO routes - match notifications, accept pickups, confirm deliveries.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import MatchOut, MatchAction, DeliveryConfirm
from app.core.database import db
from app.core.auth import get_current_user, require_role

router = APIRouter(prefix="/api/ngo", tags=["ngo"])


@router.get("/matches", response_model=List[MatchOut])
async def get_ngo_matches(current_user: dict = Depends(require_role("ngo"))):
    """Get all matches assigned to this NGO, sorted by priority."""
    matches = db.get_matches_by_ngo(current_user["id"])
    return sorted(matches, key=lambda m: m.get("priority_score", 0), reverse=True)


@router.post("/accept")
async def accept_match(action: MatchAction, current_user: dict = Depends(require_role("ngo"))):
    match = db.get_match_by_id(action.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match["ngo_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this match")

    new_status = "accepted" if action.action == "accept" else "rejected"
    updated = db.update_match_status(action.match_id, new_status)

    db.add_log({
        "match_id": action.match_id,
        "provider_name": match["provider_name"],
        "ngo_name": match["ngo_name"],
        "food_type": match["food_type"],
        "quantity_kg": match["quantity_kg"],
        "action": new_status,
    })

    return {"message": f"Match {new_status}", "match": updated}


@router.post("/confirm")
async def confirm_delivery(data: DeliveryConfirm, current_user: dict = Depends(require_role("ngo"))):
    match = db.get_match_by_id(data.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match["ngo_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this match")

    updated = db.update_match_status(data.match_id, "delivered")

    db.add_log({
        "match_id": data.match_id,
        "provider_name": match["provider_name"],
        "ngo_name": match["ngo_name"],
        "food_type": match["food_type"],
        "quantity_kg": data.quantity_received_kg,
        "action": "delivered",
        "notes": data.notes,
    })

    return {"message": "Delivery confirmed", "match": updated}
