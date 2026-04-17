"""Pydantic models for raw operator records and normalized observations."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

QualityFlag = Literal[
    "VALID",
    "BARO_UNCORRECTED",
    "STALE",
    "DATUM_UNVERIFIED",
    "SPIKE_DETECTED",
    "GAP_INTERPOLATED",
]

DatumMethod = Literal["GEODETIC", "CASING_TOP", "UNVERIFIED"]

Operator = Literal["SWALIM", "WorldVision", "INGO_3"]


class RawRecord(BaseModel):
    """A record as received from an operator. Field names vary by operator —
    this model allows arbitrary extra fields to mirror real ingestion."""
    model_config = {"extra": "allow"}

    operator: Operator
    site_id: str


class NormalizedRecord(BaseModel):
    site_id: str
    site_name: str
    operator: Operator
    lat: float
    lng: float
    timestamp_utc: datetime
    water_level_mbgl: float = Field(..., description="Metres below ground level")
    water_level_raw: float
    raw_field_name: str
    barometric_pressure_hpa: float | None = None
    quality_flag: QualityFlag
    datum_reference_method: DatumMethod
    data_age_hours: float


class TimeSeriesPoint(BaseModel):
    timestamp_utc: datetime
    water_level_mbgl: float
    quality_flag: QualityFlag


class OperatorSummary(BaseModel):
    operator: Operator
    site_count: int
    avg_data_age_hours: float
    dominant_quality_flag: QualityFlag
    recent_readings: list[float]
