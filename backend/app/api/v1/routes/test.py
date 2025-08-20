from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketCategory
from app.core.security import get_password_hash
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class TestResponse(BaseModel):
    message: str
    data: Dict[str, Any]

@router.post("/test/create-sample-data", response_model=TestResponse)
async def create_sample_data(db: Session = Depends(get_db)):
    """Test için örnek veriler oluştur"""
    try:
        # Örnek kullanıcılar oluştur
        admin_user = User(
            username="admin",
            email="admin@techmax.com",
            full_name="Sistem Yöneticisi",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_admin=True,
            is_active=True,
            department="IT"
        )
        
        tech_user = User(
            username="teknisyen1",
            email="teknisyen1@techmax.com",
            full_name="Ahmet Yılmaz",
            hashed_password=get_password_hash("tech123"),
            role=UserRole.TECHNICIAN,
            is_admin=False,
            is_active=True,
            department="IT"
        )
        
        normal_user = User(
            username="kullanici1",
            email="kullanici1@techmax.com",
            full_name="Ayşe Kaya",
            hashed_password=get_password_hash("user123"),
            role=UserRole.USER,
            is_admin=False,
            is_active=True,
            department="Satış"
        )
        
        db.add_all([admin_user, tech_user, normal_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(tech_user)
        db.refresh(normal_user)
        
        # Örnek ticketlar oluştur
        ticket1 = Ticket(
            title="Bilgisayar açılmıyor",
            description="Ofisteki 12 numaralı bilgisayar açılmıyor. Güç tuşuna bastığımda hiçbir tepki vermiyor.",
            status=TicketStatus.OPEN,
            priority=TicketPriority.HIGH,
            category=TicketCategory.HARDWARE,
            created_by_id=normal_user.id
        )
        
        ticket2 = Ticket(
            title="Email alamıyorum",
            description="Bugün sabahtan beri email alamıyorum. Gönderdiğim emailler çıkıyor ama gelen kutusu boş.",
            status=TicketStatus.IN_PROGRESS,
            priority=TicketPriority.MEDIUM,
            category=TicketCategory.SOFTWARE,
            created_by_id=normal_user.id,
            assigned_to_id=tech_user.id
        )
        
        ticket3 = Ticket(
            title="Ağ bağlantısı yok",
            description="İnternet bağlantım yok. WiFi'ye bağlı görünüyor ama web sitelerine giremiyorum.",
            status=TicketStatus.RESOLVED,
            priority=TicketPriority.URGENT,
            category=TicketCategory.NETWORK,
            created_by_id=normal_user.id,
            assigned_to_id=tech_user.id,
            resolution="Router yeniden başlatıldı ve DNS ayarları güncellendi."
        )
        
        db.add_all([ticket1, ticket2, ticket3])
        db.commit()
        
        return TestResponse(
            message="Örnek veriler başarıyla oluşturuldu",
            data={
                "users_created": 3,
                "tickets_created": 3,
                "login_credentials": {
                    "admin": {"username": "admin", "password": "admin123"},
                    "technician": {"username": "teknisyen1", "password": "tech123"},
                    "user": {"username": "kullanici1", "password": "user123"}
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Örnek veriler oluşturulurken hata: {str(e)}")

@router.get("/test/db-connection")
async def test_db_connection(db: Session = Depends(get_db)):
    """Veritabanı bağlantısını test et"""
    try:
        # Basit bir sorgu yaparak bağlantıyı test et
        user_count = db.query(User).count()
        ticket_count = db.query(Ticket).count()
        
        return {
            "message": "Veritabanı bağlantısı başarılı",
            "data": {
                "user_count": user_count,
                "ticket_count": ticket_count,
                "status": "connected"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Veritabanı bağlantı hatası: {str(e)}")

@router.get("/test/system-info")
async def get_system_info():
    """Sistem bilgilerini getir"""
    import sys
    import os
    from app.core.config import settings
    
    return {
        "message": "Sistem bilgileri",
        "data": {
            "python_version": sys.version,
            "api_version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "database_configured": bool(settings.DATABASE_URL),
            "secret_key_configured": bool(settings.SECRET_KEY),
            "available_endpoints": [
                "POST /api/v1/auth/login",
                "GET /api/v1/auth/me",
                "POST /api/v1/users/create",
                "GET /api/v1/users",
                "POST /api/v1/users",
                "GET /api/v1/tickets",
                "POST /api/v1/tickets",
                "GET /api/v1/tickets/{id}",
                "PUT /api/v1/tickets/{id}"
            ]
        }
    }
