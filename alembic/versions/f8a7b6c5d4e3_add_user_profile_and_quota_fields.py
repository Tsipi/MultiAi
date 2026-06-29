"""add user profile and quota fields

Revision ID: f8a7b6c5d4e3
Revises: 305e347906e1
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f8a7b6c5d4e3"
down_revision: Union[str, Sequence[str], None] = "305e347906e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("display_name", sa.String(128), nullable=True))
    op.add_column(
        "users",
        sa.Column("runs_this_month", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("users", sa.Column("runs_reset_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "runs_reset_at")
    op.drop_column("users", "runs_this_month")
    op.drop_column("users", "display_name")
