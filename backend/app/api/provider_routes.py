"""
Provider routes - food data management & predictions.
"""
from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import FoodDataCreate, FoodDataOut, PredictionOut
from app.core.database import db
from app.core.auth import get_current_user, require_role
from app.services.prediction_service import predict_surplus

router = APIRouter(prefix="/api", tags=["provider"])


@router.post("/food-data", response_model=FoodDataOut)
async def upload_food_data(data: FoodDataCreate, current_user: dict = Depends(require_role("provider"))):
    entry = db.add_food_data(current_user["id"], data.model_dump())
    
    # Automatically generate prediction for the newly uploaded data
    predict_surplus(current_user["id"], [entry])

    return entry


@router.get("/food-data", response_model=List[FoodDataOut])
async def get_food_data(current_user: dict = Depends(require_role("provider"))):
    return db.get_food_data_by_provider(current_user["id"])


@router.get("/predictions", response_model=List[PredictionOut])
async def get_predictions(current_user: dict = Depends(require_role("provider"))):
    return db.get_predictions_by_provider(current_user["id"])


@router.post("/predict")
async def run_prediction(current_user: dict = Depends(require_role("provider"))):
    """Run ML prediction on current provider's food data."""
    food_data = db.get_food_data_by_provider(current_user["id"])
    if not food_data:
        return {"message": "No food data to predict on", "predictions": []}

    predictions = db.get_predictions_by_provider(current_user["id"])
    existing_food_ids = {p.get("food_id") for p in predictions if p.get("food_id")}
    
    unpredicted_food = [f for f in food_data if f["id"] not in existing_food_ids]
    
    if not unpredicted_food:
        return {"message": "All food data already has predictions", "predictions": []}

    results = predict_surplus(current_user["id"], unpredicted_food)
    return {"message": f"Generated {len(results)} new predictions", "predictions": results}
