"""
Pydantic schemas for all entities in SmartSurplus.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    PROVIDER = "provider"
    NGO = "ngo"
    ADMIN = "admin"


class WasteRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RedistributionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    REJECTED = "rejected"


# ---------- Auth ----------
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: str
    role: UserRole
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Provider-specific
    cuisine_type: Optional[str] = None
    provider_type: Optional[str] = None  # restaurant, hostel, cloud_kitchen, event
    # NGO-specific
    capacity: Optional[int] = None  # max people they can serve


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: UserRole
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cuisine_type: Optional[str] = None
    provider_type: Optional[str] = None
    capacity: Optional[int] = None
    created_at: str


# ---------- Food Data ----------
class FoodDataCreate(BaseModel):
    food_type: str  # e.g., "rice", "bread", "vegetables"
    quantity_kg: float = Field(..., gt=0)
    prepared_at: Optional[str] = None
    expiry_hours: float = Field(default=6.0, gt=0)  # hours until spoilage
    is_perishable: bool = True
    meal_type: Optional[str] = None  # breakfast, lunch, dinner
    event_type: Optional[str] = None  # if from event organizer
    notes: Optional[str] = None


class FoodDataOut(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    food_type: str
    quantity_kg: float
    prepared_at: str
    expiry_hours: float
    is_perishable: bool
    meal_type: Optional[str] = None
    event_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


# ---------- Predictions ----------
class PredictionOut(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    food_type: str
    predicted_surplus_kg: float
    actual_quantity_kg: float
    waste_risk: WasteRisk
    confidence: float  # 0.0 - 1.0
    predicted_at: str
    recommendations: List[str]
    expiry_hours: Optional[float] = None


# ---------- Matching ----------
class MatchOut(BaseModel):
    id: str
    prediction_id: str
    provider_id: str
    provider_name: str
    ngo_id: str
    ngo_name: str
    food_type: str
    quantity_kg: float
    distance_km: float
    urgency_score: float  # 0-10
    priority_score: float  # composite score
    status: RedistributionStatus
    created_at: str


class MatchAction(BaseModel):
    match_id: str
    action: Literal["accept", "reject"]


class DeliveryConfirm(BaseModel):
    match_id: str
    quantity_received_kg: float
    notes: Optional[str] = None


# ---------- Analytics ----------
class SystemStats(BaseModel):
    total_providers: int
    total_ngos: int
    total_food_entries: int
    total_predictions: int
    total_redistributions: int
    successful_deliveries: int
    total_waste_saved_kg: float
    avg_prediction_accuracy: float
    active_matches: int


class HotspotData(BaseModel):
    latitude: float
    longitude: float
    intensity: float  # 0.0 - 1.0
    provider_name: str
    avg_waste_kg: float


class MapMarker(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    type: str  # "provider" or "ngo"
    details: dict
