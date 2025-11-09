"""add vendor metadata columns"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a6e5bbb0f1c1"
down_revision = "d38998db5fbb"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "expenses",
        sa.Column("vendor_fiscal_code", sa.String(length=128), nullable=True)
    )
    op.add_column(
        "expenses",
        sa.Column("vendor_registration_number", sa.String(length=128), nullable=True)
    )
    op.add_column(
        "expenses",
        sa.Column("vendor_address", sa.Text(), nullable=True)
    )


def downgrade():
    op.drop_column("expenses", "vendor_address")
    op.drop_column("expenses", "vendor_registration_number")
    op.drop_column("expenses", "vendor_fiscal_code")
