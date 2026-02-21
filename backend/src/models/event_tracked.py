from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.database import Base


class EventTracked(Base):
    __tablename__ = "event_tracked"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    project_id = Column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_id = Column(Integer, ForeignKey("experiment.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(Integer, ForeignKey("segment.id", ondelete="CASCADE"), nullable=False, index=True)

    # Event payload
    event_json = Column(JSONB, nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Optional relationships (very useful later)
    project = relationship("Project", backref="events")
    experiment = relationship("Experiment", backref="events")
    segment = relationship("Segment", backref="events")
