"""
SmartSurplus Backend - Core Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import BaseModel


class Settings(BaseSettings):
    APP_NAME: str = "SmartSurplus API"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "smartsurplus-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    GOOGLE_MAPS_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
