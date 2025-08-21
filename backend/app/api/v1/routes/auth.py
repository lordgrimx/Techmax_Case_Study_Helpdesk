from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.config import settings
from app.core.security import (
    verify_password, 
    create_access_token_for_user, 
    get_current_user,
    get_current_active_user,
    require_admin,
    get_password_hash,
    verify_token
)
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.role import Role, RoleType
from app.models.ticket import Ticket, TicketStatus
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = None
    role_name: Optional[str] = None
    permissions: list = []
    department: Optional[str] = None
    is_active: bool
    status: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: Optional[str] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    phone: Optional[str] = None
    department: Optional[str] = None
    role_name: Optional[str] = "customer"  # Varsayılan rol

class UserStats(BaseModel):
    active_tickets: int
    resolved_tickets: int
    total_tickets: int
    avg_resolution_days: float
    satisfaction_rate: float

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Mevcut kullanıcıyı token'dan al"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulama bilgileri geçersiz",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı"""
    # Username kontrolü
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kullanılıyor"
        )
    
    # Email kontrolü
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanılıyor"
        )
    
    # İlk kullanıcı kontrolü - eğer hiç kullanıcı yoksa ADMIN rol ata
    user_count = db.query(User).count()
    is_first_user = user_count == 0
    
    if is_first_user:
        # İlk kullanıcı - ADMIN rolü al
        assigned_role = db.query(Role).filter(Role.name == RoleType.ADMIN).first()
        if not assigned_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Admin rolü bulunamadı. Lütfen sistem yöneticisine başvurun."
            )
        role_enum = UserRole.ADMIN
        is_admin = True
    else:
        # Sonraki kullanıcılar - CUSTOMER rolü al
        assigned_role = db.query(Role).filter(Role.name == RoleType.CUSTOMER).first()
        if not assigned_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Customer rolü bulunamadı. Lütfen sistem yöneticisine başvurun."
            )
        role_enum = UserRole.USER
        is_admin = False
    
    # Yeni kullanıcı oluştur
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        phone=user_data.phone,
        department=user_data.department,
        role_id=assigned_role.id,  # Yeni rol sistemi için role_id set et
        role=role_enum,  # Geriye uyumluluk için eski rol alanı
        status=UserStatus.ACTIVE,  # Varsayılan durum
        is_active=True,
        is_admin=is_admin
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Kullanıcı girişi - username veya email ile"""
    # Username veya email ile kullanıcı ara
    user = db.query(User).filter(
        (User.username == form_data.username) | 
        (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı/email veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hesap aktif değil"
        )
    
    # Rol bazlı token oluştur
    access_token = create_access_token_for_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else None,
            "role_name": user.role_name,
            "permissions": user.permissions,
            "department": user.department,
            "is_admin": user.is_system_admin,
            "status": user.status.value if user.status else None
        }
    }

@router.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Mevcut kullanıcı bilgilerini getir"""
    return current_user

@router.get("/auth/me/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının ticket istatistiklerini getir"""
    
    # Aktif ticket sayısı
    active_tickets = db.query(Ticket).filter(
        and_(
            Ticket.created_by_id == current_user.id,
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING])
        )
    ).count()
    
    # Çözülen ticket sayısı
    resolved_tickets = db.query(Ticket).filter(
        and_(
            Ticket.created_by_id == current_user.id,
            Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED])
        )
    ).count()
    
    # Toplam ticket sayısı
    total_tickets = db.query(Ticket).filter(
        Ticket.created_by_id == current_user.id
    ).count()
    
    # Ortalama çözüm süresi (çözülen ticketlar için)
    resolved_ticket_durations = db.query(
        func.avg(
            func.extract('epoch', Ticket.updated_at - Ticket.created_at) / 86400
        )
    ).filter(
        and_(
            Ticket.created_by_id == current_user.id,
            Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
            Ticket.updated_at.isnot(None)
        )
    ).scalar()
    
    avg_resolution_days = float(resolved_ticket_durations or 0)
    
    # Memnuniyet oranı (basit hesaplama - çözülen / toplam)
    satisfaction_rate = (resolved_tickets / total_tickets * 100) if total_tickets > 0 else 100.0
    
    return UserStats(
        active_tickets=active_tickets,
        resolved_tickets=resolved_tickets,
        total_tickets=total_tickets,
        avg_resolution_days=round(avg_resolution_days, 1),
        satisfaction_rate=round(satisfaction_rate, 1)
    )

@router.post("/auth/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcı şifresi değiştirme"""
    
    # Yeni şifre ve onay kontrolü
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni şifre ve onay şifresi eşleşmiyor"
        )
    
    # Mevcut şifre kontrolü
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre hatalı"
        )
    
    # Yeni şifre uzunluk kontrolü
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni şifre en az 6 karakter olmalıdır"
        )
    
    # Şifreyi güncelle
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Şifre başarıyla değiştirildi"}

@router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Kullanıcı çıkışı - Frontend'de token'ı silmesi yeterli"""
    return {"message": "Başarıyla çıkış yapıldı"}
