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
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Traffic allocation
    user_percentage = Column(Float, nullable=False)  # % of users entering the experiment
    number_of_segments = Column(Integer, nullable=False)

    # Metrics tracked (comma separated or JSON string depending on your design)
    metrics = Column(String, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", backref="experiments")
    segments = relationship("Segment", backref="experiment", cascade="all, delete-orphan")