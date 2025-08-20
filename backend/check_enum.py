import psycopg2
from app.core.config import settings

# DATABASE_URL'yi kullan
conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()

print('Mevcut userrole enum değerleri:')
cur.execute("SELECT unnest(enum_range(NULL::userrole))")
for row in cur.fetchall():
    print(f'  {row[0]}')

cur.close()
conn.close()
