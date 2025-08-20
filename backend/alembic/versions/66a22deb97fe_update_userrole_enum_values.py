"""update_userrole_enum_values

Revision ID: 66a22deb97fe
Revises: 819e4e804bb9
Create Date: 2025-08-21 02:39:01.450430

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '66a22deb97fe'
down_revision = '819e4e804bb9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # TECHNICIAN'ı AGENT olarak değiştir
    op.execute("ALTER TYPE userrole RENAME VALUE 'TECHNICIAN' TO 'AGENT'")
    
    # SUPERVISOR değerini ekle
    op.execute("ALTER TYPE userrole ADD VALUE 'SUPERVISOR'")
    
    # kullanıcı değerini ekle
    op.execute("ALTER TYPE userrole ADD VALUE 'kullanıcı'")


def downgrade() -> None:
    # Geri alma işlemleri
    op.execute("ALTER TYPE userrole RENAME VALUE 'AGENT' TO 'TECHNICIAN'")
