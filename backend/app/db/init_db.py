from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.user import User
from app.models.ticket import Ticket
from app.core.security import get_password_hash

def init_db() -> None:
    """
    Veritabanı tablolarını oluştur ve başlangıç verilerini ekle
    """
    # Tüm tabloları oluştur
    Base.metadata.create_all(bind=engine)

def create_init_data() -> None:
    """
    Başlangıç verilerini oluştur (admin kullanıcı vb.)
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    
    # Admin kullanıcı kontrolü
    admin_user = db.query(User).filter(User.email == "admin@techmax.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@techmax.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print("Admin kullanıcı oluşturuldu: admin@techmax.com")
    
    db.close()
