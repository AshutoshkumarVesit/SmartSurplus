"""Independent measured-waste research endpoints."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.measured_waste import WasteForecastRequest
from app.services import measured_waste_service as service

router = APIRouter(prefix='/api/research/waste', tags=['measured-waste-research'])


async def researcher(user=Depends(get_current_user)):
    if user['role'] not in ['provider', 'admin']:
        raise HTTPException(status_code=403, detail='Provider or admin role required')
    return user


def run(action, *args):
    try: return action(*args)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc: raise HTTPException(status_code=503, detail=str(exc))


@router.get('/info')
def info(user=Depends(researcher)):
    return run(service.research_info)


@router.get('/benchmark')
def benchmark(user=Depends(researcher)):
    return run(service.benchmark)


@router.get('/example')
def example(service_date: date | None = None, user=Depends(researcher)):
    return run(service.example, service_date)


@router.post('/forecast')
def forecast(payload: WasteForecastRequest, user=Depends(researcher)):
    return run(service.forecast, payload)
