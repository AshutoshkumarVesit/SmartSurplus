"""
SmartSurplus Backend - FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth_routes, provider_routes, ngo_routes, admin_routes, map_routes

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-driven food surplus prediction and redistribution platform",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(provider_routes.router)
app.include_router(ngo_routes.router)
app.include_router(admin_routes.router)
app.include_router(map_routes.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from app.core.database import db
    return {
        "status": "healthy",
        "users": len(db.users),
        "food_entries": len(db.food_data),
        "predictions": len(db.predictions),
        "matches": len(db.matches),
    }
