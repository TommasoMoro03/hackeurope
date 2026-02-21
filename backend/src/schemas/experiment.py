from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SegmentBase(BaseModel):
    name: str
    instructions: str
    percentage: float


class SegmentCreate(SegmentBase):
    pass


class SegmentResponse(SegmentBase):
    id: int
    experiment_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExperimentBase(BaseModel):
    name: str
    description: str
    percentage: float
    metrics: str


class ExperimentCreate(ExperimentBase):
    segments: List[SegmentCreate]


class ExperimentResponse(ExperimentBase):
    id: int
    project_id: int
    status: str
    computation_logic: Optional[str] = None
    segments: List[SegmentResponse]
    created_at: datetime

    class Config:
        from_attributes = True
