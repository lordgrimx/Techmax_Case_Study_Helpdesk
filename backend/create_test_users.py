"""
Test kullanıcılarını oluşturan script
"""
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.models.role import Role, RoleType
from app.models.user import User, UserStatus
from app.core.security import get_password_hash

def create_test_users():
    """Test kullanıcılarını oluşturur"""
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    # Test kullanıcıları verisi
    test_users = [
        {
            "username": "admin",
            "email": "admin@test.com",
            "password": "admin123",
            "full_name": "Admin User",
            "role_type": RoleType.ADMIN
        },
        {
            "username": "supervisor",
            "email": "supervisor@test.com",
            "password": "super123",
            "full_name": "Supervisor User",
            "role_type": RoleType.SUPERVISOR
        },
        {
            "username": "agent",
            "email": "agent@test.com",
            "password": "agent123",
            "full_name": "Agent User",
            "role_type": RoleType.AGENT
        },
        {
            "username": "customer",
            "email": "customer@test.com",
            "password": "customer123",
            "full_name": "Customer User",
            "role_type": RoleType.CUSTOMER
        }
    ]
    
    try:
        # Rolleri al
        roles = {
            role.name: role for role in session.query(Role).all()
        }
        
        if not roles:
            print("Hata: Hiç rol bulunamadı! Önce init_roles.py çalıştırın.")
            return
        
        print(f"Bulunan roller: {list(roles.keys())}")
        
        created_count = 0
        updated_count = 0
        
        for user_data in test_users:
            # Kullanıcının zaten var olup olmadığını kontrol et
            existing_user = session.query(User).filter(
                (User.email == user_data["email"]) | 
                (User.username == user_data["username"])
            ).first()
            
            if existing_user:
                # Mevcut kullanıcıyı güncelle
                existing_user.full_name = user_data["full_name"]
                existing_user.hashed_password = get_password_hash(user_data["password"])
                existing_user.status = UserStatus.ACTIVE
                existing_user.is_active = True
                
                # Rol ata
                role = roles.get(user_data["role_type"])
                if role:
                    existing_user.role_id = role.id
                    # Admin rolü için ek ayarlar
                    if user_data["role_type"] == RoleType.ADMIN:
                        existing_user.is_admin = True
                
                print(f"✓ Kullanıcı güncellendi: {user_data['email']} ({user_data['role_type']})")
                updated_count += 1
            else:
                # Yeni kullanıcı oluştur
                role = roles.get(user_data["role_type"])
                if not role:
                    print(f"❌ Rol bulunamadı: {user_data['role_type']}")
                    continue
                
                new_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=get_password_hash(user_data["password"]),
                    role_id=role.id,
                    status=UserStatus.ACTIVE,
                    is_active=True,
                    is_admin=(user_data["role_type"] == RoleType.ADMIN)
                )
                
                session.add(new_user)
                print(f"✓ Yeni kullanıcı oluşturuldu: {user_data['email']} ({user_data['role_type']})")
                created_count += 1
        
        session.commit()
        
        print(f"\n📊 Özet:")
        print(f"- Yeni oluşturulan kullanıcılar: {created_count}")
        print(f"- Güncellenen kullanıcılar: {updated_count}")
        print(f"- Toplam işlem: {created_count + updated_count}")
        
        # Oluşturulan kullanıcıları listele
        print(f"\n👥 Test Kullanıcıları:")
        for user_data in test_users:
            user = session.query(User).filter(User.email == user_data["email"]).first()
            if user and user.role_obj:
                print(f"- {user.email} | {user.username} | {user.role_obj.name}")
            else:
                print(f"- {user_data['email']} | Kullanıcı bulunamadı")
                
    except Exception as e:
        session.rollback()
        print(f"❌ Hata oluştu: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

def check_test_users():
    """Test kullanıcılarının durumunu kontrol eder"""
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    try:
        print("🔍 Test kullanıcıları kontrol ediliyor...\n")
        
        test_emails = [
            "admin@test.com",
            "supervisor@test.com", 
            "agent@test.com",
            "customer@test.com"
        ]
        
        for email in test_emails:
            user = session.query(User).filter(User.email == email).first()
            if user:
                role_name = user.role_obj.name if user.role_obj else "Rol yok"
                status_icon = "✅" if user.is_active else "❌"
                print(f"{status_icon} {user.email} | {user.username} | {role_name} | {user.status}")
            else:
                print(f"❌ {email} | Kullanıcı bulunamadı")
                
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("🚀 Test kullanıcıları oluşturuluyor...\n")
    create_test_users()
    print("\n" + "="*50)
    check_test_users()
    print("\n✨ İşlemler tamamlandı!")
