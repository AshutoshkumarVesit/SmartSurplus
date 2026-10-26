"""Confirmed-offer and candidate snapshot contract for experimental ranking."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel,Field,field_validator,model_validator

Storage=Literal['ambient','cold_storage','hot_holding']
Category=Literal['grain','bread','protein','vegetable','dairy','fruit','soup','dessert']
Method=Literal['default','LightGBM','RandomForest','NearestFeasible','EarliestFeasible','HistoryDemand']


class Snapshot(BaseModel):
    model_config={'extra':'forbid','allow_inf_nan':False}

    @field_validator('*')
    @classmethod
    def aware_time(cls,value):
        if isinstance(value,datetime) and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError('Timestamps require explicit timezone offsets')
        return value


class ConfirmedOffer(Snapshot):
    offer_id:str=Field(min_length=1,max_length=100)
    decision_at:datetime
    confirmed_quantity_kg:float=Field(gt=0,le=1000)
    quality_confirmed:bool
    food_category:Category
    dietary_type:Literal['veg','nonveg']
    required_storage:Storage
    latitude:float=Field(ge=-90,le=90)
    longitude:float=Field(ge=-180,le=180)
    pickup_ready_at:datetime
    pickup_deadline_at:datetime
    delivery_deadline_at:datetime
    loading_minutes:float=Field(ge=0,le=120)
    rain_mm:float=Field(ge=0,le=500)
    temperature_c:float=Field(ge=-20,le=60)
    traffic_index:float=Field(ge=.5,le=5)

    @model_validator(mode='after')
    def windows(self):
        if not (self.decision_at<=self.pickup_ready_at<=self.pickup_deadline_at and self.pickup_ready_at<self.delivery_deadline_at):
            raise ValueError('Require decision ≤ ready ≤ pickup deadline and ready < delivery deadline')
        if (self.delivery_deadline_at-self.decision_at).total_seconds()>24*3600:
            raise ValueError('This snapshot model accepts declared windows of at most 24 hours')
        return self


class NGOCandidate(Snapshot):
    candidate_id:str=Field(min_length=1,max_length=100)
    ngo_id:str=Field(min_length=1,max_length=100)
    courier_id:str=Field(min_length=1,max_length=100)
    latitude:float=Field(ge=-90,le=90)
    longitude:float=Field(ge=-180,le=180)
    available_capacity_kg:float|None=Field(default=None,ge=0,le=10000)
    accepting:bool
    accepted_categories:list[Category]=Field(max_length=8)
    vegetarian_only:bool
    storage_capabilities:list[Storage]=Field(max_length=3)
    courier_storage_capabilities:list[Storage]=Field(max_length=3)
    vehicle_capacity_kg:float=Field(gt=0,le=10000)
    report_updated_at:datetime
    route_distance_km:float=Field(ge=0,le=300)
    travel_minutes:float=Field(ge=0,le=720)
    approach_minutes:float=Field(ge=0,le=720)
    courier_available_at:datetime
    courier_shift_end_at:datetime
    receiving_start_at:datetime
    receiving_end_at:datetime
    unloading_minutes:float=Field(ge=0,le=120)
    recipient_acceptance_rate:float|None=Field(default=None,ge=0,le=1)
    recipient_history_count:int=Field(default=0,ge=0,strict=True)
    courier_ontime_rate:float|None=Field(default=None,ge=0,le=1)
    courier_history_count:int=Field(default=0,ge=0,strict=True)
    demand_kg:float=Field(ge=0,le=10000)

    @model_validator(mode='after')
    def consistent(self):
        if self.receiving_end_at<=self.receiving_start_at:raise ValueError('Receiving window must have positive duration')
        if self.courier_shift_end_at<self.courier_available_at:raise ValueError('Courier shift must end after availability')
        for rate,count in [(self.recipient_acceptance_rate,self.recipient_history_count),(self.courier_ontime_rate,self.courier_history_count)]:
            if (rate is None)!=(count==0):raise ValueError('A past rate needs a positive history count; absent history must have null rate and count zero')
        return self


class RankRequest(Snapshot):
    offer:ConfirmedOffer
    candidates:list[NGOCandidate]=Field(min_length=1,max_length=100)
    method:Method='default'
    context:Literal['synthetic_example','user_snapshot']='user_snapshot'

    @model_validator(mode='after')
    def unique_options(self):
        ids=[c.candidate_id for c in self.candidates]
        pairs=[(c.ngo_id,c.courier_id) for c in self.candidates]
        if len(ids)!=len(set(ids)) or len(pairs)!=len(set(pairs)):
            raise ValueError('Candidate IDs and NGO/courier pairs must be unique')
        return self
