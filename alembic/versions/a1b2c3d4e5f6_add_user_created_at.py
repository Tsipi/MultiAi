"""add user created_at

Revision ID: a1b2c3d4e5f6
Revises: f8a7b6c5d4e3
Create Date: 2026-06-18
"""

from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "f8a7b6c5d4e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_column("users", "created_at")
