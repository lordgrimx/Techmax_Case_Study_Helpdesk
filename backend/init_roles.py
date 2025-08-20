"""
Varsayılan rolleri ve izinleri veritabanına ekleyen script
"""
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.models.role import Role, RoleType, DEFAULT_PERMISSIONS
from app.models.user import User, UserStatus

def create_default_roles():
    """Varsayılan rolleri oluşturur"""
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        # Mevcut rolleri kontrol et
        existing_roles = session.query(Role).all()
        if existing_roles:
            print("Roller zaten mevcut.")
            return
        
        # Varsayılan rolleri oluştur
        roles_to_create = [
            {
                "name": RoleType.CUSTOMER,
                "description": "Sisteme ticket açan, takip eden son kullanıcılar",
                "permissions": DEFAULT_PERMISSIONS[RoleType.CUSTOMER]
            },
            {
                "name": RoleType.AGENT,
                "description": "Müşteri sorunlarını çözen, ticket'lara yanıt veren personel",
                "permissions": DEFAULT_PERMISSIONS[RoleType.AGENT]
            },
            {
                "name": RoleType.SUPERVISOR,
                "description": "Destek ekibini yöneten, performans takibi yapan orta yönetim",
                "permissions": DEFAULT_PERMISSIONS[RoleType.SUPERVISOR]
            },
            {
                "name": RoleType.ADMIN,
                "description": "Sistemin teknik yönetimini yapan, kullanıcı yönetimi sorumlusu",
                "permissions": DEFAULT_PERMISSIONS[RoleType.ADMIN]
            }
        ]
        
        for role_data in roles_to_create:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                permissions=role_data["permissions"]
            )
            session.add(role)
        
        session.commit()
        print("Varsayılan roller başarıyla oluşturuldu!")
        
        # Rolleri listele
        roles = session.query(Role).all()
        for role in roles:
            print(f"- {role.name}: {len(role.permissions or [])} izin")
            
    except Exception as e:
        session.rollback()
        print(f"Hata oluştu: {e}")
    finally:
        session.close()

def assign_default_roles_to_users():
    """Mevcut kullanıcılara varsayılan roller atar"""
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        # Customer rolünü al
        customer_role = session.query(Role).filter(Role.name == RoleType.CUSTOMER).first()
        if not customer_role:
            print("Customer rolü bulunamadı!")
            return
        
        # Rol atanmamış kullanıcıları bul
        users_without_role = session.query(User).filter(User.role_id.is_(None)).all()
        
        for user in users_without_role:
            user.role_id = customer_role.id
            user.status = UserStatus.ACTIVE
            print(f"Kullanıcı {user.email} Customer rolü atandı")
        
        session.commit()
        print(f"{len(users_without_role)} kullanıcıya varsayılan rol atandı!")
        
    except Exception as e:
        session.rollback()
        print(f"Hata oluştu: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("Varsayılan roller oluşturuluyor...")
    create_default_roles()
    print("\nMevcut kullanıcılara roller atanıyor...")
    assign_default_roles_to_users()
    print("İşlemler tamamlandı!")
