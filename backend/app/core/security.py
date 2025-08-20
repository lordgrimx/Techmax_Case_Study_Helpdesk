from datetime import datetime, timedelta
from typing import Optional, List, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Düz metin şifreyi hash'lenmiş şifre ile doğrula"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Şifreyi hash'le"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT access token oluştur"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> dict:
    """JWT token'ı doğrula ve payload'ı döndür"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token geçersiz",
            headers={"WWW-Authenticate": "Bearer"},
        )

def create_access_token_for_user(user: User) -> str:
    """Kullanıcı için JWT token oluştur (rol ve izin bilgileri ile)"""
    access_token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role_name,
        "permissions": user.permissions,
        "department": user.department,
        "is_active": user.is_active
    }
    return create_access_token(access_token_data)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """JWT token'dan mevcut kullanıcıyı al"""
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token'da kullanıcı ID'si bulunamadı"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token doğrulanamadı"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı aktif değil"
        )
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Aktif kullanıcıyı al"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı aktif değil"
        )
    return current_user

# Rol bazlı yetkilendirme decoratorları
def require_roles(allowed_roles: List[str]):
    """Belirli rollere sahip kullanıcıları gerektirir"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için {', '.join(allowed_roles)} rollerinden birine sahip olmalısınız"
            )
        return current_user
    return role_checker

def require_permissions(required_permissions: List[str]):
    """Belirli izinlere sahip kullanıcıları gerektirir"""
    def permission_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_permissions = current_user.permissions
        for permission in required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Bu işlem için '{permission}' iznine sahip olmalısınız"
                )
        return current_user
    return permission_checker

def require_permission(permission: str):
    """Tek bir izin gerektirir"""
    return require_permissions([permission])

# Özel rol kontrolleri
def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Admin rolü gerektirir"""
    if not current_user.is_system_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir"
        )
    return current_user

def require_supervisor_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Supervisor veya Admin rolü gerektirir"""
    if not (current_user.is_supervisor or current_user.is_system_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için supervisor veya admin yetkisi gereklidir"
        )
    return current_user

def require_agent_or_above(current_user: User = Depends(get_current_active_user)) -> User:
    """Agent, Supervisor veya Admin rolü gerektirir"""
    if current_user.is_customer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için staff yetkisi gereklidir"
        )
    return current_user
