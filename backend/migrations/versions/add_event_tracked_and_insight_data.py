"""Add event_tracked and insight_data tables

Revision ID: add_event_tracked_insight_data
Revises: add_segment_preview_urls
Create Date: 2026-02-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'add_event_tracked_insight_data'
down_revision: Union[str, None] = 'add_segment_preview_urls'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS event_tracked (
            id SERIAL NOT NULL,
            project_id INTEGER NOT NULL,
            experiment_id INTEGER NOT NULL,
            segment_id INTEGER NOT NULL,
            event_json JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            FOREIGN KEY(project_id) REFERENCES project (id) ON DELETE CASCADE,
            FOREIGN KEY(experiment_id) REFERENCES experiment (id) ON DELETE CASCADE,
            FOREIGN KEY(segment_id) REFERENCES segment (id) ON DELETE CASCADE
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_event_tracked_id ON event_tracked (id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_event_tracked_project_id ON event_tracked (project_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_event_tracked_experiment_id ON event_tracked (experiment_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_event_tracked_segment_id ON event_tracked (segment_id)"))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS insight_data (
            id SERIAL NOT NULL,
            experiment_id INTEGER NOT NULL,
            json_data JSONB,
            plot_image VARCHAR,
            status VARCHAR NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            FOREIGN KEY(experiment_id) REFERENCES experiment (id) ON DELETE CASCADE
        )
    """))


def downgrade() -> None:
    op.drop_table('insight_data')
    op.drop_index('ix_event_tracked_segment_id', table_name='event_tracked')
    op.drop_index('ix_event_tracked_experiment_id', table_name='event_tracked')
    op.drop_index('ix_event_tracked_project_id', table_name='event_tracked')
    op.drop_index('ix_event_tracked_id', table_name='event_tracked')
    op.drop_table('event_tracked')
