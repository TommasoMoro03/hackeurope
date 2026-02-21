"""Add preview_url to experiment

Revision ID: add_preview_url
Revises: 9504fd7ce5ab
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_preview_url'
down_revision: Union[str, None] = '9504fd7ce5ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('experiment', sa.Column('preview_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('experiment', 'preview_url')
