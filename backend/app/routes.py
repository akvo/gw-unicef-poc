"""API endpoints. Dataset is generated once at module import for determinism."""
from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.schema import NormalizedRecord, OperatorSummary
from app.synthetic import generate_dataset

router = APIRouter(prefix="/api")

_DATASET = generate_dataset(reference_time=datetime.now(timezone.utc))


@router.get("/sites", response_model=list[NormalizedRecord])
def list_sites():
    return _DATASET["normalized"]


@router.get("/sites/{site_id}/timeseries")
def site_timeseries(site_id: str):
    ts = _DATASET["timeseries"].get(site_id)
    if ts is None:
        raise HTTPException(404, f"Unknown site: {site_id}")
    return ts


@router.get("/raw/{operator}")
def raw_by_operator(operator: str):
    if operator not in _DATASET["raw_by_operator"]:
        raise HTTPException(404, f"Unknown operator: {operator}")
    return _DATASET["raw_by_operator"][operator]


@router.get("/normalized", response_model=list[NormalizedRecord])
def all_normalized():
    return _DATASET["normalized"]


@router.get("/operators", response_model=list[OperatorSummary])
def operator_summaries():
    out: list[OperatorSummary] = []
    by_op: dict[str, list] = {}
    for rec in _DATASET["normalized"]:
        by_op.setdefault(rec.operator, []).append(rec)

    for op, recs in by_op.items():
        site_ids = [r.site_id for r in recs]
        flags = [r.quality_flag for r in recs]
        dominant = Counter(flags).most_common(1)[0][0]
        avg_age = sum(r.data_age_hours for r in recs) / len(recs)
        recent = []
        for sid in site_ids:
            for pt in _DATASET["timeseries"][sid][:5]:
                recent.append(pt["water_level_mbgl"])
        recent = recent[:12]

        out.append(OperatorSummary(
            operator=op,
            site_count=len(recs),
            avg_data_age_hours=round(avg_age, 1),
            dominant_quality_flag=dominant,
            recent_readings=recent,
        ))
    return out
