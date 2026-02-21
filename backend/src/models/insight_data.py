from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.database import Base

class InsightData(Base):
    __tablename__ = "insight_data"

    id = Column(Integer, primary_key=True)
    experiment_id = Column(Integer, ForeignKey("experiment.id"), nullable=False)
    json_data = Column(JSONB)
    plot_image = Column(String)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
