"""Add segment_preview_urls to experiment

Revision ID: add_segment_preview_urls
Revises: add_preview_hashes
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_segment_preview_urls'
down_revision: Union[str, None] = 'add_preview_hashes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'experiment',
        sa.Column('segment_preview_urls', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('experiment', 'segment_preview_urls')
