from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from src.database import Base


class EventTracked(Base):
    __tablename__ = "event_tracked"

    id = Column(Integer, primary_key=True, index=True)

    # Plain integer columns — FK constraints exist at DB level,
    # but the webhook-listener doesn't load the related ORM models.
    project_id = Column(Integer, nullable=False, index=True)
    experiment_id = Column(Integer, nullable=False, index=True)
    segment_id = Column(Integer, nullable=False, index=True)

    # Event payload
    event_json = Column(JSONB, nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
