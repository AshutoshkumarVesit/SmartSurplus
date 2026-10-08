"""
Admin routes - system analytics, user management, logs.
"""
from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import SystemStats, UserOut
from app.core.database import db
from app.core.auth import require_role
from app.services.analytics_service import compute_system_stats

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(current_user: dict = Depends(require_role("admin"))):
    return compute_system_stats()


@router.get("/users")
async def get_all_users(current_user: dict = Depends(require_role("admin"))):
    users = db.get_all_users()
    return [{k: v for k, v in u.items() if k != "password"} for u in users]


@router.get("/logs")
async def get_logs(current_user: dict = Depends(require_role("admin"))):
    return db.get_logs()


@router.get("/predictions")
async def get_all_predictions(current_user: dict = Depends(require_role("admin"))):
    return db.get_all_predictions()


@router.get("/matches")
async def get_all_matches(current_user: dict = Depends(require_role("admin"))):
    return db.get_all_matches()


@router.get("/food-data")
async def get_all_food_data(current_user: dict = Depends(require_role("admin"))):
    return db.get_all_food_data()
