from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class RoleType(str, enum.Enum):
    CUSTOMER = "customer"
    AGENT = "agent"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"

class Role(BaseModel):
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    permissions = Column(JSON, nullable=True)  # JSON formatında izinler
    
    # İlişkiler
    users = relationship("User", back_populates="role_obj")
    
    def __repr__(self):
        return f"<Role(name='{self.name}')>"
    
    @property
    def permission_list(self):
        """İzinleri liste olarak döndürür"""
        return self.permissions or []
    
    def has_permission(self, permission: str) -> bool:
        """Belirli bir izni kontrol eder"""
        return permission in self.permission_list

# Varsayılan rol izinleri
DEFAULT_PERMISSIONS = {
    RoleType.CUSTOMER: [
        "tickets.create_own",
        "tickets.view_own", 
        "tickets.update_own",
        "tickets.comment_own",
        "profile.view_own",
        "profile.update_own"
    ],
    RoleType.AGENT: [
        "tickets.create_own",
        "tickets.view_own",
        "tickets.view_assigned", 
        "tickets.update_assigned",
        "tickets.update_status",
        "tickets.comment_any",
        "dashboard.view_agent",
        "profile.view_own",
        "profile.update_own"
    ],
    RoleType.SUPERVISOR: [
        "tickets.create_any",
        "tickets.view_all",
        "tickets.assign",
        "tickets.update_any",
        "tickets.escalate",
        "users.view_team",
        "reports.view_team",
        "reports.view_performance",
        "dashboard.view_supervisor",
        "profile.view_own",
        "profile.update_own"
    ],
    RoleType.ADMIN: [
        "tickets.create_any",
        "tickets.view_all",
        "tickets.update_any",
        "tickets.delete_any",
        "tickets.assign",
        "users.create",
        "users.view_all",
        "users.update_any",
        "users.delete_any",
        "roles.manage",
        "system.configure",
        "reports.view_all",
        "dashboard.view_admin",
        "profile.view_any",
        "profile.update_any"
    ]
}
