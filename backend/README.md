# Yardım Masası Backend API

FastAPI tabanlı yardım masası uygulaması backend'i.

## Kurulum

1. Sanal ortam oluşturun:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows
```

2. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

3. Ortam değişkenlerini ayarlayın:
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

4. Veritabanı migration'larını çalıştırın:
```bash
alembic upgrade head
```

5. Uygulamayı başlatın:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

- **GET /**: Ana sayfa
- **GET /health**: Sağlık kontrolü
- **POST /api/v1/auth/login**: Kullanıcı girişi
- **GET /api/v1/auth/me**: Mevcut kullanıcı bilgileri
- **GET /api/v1/users**: Kullanıcı listesi
- **POST /api/v1/users**: Yeni kullanıcı
- **GET /api/v1/tickets**: Ticket listesi
- **POST /api/v1/tickets**: Yeni ticket

API dokumentasyonu: http://localhost:8000/docs

## Veritabanı Migration

Yeni migration oluşturmak için:
```bash
alembic revision --autogenerate -m "migration açıklaması"
```

Migration'ları uygulamak için:
```bash
alembic upgrade head
```
