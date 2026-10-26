from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import require_role
from app.models.platform_matching import NGOAvailability, RegisteredMatchRequest
from app.services import platform_matching_service as service

router = APIRouter(prefix='/api', tags=['registered-ngo-matching'])

def run(action, *args):
    try: return action(*args)
    except ValueError as error: raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error: raise HTTPException(status_code=503, detail=str(error))

@router.get('/provider/ngo-matching')
def directory(user=Depends(require_role('provider'))):
    return run(service.registry, user)

@router.post('/provider/ngo-matching/rank')
def rank(payload: RegisteredMatchRequest, user=Depends(require_role('provider'))):
    return run(service.rank_registered, user, payload)

@router.get('/ngo/availability')
def availability(user=Depends(require_role('ngo'))):
    from datetime import datetime, timezone
    return service.public_ngo(user, datetime.now(timezone.utc))

@router.put('/ngo/availability')
def update_availability(payload: NGOAvailability, user=Depends(require_role('ngo'))):
    return run(service.save_availability, user, payload)
