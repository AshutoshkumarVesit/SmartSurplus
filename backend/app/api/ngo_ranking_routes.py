from fastapi import APIRouter,Depends,HTTPException,Query
from app.api.measured_waste_routes import researcher
from app.models.ngo_ranking import RankRequest
from app.services import ngo_ranking_service as service

router=APIRouter(prefix='/api/research/ngo-matching',tags=['ngo-matching-research'])


def run(action,*args):
    try:return action(*args)
    except ValueError as exc:raise HTTPException(status_code=422,detail=str(exc))
    except RuntimeError as exc:raise HTTPException(status_code=503,detail=str(exc))


@router.get('/info')
def info(user=Depends(researcher)):return run(service.info)


@router.get('/example')
def example(index:int=Query(default=0,ge=0,le=100),user=Depends(researcher)):return run(service.example,index)


@router.post('/rank')
def rank(payload:RankRequest,user=Depends(researcher)):return run(service.rank,payload)
