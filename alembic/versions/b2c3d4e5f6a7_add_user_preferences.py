"""add user preferences

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-30
"""

from alembic import op
import sqlalchemy as sa

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("pref_answer_mode", sa.String(32), nullable=True))
    op.add_column("users", sa.Column("pref_web_research_mode", sa.String(32), nullable=True))
    op.add_column("users", sa.Column("pref_team_template", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "pref_team_template")
    op.drop_column("users", "pref_web_research_mode")
    op.drop_column("users", "pref_answer_mode")
