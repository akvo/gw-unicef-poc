"""Generate synthetic raw operator records and their normalized counterparts.

Values are deterministic given a seed so the demo is reproducible.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone

from app.normalizer import normalize
from app.schema import NormalizedRecord, RawRecord
from app.sites import SITES


def _seasonal_level(site_id: str, t: datetime) -> float:
    """Plausible Puntland groundwater level (mbgl) with seasonal variation.

    Deep base depth per site + annual sine wave + small daily noise.
    """
    base = 8 + (abs(hash(site_id)) % 37)
    day_of_year = t.timetuple().tm_yday
    season = 2.5 * math.sin(2 * math.pi * day_of_year / 365.0)
    rng = random.Random(f"{site_id}:{t.date()}")
    noise = rng.uniform(-0.3, 0.3)
    return round(base + season + noise, 2)


def _timeseries_for_operator(operator: str, now: datetime) -> list[datetime]:
    """Emit timestamps matching each operator's reporting cadence."""
    if operator == "SWALIM":
        return [now - timedelta(hours=6) - timedelta(days=d) for d in range(30)]
    if operator == "WorldVision":
        latest = now - timedelta(days=75)
        return [latest - timedelta(days=90 * q) for q in range(8)]
    latest = now - timedelta(days=17)
    return [latest - timedelta(days=30 * m) for m in range(18)]


def _raw_record(operator: str, site_id: str, t: datetime, level: float,
                 force_flag: str | None = None) -> dict:
    if operator == "SWALIM":
        rec = {
            "operator": operator,
            "site_id": site_id,
            "logger_id": f"SW-{site_id[-3:]}",
            "GW_depth_m": level,
            "baro_hpa": round(1010 + random.uniform(-3, 3), 1),
            "timestamp_utc": t.isoformat(),
        }
    elif operator == "WorldVision":
        rec = {
            "operator": operator,
            "site_id": site_id,
            "station_name": site_id,
            "water_table_below_casing": level,
            "reading_date": t.isoformat(),
        }
    else:
        rec = {
            "operator": operator,
            "site_id": site_id,
            "well_code": site_id,
            "borehole_level": level,
            "measured_at": t.isoformat(),
        }
    if force_flag:
        rec["_force_flag"] = force_flag
    return rec


def generate_dataset(reference_time: datetime | None = None) -> dict:
    """Build the full synthetic dataset.

    Returns:
        {
            "reference_time": datetime,
            "raw_by_operator": {operator: [raw dict, ...]},
            "normalized": [NormalizedRecord, ...],
            "timeseries": {site_id: [dict, ...]},
        }
    """
    random.seed(42)
    now = reference_time or datetime.now(timezone.utc)

    raw_by_operator: dict[str, list[dict]] = {
        "SWALIM": [], "WorldVision": [], "INGO_3": [],
    }
    normalized_latest: list[NormalizedRecord] = []
    timeseries: dict[str, list[dict]] = {}

    for site in SITES:
        op = site["operator"]
        sid = site["site_id"]
        stamps = _timeseries_for_operator(op, now)
        site_series: list[dict] = []

        for idx, t in enumerate(stamps):
            level = _seasonal_level(sid, t)
            force_flag = None
            if op == "INGO_3" and sid == "PL-MUD-002" and idx == 0:
                force_flag = "SPIKE_DETECTED"
                level = round(level + 9.0, 2)
            if op == "INGO_3" and sid == "PL-MUD-003" and idx == 2:
                force_flag = "GAP_INTERPOLATED"

            raw = _raw_record(op, sid, t, level, force_flag=force_flag)
            rec = normalize(RawRecord.model_validate(raw), reference_time=now)
            site_series.append({
                "timestamp_utc": rec.timestamp_utc.isoformat(),
                "water_level_mbgl": rec.water_level_mbgl,
                "quality_flag": rec.quality_flag,
            })
            if idx == 0:
                raw_by_operator[op].append(raw)
                normalized_latest.append(rec)

        site_series.sort(key=lambda p: p["timestamp_utc"], reverse=True)
        timeseries[sid] = site_series

    return {
        "reference_time": now,
        "raw_by_operator": raw_by_operator,
        "normalized": normalized_latest,
        "timeseries": timeseries,
    }
