from pydantic import BaseModel, field_validator
from typing import Dict, List, Optional
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
    preview_url: Optional[str] = None


class ExperimentCreate(ExperimentBase):
    segments: List[SegmentCreate]


class GenerateNameRequest(BaseModel):
    description: str = ""
    control_instructions: str = ""
    variant_instructions: str = ""


class ExperimentPreviewUrlUpdate(BaseModel):
    preview_url: Optional[str] = None


class SegmentPercentageUpdate(BaseModel):
    id: int
    percentage: float


class SegmentPercentagesUpdate(BaseModel):
    segments: List[SegmentPercentageUpdate]


class ExperimentResponse(ExperimentBase):
    id: int
    project_id: int
    status: str
    computation_logic: Optional[str] = None
    preview_url: Optional[str] = None
    pr_url: Optional[str] = None
    segment_preview_hashes: Optional[Dict[str, str]] = None  # {"segment_id": "hash"}
    segment_preview_urls: Optional[Dict[str, str]] = None  # {"segment_id": "url"}
    winning_segment_id: Optional[int] = None
    segments: List[SegmentResponse]
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("segment_preview_hashes", mode="before")
    @classmethod
    def parse_preview_hashes(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("segment_preview_urls", mode="before")
    @classmethod
    def parse_preview_urls(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v
