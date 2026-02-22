"""Add segment_preview_hashes to experiment

Revision ID: add_preview_hashes
Revises: add_pr_url
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_preview_hashes'
down_revision: Union[str, None] = 'add_pr_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'experiment',
        sa.Column('segment_preview_hashes', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('experiment', 'segment_preview_hashes')
