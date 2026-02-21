from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.database import Base


class Segment(Base):
    __tablename__ = "segment"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to experiment
    experiment_id = Column(Integer, ForeignKey("experiment.id", ondelete="CASCADE"), nullable=False, index=True)

    # Segment info
    code = Column(String, nullable=False)  # e.g. "control", "variant_1"
    percentage = Column(Float, nullable=False)  # allocation percentage
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    experiment = relationship("Experiment", backref="segments")