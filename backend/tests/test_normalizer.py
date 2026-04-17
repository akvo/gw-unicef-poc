from datetime import datetime, timezone, timedelta

from app.normalizer import normalize
from app.schema import RawRecord


def _now():
    return datetime.now(timezone.utc)


def test_swalim_maps_gw_depth_m_to_water_level_mbgl():
    now = _now()
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 12.4,
        "baro_hpa": 1013.2,
        "timestamp_utc": now.isoformat(),
    })
    out = normalize(raw, reference_time=now)
    assert out.water_level_mbgl == 12.4
    assert out.water_level_raw == 12.4
    assert out.raw_field_name == "GW_depth_m"
    assert out.barometric_pressure_hpa == 1013.2
    assert out.datum_reference_method == "GEODETIC"


def test_worldvision_stale_when_age_over_30_days():
    now = _now()
    old_ts = now - timedelta(days=75)
    raw = RawRecord.model_validate({
        "operator": "WorldVision",
        "site_id": "PL-NUG-001",
        "water_table_below_casing": 22.1,
        "reading_date": old_ts.isoformat(),
    })
    out = normalize(raw, reference_time=now)
    assert out.water_level_mbgl == 22.1
    assert out.raw_field_name == "water_table_below_casing"
    assert out.datum_reference_method == "CASING_TOP"
    assert out.quality_flag == "STALE"
    assert out.data_age_hours > 720


def test_ingo3_marks_datum_unverified():
    now = _now()
    raw = RawRecord.model_validate({
        "operator": "INGO_3",
        "site_id": "PL-MUD-001",
        "borehole_level": 18.7,
        "measured_at": now.isoformat(),
    })
    out = normalize(raw, reference_time=now)
    assert out.raw_field_name == "borehole_level"
    assert out.datum_reference_method == "UNVERIFIED"
    assert out.quality_flag == "DATUM_UNVERIFIED"


def test_swalim_without_baro_flagged_baro_uncorrected():
    now = _now()
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 10.0,
        "baro_hpa": None,
        "timestamp_utc": now.isoformat(),
    })
    out = normalize(raw, reference_time=now)
    assert out.quality_flag == "BARO_UNCORRECTED"


def test_forced_flag_overrides_default():
    now = _now()
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 10.0,
        "baro_hpa": 1012.0,
        "timestamp_utc": now.isoformat(),
        "_force_flag": "SPIKE_DETECTED",
    })
    out = normalize(raw, reference_time=now)
    assert out.quality_flag == "SPIKE_DETECTED"


def test_unknown_site_id_falls_back_to_defaults():
    """Unknown site_id is tolerated: site_name echoes site_id, coords default to 0.0."""
    now = _now()
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "UNKNOWN-SITE",
        "GW_depth_m": 11.0,
        "baro_hpa": 1012.0,
        "timestamp_utc": now.isoformat(),
    })
    out = normalize(raw, reference_time=now)
    assert out.site_name == "UNKNOWN-SITE"
    assert out.lat == 0.0
    assert out.lng == 0.0
