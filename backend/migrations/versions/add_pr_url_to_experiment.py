"""Add pr_url to experiment

Revision ID: add_pr_url
Revises: add_preview_url
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_pr_url'
down_revision: Union[str, None] = 'add_preview_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('experiment', sa.Column('pr_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('experiment', 'pr_url')
