from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.database import Base


class Experiment(Base):
    __tablename__ = "experiment"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to project
    project_id = Column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    # Experiment info
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")  # active, paused, completed

    # Traffic allocation
    percentage = Column(Float, nullable=False)  # % of users entering the experiment

    # Metrics tracked
    metrics = Column(String, nullable=True)

    # Winning segment id, can be null of course (at the beginning)
    winning_segment_id = Column(Integer, ForeignKey("segment.id", ondelete="SET NULL"), nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", backref="experiments")
    segments = relationship("Segment", backref="experiment", cascade="all, delete-orphan", foreign_keys="[Segment.experiment_id]")
    winning_segment = relationship("Segment", foreign_keys=[winning_segment_id], post_update=True)