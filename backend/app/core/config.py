import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"  # Ekstra alanları yoksay
    )
    
    # API Ayarları
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Yardım Masası API"
    
    # Güvenlik
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 gün
    ALGORITHM: str = "HS256"
    
    # Veritabanı
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://username:password@localhost/helpdesk_db"
    )
    DB_ECHO: bool = os.getenv("DB_ECHO", "False").lower() == "true"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]
    
    # Email ayarları (gelecek için)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")

settings = Settings()
