from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketCategory
from app.models.ticket_comment import TicketComment
from app.models.user import User
from app.core.security import (
    get_current_active_user,
    require_agent_or_above,
    require_supervisor_or_admin,
    require_admin,
    require_permission
)
from pydantic import BaseModel, Field

router = APIRouter()

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category: TicketCategory = TicketCategory.OTHER

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None
    assigned_to_id: Optional[int] = None
    escalated_to_id: Optional[int] = None
    resolution: Optional[str] = None

class TicketAssign(BaseModel):
    assigned_to_id: int

class UserResponseSimple(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False

class CommentResponse(BaseModel):
    id: int
    content: str
    is_internal: bool
    created_at: datetime
    user: UserResponseSimple
    
    class Config:
        from_attributes = True

class UserResponseSimple(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    
    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    category: str
    resolution: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserResponseSimple] = None
    assigned_to: Optional[UserResponseSimple] = None
    escalated_to: Optional[UserResponseSimple] = None
    last_updated_by: Optional[UserResponseSimple] = None

    class Config:
        from_attributes = True

class TicketListResponse(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    category: str
    created_at: datetime
    created_by_name: str
    assigned_to_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/tickets/", response_model=List[TicketResponse])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TicketStatus] = Query(None),
    priority: Optional[TicketPriority] = Query(None),
    category: Optional[TicketCategory] = Query(None),
    search: Optional[str] = Query(None, description="Başlık veya açıklamada arama"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ticket listesi - Rol bazlı filtreleme"""
    query = db.query(Ticket).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.escalated_to),
        joinedload(Ticket.last_updated_by)
    )
    
    # Rol bazlı erişim kontrolü
    if current_user.is_customer:
        # Customer sadece kendi ticket'larını görebilir
        query = query.filter(Ticket.created_by_id == current_user.id)
    # Agent, Supervisor ve Admin tüm ticket'ları görebilir
    
    # Filtreler
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if category:
        query = query.filter(Ticket.category == category)
    
    # Arama
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Ticket.title.ilike(search_term)) |
            (Ticket.description.ilike(search_term))
        )
    
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    return tickets

@router.get("/tickets/assigned-to-me", response_model=List[TicketResponse])
async def get_assigned_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TicketStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_above)
):
    """Bana atanan ticket'lar - Agent ve üstü"""
    query = db.query(Ticket).filter(
        Ticket.assigned_to_id == current_user.id
    ).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to)
    )
    
    if status:
        query = query.filter(Ticket.status == status)
    
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    return tickets

@router.get("/tickets/my-tickets", response_model=List[TicketResponse])
async def get_my_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TicketStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Benim oluşturduğum ticket'lar"""
    query = db.query(Ticket).filter(
        Ticket.created_by_id == current_user.id
    ).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to)
    )
    
    if status:
        query = query.filter(Ticket.status == status)
    
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    return tickets

@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Belirli bir ticket'ı getir"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.escalated_to),
        joinedload(Ticket.last_updated_by)
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    # Rol bazlı erişim kontrolü
    can_access = False
    
    if current_user.is_supervisor or current_user.is_system_admin:
        # Supervisor ve Admin tüm ticket'lara erişebilir
        can_access = True
    elif current_user.is_agent:
        # Agent kendi oluşturduğu veya atanan ticket'lara erişebilir
        can_access = (ticket.created_by_id == current_user.id or 
                     ticket.assigned_to_id == current_user.id)
    elif current_user.is_customer:
        # Customer sadece kendi oluşturduğu ticket'lara erişebilir
        can_access = (ticket.created_by_id == current_user.id)
    
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ticket'a erişim yetkiniz yok"
        )
    
    return ticket

@router.post("/tickets/", response_model=TicketResponse)
async def create_ticket(
    ticket_create: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Yeni ticket oluştur"""
    new_ticket = Ticket(
        title=ticket_create.title,
        description=ticket_create.description,
        priority=ticket_create.priority,
        category=ticket_create.category,
        created_by_id=current_user.id,
        status=TicketStatus.OPEN,
        last_updated_by_id=current_user.id
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return new_ticket

@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ticket güncelle"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    # Rol bazlı güncelleme kontrolü
    can_update = False
    
    if current_user.is_system_admin:
        # Admin her şeyi güncelleyebilir
        can_update = True
    elif current_user.is_supervisor:
        # Supervisor tüm ticket'ları güncelleyebilir
        can_update = True
    elif current_user.is_agent:
        # Agent kendi oluşturduğu veya atanan ticket'ları güncelleyebilir
        can_update = (ticket.created_by_id == current_user.id or 
                     ticket.assigned_to_id == current_user.id)
    elif current_user.is_customer:
        # Customer sadece kendi ticket'ının bazı alanlarını güncelleyebilir
        can_update = (ticket.created_by_id == current_user.id)
        # Customer sadece title, description güncelleyebilir
        allowed_fields = ['title', 'description']
        for field in ticket_update.dict(exclude_unset=True).keys():
            if field not in allowed_fields:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"'{field}' alanını güncelleme yetkiniz yok"
                )
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ticket'ı güncelleme yetkiniz yok"
        )
    
    # Güncelleme işlemi
    for field, value in ticket_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(ticket, field, value)
    
    ticket.last_updated_by_id = current_user.id
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.put("/tickets/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: int,
    assign_data: TicketAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin)
):
    """Ticket atama - Supervisor ve Admin"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    # Atanacak kullanıcıyı kontrol et
    assigned_user = db.query(User).filter(User.id == assign_data.assigned_to_id).first()
    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atanacak kullanıcı bulunamadı"
        )
    
    ticket.assigned_to_id = assign_data.assigned_to_id
    ticket.last_updated_by_id = current_user.id
    
    # Eğer ticket OPEN ise IN_PROGRESS yap
    if ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(ticket)
    
    return ticket

@router.delete("/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Ticket silme - Sadece Admin"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    db.delete(ticket)
    db.commit()
    
    return {"message": "Ticket başarıyla silindi"}

# Ticket Comments Endpoints

@router.get("/tickets/{ticket_id}/comments", response_model=List[CommentResponse])
async def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ticket yorumlarını getir"""
    # Ticket'ın var olup olmadığını ve erişim kontrolünü yap
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    # Erişim kontrolü
    can_access = False
    if current_user.is_supervisor or current_user.is_system_admin:
        can_access = True
    elif current_user.is_agent:
        can_access = True  # Agent tüm ticket'ları görebilir
    elif current_user.is_customer:
        can_access = (ticket.created_by_id == current_user.id)
    
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ticket'ın yorumlarına erişim yetkiniz yok"
        )
    
    # Yorumları getir
    query = db.query(TicketComment).filter(TicketComment.ticket_id == ticket_id).options(
        joinedload(TicketComment.user)
    )
    
    # Customer'lar internal notları göremez
    if current_user.is_customer:
        query = query.filter(TicketComment.is_internal == False)
    
    comments = query.order_by(TicketComment.created_at.asc()).all()
    return comments

@router.post("/tickets/{ticket_id}/comments", response_model=CommentResponse)
async def create_ticket_comment(
    ticket_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ticket'a yorum ekle"""
    # Ticket'ın var olup olmadığını kontrol et
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket bulunamadı"
        )
    
    # Erişim kontrolü
    can_comment = False
    if current_user.is_supervisor or current_user.is_system_admin:
        can_comment = True
    elif current_user.is_agent:
        can_comment = True
    elif current_user.is_customer:
        can_comment = (ticket.created_by_id == current_user.id)
    
    if not can_comment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ticket'a yorum ekleme yetkiniz yok"
        )
    
    # Customer'lar internal note ekleyemez
    if current_user.is_customer and comment_data.is_internal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal not ekleme yetkiniz yok"
        )
    
    # Yorum oluştur
    new_comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_data.content,
        is_internal=comment_data.is_internal
    )
    
    db.add(new_comment)
    
    # Ticket'ın son güncelleme bilgisini güncelle
    ticket.last_updated_by_id = current_user.id
    
    db.commit()
    db.refresh(new_comment)
    
    # Comment'ı user bilgisiyle birlikte yükle
    comment_with_user = db.query(TicketComment).filter(
        TicketComment.id == new_comment.id
    ).options(joinedload(TicketComment.user)).first()
    
    return comment_with_user
