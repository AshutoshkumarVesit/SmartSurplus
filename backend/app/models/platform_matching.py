"""Platform profiles and confirmed food inputs; candidates come from the registry."""
from datetime import datetime
from typing import Literal
from pydantic import Field, model_validator
from app.models.ngo_ranking import Snapshot, Category, Storage


class NGOAvailability(Snapshot):
    accepting: bool
    available_capacity_kg: float = Field(ge=0, le=10000)
    demand_kg: float = Field(ge=0, le=10000)
    accepted_categories: list[Category] = Field(max_length=8)
    vegetarian_only: bool = False
    storage_capabilities: list[Storage] = Field(max_length=3)
    receiving_start_at: datetime
    receiving_end_at: datetime
    unloading_minutes: float = Field(default=5, ge=0, le=120)

    @model_validator(mode='after')
    def valid_window(self):
        if self.receiving_end_at <= self.receiving_start_at:
            raise ValueError('Receiving end must be later than receiving start')
        return self


class RegisteredMatchRequest(Snapshot):
    food_id: str | None = Field(default=None, max_length=100)
    food_name: str = Field(min_length=1, max_length=150)
    confirmed_quantity_kg: float = Field(gt=0, le=1000)
    quality_confirmed: bool
    food_category: Category
    dietary_type: Literal['veg', 'nonveg']
    required_storage: Storage
    pickup_within_minutes: float = Field(gt=0, le=1440)
    delivery_within_minutes: float = Field(gt=0, le=1440)
    vehicle_capacity_kg: float = Field(gt=0, le=10000)
    transport_storage: list[Storage] = Field(min_length=1, max_length=3)
    loading_minutes: float = Field(default=5, ge=0, le=120)
    average_speed_kmh: float = Field(default=20, ge=5, le=80)
    road_distance_factor: float = Field(default=1.3, ge=1, le=3)
    traffic_index: float = Field(default=1, ge=.5, le=5)
    rain_mm: float = Field(default=0, ge=0, le=500)
    temperature_c: float = Field(default=25, ge=-20, le=60)
    method: Literal['default', 'LightGBM', 'RandomForest'] = 'default'

    @model_validator(mode='after')
    def valid_offer(self):
        if not self.food_name.strip():
            raise ValueError('Enter a food name')
        if self.pickup_within_minutes > self.delivery_within_minutes:
            raise ValueError('Pickup window cannot end after delivery window')
        return self
