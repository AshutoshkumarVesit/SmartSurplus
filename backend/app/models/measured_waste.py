"""Measured-waste contracts, intentionally separate from surplus/donation."""
from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class WasteHistoryDay(BaseModel):
    model_config = {'extra': 'forbid', 'allow_inf_nan': False}
    service_date: date
    ksw_kg: float | None = Field(default=None, ge=0)
    diners: int | None = Field(default=None, gt=0, strict=True)


class WasteForecastRequest(BaseModel):
    model_config = {'extra': 'forbid', 'allow_inf_nan': False}
    service_date: date
    menu_code: int = Field(ge=1, le=25, strict=True)
    history: list[WasteHistoryDay] = Field(min_length=20, max_length=730)
    method: Literal['default', 'LightGBM', 'RandomForest', 'TrainingMedian',
                    'Past5DayMean', 'PreviousMeasuredDay'] = 'default'
    context: Literal['source_school_replay', 'new_canteen_exploration'] = 'new_canteen_exploration'

    @model_validator(mode='after')
    def causal_history(self):
        dates = [r.service_date for r in self.history]
        if len(set(dates)) != len(dates):
            raise ValueError('History must have one observation per distinct service date')
        if any(d >= self.service_date for d in dates):
            raise ValueError('Every history date must precede the forecast service date')
        recent = sorted(self.history, key=lambda r: r.service_date)[-20:]
        if sum(r.ksw_kg is not None for r in recent) < 10:
            raise ValueError('At least 10 of the last 20 service days need measured KSW')
        return self
