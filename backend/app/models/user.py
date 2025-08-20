from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

# Geriye uyumluluk için eski enum'u koruyoruz
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "teknisyen"
    USER = "kullanıcı"

class User(BaseModel):
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Rol sistemi - yeni role tablosuna referans
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    # Eski rol sistemi - geriye uyumluluk için korundu
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    # Kullanıcı durumu
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Ek bilgiler
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    profile_image = Column(Text, nullable=True)  # Base64 veya URL
    
    # İlişkiler
    role_obj = relationship("Role", back_populates="users")
    created_tickets = relationship("Ticket", foreign_keys="Ticket.created_by_id", back_populates="created_by")
    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assigned_to_id", back_populates="assigned_to")
    escalated_tickets = relationship("Ticket", foreign_keys="Ticket.escalated_to_id", back_populates="escalated_to")
    updated_tickets = relationship("Ticket", foreign_keys="Ticket.last_updated_by_id", back_populates="last_updated_by")
    
    def __repr__(self):
        return f"<User(email='{self.email}', full_name='{self.full_name}')>"
    
    @property
    def role_name(self):
        """Kullanıcının rol adını döndürür"""
        if self.role_obj:
            return self.role_obj.name
        return None
    
    @property  
    def permissions(self):
        """Kullanıcının izinlerini döndürür"""
        if self.role_obj:
            return self.role_obj.permission_list
        return []
    
    def has_permission(self, permission: str) -> bool:
        """Kullanıcının belirli bir izni olup olmadığını kontrol eder"""
        if self.role_obj:
            return self.role_obj.has_permission(permission)
        return False
    
    @property
    def is_customer(self) -> bool:
        return self.role_name == "customer"
    
    @property  
    def is_agent(self) -> bool:
        return self.role_name == "agent"
    
    @property
    def is_supervisor(self) -> bool:
        return self.role_name == "supervisor"
    
    @property
    def is_system_admin(self) -> bool:
        return self.role_name == "admin"
