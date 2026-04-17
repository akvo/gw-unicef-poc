"""Translates operator-specific raw records into the normalized schema.

The demo's core argument: three operators call the same measurement by
three different names and reference it against three different datums.
This module is the dictionary.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.schema import NormalizedRecord, RawRecord
from app.sites import get_site


STALE_THRESHOLD_HOURS = 24 * 30  # 30 days — readings older than this are flagged STALE

VOCABULARY = {
    "SWALIM": {
        "level_field": "GW_depth_m",
        "baro_field": "baro_hpa",
        "timestamp_field": "timestamp_utc",
        "datum": "GEODETIC",
    },
    "WorldVision": {
        "level_field": "water_table_below_casing",
        "baro_field": None,
        "timestamp_field": "reading_date",
        "datum": "CASING_TOP",
    },
    "INGO_3": {
        "level_field": "borehole_level",
        "baro_field": None,
        "timestamp_field": "measured_at",
        "datum": "UNVERIFIED",
    },
}


def normalize(raw: RawRecord, reference_time: datetime) -> NormalizedRecord:
    op = raw.operator
    if op not in VOCABULARY:
        raise ValueError(f"No vocabulary entry for operator {op!r}")
    vocab = VOCABULARY[op]
    payload = raw.model_dump()

    level_raw = float(payload[vocab["level_field"]])
    baro = payload.get(vocab["baro_field"]) if vocab["baro_field"] else None
    ts_raw = payload[vocab["timestamp_field"]]
    ts = ts_raw if isinstance(ts_raw, datetime) else datetime.fromisoformat(ts_raw)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    site = get_site(raw.site_id) or {}
    age_hours = (reference_time - ts).total_seconds() / 3600.0

    flag = _derive_flag(op, age_hours, baro, level_raw, payload)

    return NormalizedRecord(
        site_id=raw.site_id,
        site_name=site.get("site_name", raw.site_id),
        operator=op,
        lat=site.get("lat", 0.0),
        lng=site.get("lng", 0.0),
        timestamp_utc=ts,
        water_level_mbgl=level_raw,
        water_level_raw=level_raw,
        raw_field_name=vocab["level_field"],
        barometric_pressure_hpa=baro,
        quality_flag=flag,
        datum_reference_method=vocab["datum"],
        data_age_hours=round(age_hours, 2),
    )


def _derive_flag(operator, age_hours, baro, level_raw, payload):
    if payload.get("_force_flag"):
        return payload["_force_flag"]
    if age_hours > STALE_THRESHOLD_HOURS:
        return "STALE"
    if operator == "INGO_3":
        return "DATUM_UNVERIFIED"
    if operator == "SWALIM" and baro is None:
        return "BARO_UNCORRECTED"
    return "VALID"
