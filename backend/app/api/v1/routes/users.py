from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserStatus
from app.models.role import Role
from app.core.security import (
    get_password_hash,
    get_current_active_user,
    require_admin,
    require_supervisor_or_admin,
    require_permission
)
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_name: str = "customer"
    phone: Optional[str] = None
    department: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    role_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role_id: int

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    permissions: List[str] = []
    department: Optional[str] = None
    status: Optional[str] = None
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/users/agents-customers", response_model=List[UserListResponse])
async def get_agents_and_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Role ID 3 olanlar için Agent ve Customer kullanıcıları görüntüleme"""
    # Sadece role_id 3 olanlar erişebilir
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu sayfaya erişim yetkiniz yok"
        )
    
    # Role ID 2 (agent) olan kullanıcıları getir
    query = db.query(User).filter(User.role_id == 2)
    
    users = query.offset(skip).limit(limit).all()
    
    # Response için kullanıcı listesini hazırla
    result = []
    for user in users:
        role = None
        if user.role_id:
            role = db.query(Role).filter(Role.id == user.role_id).first()
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role_id": user.role_id,
            "role_name": role.name if role else None,
            "department": user.department,
            "status": user.status.value if user.status else None,
            "is_active": user.is_active,
            "phone": user.phone,
            "created_at": user.created_at
        }
        result.append(user_data)
    
    return result

@router.get("/users/", response_model=List[UserListResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role_filter: Optional[str] = Query(None, description="Rol bazlı filtreleme"),
    department_filter: Optional[str] = Query(None, description="Departman bazlı filtreleme"),
    status_filter: Optional[str] = Query(None, description="Durum bazlı filtreleme"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin)
):
    """Kullanıcı listesi - Supervisor ve Admin erişimi"""
    query = db.query(User)
    
    # Supervisor sadece kendi departmanını görebilir
    if current_user.is_supervisor and not current_user.is_system_admin:
        if current_user.department:
            query = query.filter(User.department == current_user.department)
    
    # Filtreler
    if role_filter:
        role = db.query(Role).filter(Role.name == role_filter).first()
        if role:
            query = query.filter(User.role_id == role.id)
    
    if department_filter:
        query = query.filter(User.department == department_filter)
    
    if status_filter:
        query = query.filter(User.status == status_filter)

    # ID'ye göre sırala
    users = query.order_by(User.id).offset(skip).limit(limit).all()    # Response için kullanıcı listesini hazırla
    result = []
    for user in users:
        role = None
        if user.role_id:
            role = db.query(Role).filter(Role.id == user.role_id).first()
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role_id": user.role_id,
            "role_name": role.name if role else None,
            "department": user.department,
            "status": user.status.value if user.status else None,
            "is_active": user.is_active,
            "phone": user.phone,
            "created_at": user.created_at
        }
        result.append(user_data)
    
    return result

@router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mevcut kullanıcının kendi bilgileri"""
    # Role bilgisini yükle
    role = None
    if current_user.role_id:
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
    
    # Response object'ini hazırla
    response_data = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role_id": current_user.role_id,
        "role_name": role.name if role else None,
        "permissions": role.permission_list if role else [],
        "department": current_user.department,
        "status": current_user.status.value if current_user.status else None,
        "is_active": current_user.is_active,
        "phone": current_user.phone,
        "created_at": current_user.created_at
    }
    
    return response_data

@router.put("/users/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mevcut kullanıcının kendi bilgilerini güncelleme"""
    # Kullanıcı sadece kendi bazı bilgilerini güncelleyebilir
    allowed_fields = ['username', 'full_name', 'phone']
    
    for field, value in user_update.dict(exclude_unset=True).items():
        if field in allowed_fields and value is not None:
            setattr(current_user, field, value)
    
    # Username benzersizlik kontrolü
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu kullanıcı adı zaten kullanılıyor"
            )
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin)
):
    """Belirli bir kullanıcının bilgileri"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Supervisor sadece kendi departmanındaki kullanıcıları görebilir
    if current_user.is_supervisor and not current_user.is_system_admin:
        if current_user.department != user.department:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu kullanıcıyı görüntüleme yetkiniz yok"
            )
    
    return user

@router.post("/users/", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Yeni kullanıcı oluşturma - Sadece Admin"""
    # Username kontrolü
    existing_user = db.query(User).filter(User.username == user_create.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kullanılıyor"
        )
    
    # Email kontrolü
    existing_email = db.query(User).filter(User.email == user_create.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanılıyor"
        )
    
    # Rol kontrolü
    role = db.query(Role).filter(Role.name == user_create.role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{user_create.role_name}' rolü bulunamadı"
        )
    
    # Yeni kullanıcı oluştur
    hashed_password = get_password_hash(user_create.password)
    
    new_user = User(
        username=user_create.username,
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=hashed_password,
        phone=user_create.phone,
        department=user_create.department,
        role_id=role.id,
        status=UserStatus.ACTIVE,
        is_active=True,
        is_admin=(user_create.role_name == "admin")
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Kullanıcı güncelleme - Sadece Admin"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Kendini silmeyi engelle
    if user_id == current_user.id and user_update.status == UserStatus.INACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi hesabınızı devre dışı bırakamazsınız"
        )
    
    # Rol değişikliği kontrolü
    if user_update.role_name:
        role = db.query(Role).filter(Role.name == user_update.role_name).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{user_update.role_name}' rolü bulunamadı"
            )
        user.role_id = role.id
        user.is_admin = (user_update.role_name == "admin")
    
    # Diğer alanları güncelle
    for field, value in user_update.dict(exclude_unset=True, exclude={'role_name'}).items():
        if value is not None:
            setattr(user, field, value)
    
    # Status değişikliği
    if user_update.status:
        user.status = UserStatus(user_update.status)
        user.is_active = (user_update.status == UserStatus.ACTIVE)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Kullanıcı silme - Sadece Admin"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Kendini silmeyi engelle
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi hesabınızı silemezsiniz"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "Kullanıcı başarıyla silindi"}

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Tüm rolleri getir - Sadece Admin"""
    roles = db.query(Role).all()
    return roles

@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Kullanıcının rolünü güncelle - Sadece Admin"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Rol kontrolü
    role = db.query(Role).filter(Role.id == role_update.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz rol ID"
        )
    
    # Kendinin rolünü değiştirmeyi engelle
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi rolünüzü değiştiremezsiniz"
        )
    
    # Rolü güncelle ve senkronize et
    user.role_id = role_update.role_id
    user.is_admin = (role.name == "admin")
    
    # Eski role enum'unu da senkronize et
    from app.models.user import UserRole
    if role.name == "customer":
        user.role = UserRole.USER
    elif role.name == "agent":
        user.role = UserRole.AGENT
    elif role.name == "supervisor":
        user.role = UserRole.SUPERVISOR
    elif role.name == "admin":
        user.role = UserRole.ADMIN
    
    db.commit()
    db.refresh(user)
    
    # Response için role bilgisini hazırla
    response_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role_id": user.role_id,
        "role_name": role.name,
        "permissions": role.permission_list if role else [],
        "department": user.department,
        "status": user.status.value if user.status else None,
        "is_active": user.is_active,
        "phone": user.phone,
        "created_at": user.created_at
    }
    
    return response_data
