from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class TicketStatus(str, enum.Enum):
    OPEN = "açık"
    IN_PROGRESS = "devam_ediyor"
    WAITING = "beklemede"
    RESOLVED = "çözüldü"
    CLOSED = "kapatıldı"

class TicketPriority(str, enum.Enum):
    LOW = "düşük"
    MEDIUM = "orta"
    HIGH = "yüksek"
    URGENT = "acil"

class TicketCategory(str, enum.Enum):
    HARDWARE = "donanım"
    SOFTWARE = "yazılım"
    NETWORK = "ağ"
    ACCESS = "erişim"
    OTHER = "diğer"

class Ticket(BaseModel):
    __tablename__ = "tickets"
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.MEDIUM)
    category = Column(SQLEnum(TicketCategory), default=TicketCategory.OTHER)
    
    # Kullanıcı ilişkileri
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalated_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Ek bilgiler
    resolution = Column(Text, nullable=True)
    attachment_urls = Column(Text, nullable=True)  # JSON array olarak saklanacak
    
    # İlişkiler
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tickets")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tickets")
    escalated_to = relationship("User", foreign_keys=[escalated_to_id], back_populates="escalated_tickets")
    last_updated_by = relationship("User", foreign_keys=[last_updated_by_id], back_populates="updated_tickets")
    
    def __repr__(self):
        return f"<Ticket(title='{self.title}', status='{self.status}')>"
