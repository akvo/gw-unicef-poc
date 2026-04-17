# Groundwater Connector Framework — Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, single-page demo showing that three heterogeneous groundwater data sources (SWALIM, WorldVision, INGO_3) can be ingested, normalized to a common WaterML-2.0-inspired schema, and rendered in a dashboard that makes the vocabulary, quality, and freshness problems visible.

**Architecture:** FastAPI backend generates synthetic raw records per operator at startup, runs them through a normalizer module that maps operator-specific field names into a unified schema with quality flags, and exposes both raw and normalized views via JSON endpoints. React (Vite) frontend consumes the API and renders three tab views: Raw vs Normalized table, Puntland Leaflet map, and Operator summary dashboard. Docker Compose orchestrates both services for `docker compose up` reproducibility.

**Tech Stack:** Python 3.11, FastAPI, Pydantic v2, uvicorn. Node 20, React 18, Vite, Tailwind CSS, Leaflet.js (via react-leaflet), Recharts. Docker Compose for orchestration.

**Pragmatism note:** This is a pitch demo with synthetic data, not a production system. TDD is applied to the normalizer (the core technical argument) where correctness matters. UI views are built as complete, runnable components without a test suite — the verification step is visual confirmation in the browser.

---

## File Structure

```
bd-pitches/
├── docker-compose.yml
├── README.md
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + CORS + route mounting
│   │   ├── schema.py            # Pydantic models: RawRecord, NormalizedRecord
│   │   ├── normalizer.py        # Vocabulary translation + quality flag logic
│   │   ├── synthetic.py         # Generate 12 sites × operator-specific raw data
│   │   ├── sites.py             # Static site registry (lat/lng, regions, operator)
│   │   └── routes.py            # API endpoints
│   └── tests/
│       ├── __init__.py
│       └── test_normalizer.py   # Vocabulary mapping + flag derivation tests
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── index.css            # Tailwind directives
        ├── App.jsx              # Tab router
        ├── api.js               # Fetch wrappers
        ├── constants.js         # Quality flag definitions + colors
        ├── components/
        │   ├── QualityFlag.jsx  # Colored pill with tooltip
        │   ├── DataAge.jsx      # Humanized age + freshness color
        │   └── NavTabs.jsx      # Top nav
        └── views/
            ├── RawVsNormalized.jsx
            ├── MonitoringMap.jsx
            └── OperatorDashboard.jsx
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `docker-compose.yml`
- Create: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
__pycache__/
*.pyc
.pytest_cache/
node_modules/
dist/
.venv/
.DS_Store
.env
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - PYTHONUNBUFFERED=1

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE=http://localhost:8000
    depends_on:
      - backend
```

- [ ] **Step 3: Create `README.md`**

```markdown
# Groundwater Connector Framework — Demo

Prototype demo for UNICEF Innovation pitch. Shows ingestion and normalization
of three heterogeneous groundwater data sources (SWALIM, WorldVision, INGO_3)
into a unified schema with quality flags and freshness tracking.

**Not a production system.** Synthetic data, local-only.

## Run

    docker compose up --build

Then open http://localhost:5173

## Views

1. **Raw vs Normalized** — same measurement, three vocabularies, one output.
2. **Monitoring Map** — Puntland sites colored by quality flag.
3. **Operator Dashboard** — fragmentation made visible.

## Schema

Every normalized observation carries: site_id, operator, lat, lng,
timestamp_utc, water_level_mbgl, water_level_raw, raw_field_name,
barometric_pressure_hpa, quality_flag, datum_reference_method, data_age_hours.
```

- [ ] **Step 4: Verify structure**

Run: `ls -la`
Expected: see `docker-compose.yml`, `README.md`, `.gitignore`.

---

## Task 2: Backend Scaffolding

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/pytest.ini`
- Create: `backend/app/__init__.py` (empty)
- Create: `backend/tests/__init__.py` (empty)

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.9.2
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 3: Create `backend/pytest.ini`**

```ini
[pytest]
testpaths = tests
pythonpath = .
```

- [ ] **Step 4: Create empty `backend/app/__init__.py` and `backend/tests/__init__.py`**

Both files are empty.

---

## Task 3: Site Registry

**Files:**
- Create: `backend/app/sites.py`

The 12 synthetic sites across Puntland regions. Coordinates are plausible points near Bari (Bosaso/Qardho), Nugaal (Garowe), and Mudug (Galkayo).

- [ ] **Step 1: Create `backend/app/sites.py`**

```python
"""Static registry of synthetic monitoring sites.

Coordinates are realistic for Puntland but the installations are fictional.
Operator assignment reflects the demo narrative: SWALIM runs the densest
network in Bari, WorldVision concentrates in Nugaal, INGO_3 is spread thin.
"""

SITES = [
    # SWALIM — Bari region (fresh, daily telemetry)
    {"site_id": "PL-BAR-001", "site_name": "Bosaso North Wellfield",
     "operator": "SWALIM", "lat": 11.2842, "lng": 49.1816, "region": "Bari"},
    {"site_id": "PL-BAR-002", "site_name": "Bosaso Airport Observation",
     "operator": "SWALIM", "lat": 11.2753, "lng": 49.1494, "region": "Bari"},
    {"site_id": "PL-BAR-003", "site_name": "Qardho Municipal",
     "operator": "SWALIM", "lat": 9.5000, "lng": 49.0667, "region": "Bari"},
    {"site_id": "PL-BAR-004", "site_name": "Qardho West Kebele",
     "operator": "SWALIM", "lat": 9.4821, "lng": 49.0412, "region": "Bari"},

    # WorldVision — Nugaal region (quarterly, stale)
    {"site_id": "PL-NUG-001", "site_name": "Garowe Central",
     "operator": "WorldVision", "lat": 8.4053, "lng": 48.4789, "region": "Nugaal"},
    {"site_id": "PL-NUG-002", "site_name": "Garowe IDP Camp",
     "operator": "WorldVision", "lat": 8.4201, "lng": 48.4612, "region": "Nugaal"},
    {"site_id": "PL-NUG-003", "site_name": "Eyl Coastal",
     "operator": "WorldVision", "lat": 7.9803, "lng": 49.8164, "region": "Nugaal"},
    {"site_id": "PL-NUG-004", "site_name": "Dangoroyo Rural",
     "operator": "WorldVision", "lat": 8.1347, "lng": 48.1892, "region": "Nugaal"},

    # INGO_3 — Mudug region (monthly, mixed quality)
    {"site_id": "PL-MUD-001", "site_name": "Galkayo South",
     "operator": "INGO_3", "lat": 6.7649, "lng": 47.4338, "region": "Mudug"},
    {"site_id": "PL-MUD-002", "site_name": "Galkayo East School",
     "operator": "INGO_3", "lat": 6.7712, "lng": 47.4561, "region": "Mudug"},
    {"site_id": "PL-MUD-003", "site_name": "Jariban Coastal",
     "operator": "INGO_3", "lat": 6.7372, "lng": 48.5628, "region": "Mudug"},
    {"site_id": "PL-MUD-004", "site_name": "Hobyo Fishing Village",
     "operator": "INGO_3", "lat": 5.3505, "lng": 48.5268, "region": "Mudug"},
]


def get_site(site_id: str) -> dict | None:
    return next((s for s in SITES if s["site_id"] == site_id), None)
```

---

## Task 4: Pydantic Schema

**Files:**
- Create: `backend/app/schema.py`

- [ ] **Step 1: Create `backend/app/schema.py`**

```python
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
    recent_readings: list[float]  # last N water_level_mbgl values, newest first
```

---

## Task 5: Normalizer — TDD

This is the demo's core technical argument. Tests first.

**Files:**
- Create: `backend/tests/test_normalizer.py`
- Create: `backend/app/normalizer.py`

- [ ] **Step 1: Write failing test for SWALIM vocabulary mapping**

```python
# backend/tests/test_normalizer.py
from datetime import datetime, timezone, timedelta

from app.normalizer import normalize
from app.schema import RawRecord


def _now():
    return datetime.now(timezone.utc)


def test_swalim_maps_gw_depth_m_to_water_level_mbgl():
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 12.4,
        "baro_hpa": 1013.2,
        "timestamp_utc": _now().isoformat(),
    })
    out = normalize(raw, reference_time=_now())
    assert out.water_level_mbgl == 12.4
    assert out.water_level_raw == 12.4
    assert out.raw_field_name == "GW_depth_m"
    assert out.barometric_pressure_hpa == 1013.2
    assert out.datum_reference_method == "GEODETIC"
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd backend && pytest tests/test_normalizer.py::test_swalim_maps_gw_depth_m_to_water_level_mbgl -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.normalizer'`.

- [ ] **Step 3: Create minimal normalizer to pass first test**

```python
# backend/app/normalizer.py
"""Translates operator-specific raw records into the normalized schema.

The demo's core argument: three operators call the same measurement by
three different names and reference it against three different datums.
This module is the dictionary.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.schema import NormalizedRecord, RawRecord
from app.sites import get_site


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
    # Explicit flag override from synthetic generator (for SPIKE_DETECTED
    # and GAP_INTERPOLATED which depend on history, not a single record)
    if payload.get("_force_flag"):
        return payload["_force_flag"]
    if age_hours > 720:
        return "STALE"
    if operator == "INGO_3":
        return "DATUM_UNVERIFIED"
    if operator == "SWALIM" and baro is None:
        return "BARO_UNCORRECTED"
    return "VALID"
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd backend && pytest tests/test_normalizer.py::test_swalim_maps_gw_depth_m_to_water_level_mbgl -v`
Expected: PASS.

- [ ] **Step 5: Add remaining normalizer tests**

Append to `backend/tests/test_normalizer.py`:

```python
def test_worldvision_stale_when_age_over_30_days():
    old_ts = _now() - timedelta(days=75)
    raw = RawRecord.model_validate({
        "operator": "WorldVision",
        "site_id": "PL-NUG-001",
        "water_table_below_casing": 22.1,
        "reading_date": old_ts.isoformat(),
    })
    out = normalize(raw, reference_time=_now())
    assert out.water_level_mbgl == 22.1
    assert out.raw_field_name == "water_table_below_casing"
    assert out.datum_reference_method == "CASING_TOP"
    assert out.quality_flag == "STALE"
    assert out.data_age_hours > 720


def test_ingo3_marks_datum_unverified():
    raw = RawRecord.model_validate({
        "operator": "INGO_3",
        "site_id": "PL-MUD-001",
        "borehole_level": 18.7,
        "measured_at": _now().isoformat(),
    })
    out = normalize(raw, reference_time=_now())
    assert out.raw_field_name == "borehole_level"
    assert out.datum_reference_method == "UNVERIFIED"
    assert out.quality_flag == "DATUM_UNVERIFIED"


def test_swalim_without_baro_flagged_baro_uncorrected():
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 10.0,
        "baro_hpa": None,
        "timestamp_utc": _now().isoformat(),
    })
    out = normalize(raw, reference_time=_now())
    assert out.quality_flag == "BARO_UNCORRECTED"


def test_forced_flag_overrides_default():
    raw = RawRecord.model_validate({
        "operator": "SWALIM",
        "site_id": "PL-BAR-001",
        "GW_depth_m": 10.0,
        "baro_hpa": 1012.0,
        "timestamp_utc": _now().isoformat(),
        "_force_flag": "SPIKE_DETECTED",
    })
    out = normalize(raw, reference_time=_now())
    assert out.quality_flag == "SPIKE_DETECTED"
```

- [ ] **Step 6: Run full test suite**

Run: `cd backend && pytest -v`
Expected: 5 passed.

---

## Task 6: Synthetic Data Generator

**Files:**
- Create: `backend/app/synthetic.py`

Generates, per site, a time series of raw-format records and returns both the raw and normalized views.

- [ ] **Step 1: Create `backend/app/synthetic.py`**

```python
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
    # Deterministic per-site base depth between 8 and 45
    base = 8 + (abs(hash(site_id)) % 37)
    day_of_year = t.timetuple().tm_yday
    season = 2.5 * math.sin(2 * math.pi * day_of_year / 365.0)
    rng = random.Random(f"{site_id}:{t.date()}")
    noise = rng.uniform(-0.3, 0.3)
    return round(base + season + noise, 2)


def _timeseries_for_operator(operator: str, now: datetime) -> list[datetime]:
    """Emit timestamps matching each operator's reporting cadence."""
    if operator == "SWALIM":
        # Daily for last 30 days, freshest reading ≤ 24h old
        return [now - timedelta(hours=6) - timedelta(days=d) for d in range(30)]
    if operator == "WorldVision":
        # Quarterly samples for last 2 years, most recent is 60-90 days old
        latest = now - timedelta(days=75)
        return [latest - timedelta(days=90 * q) for q in range(8)]
    # INGO_3 — monthly, most recent 15-20 days old
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
    else:  # INGO_3
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
            "timeseries": {site_id: [TimeSeriesPoint-like dict, ...]},
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
            # Inject visible anomalies for narrative richness
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

        # Newest first
        site_series.sort(key=lambda p: p["timestamp_utc"], reverse=True)
        timeseries[sid] = site_series

    return {
        "reference_time": now,
        "raw_by_operator": raw_by_operator,
        "normalized": normalized_latest,
        "timeseries": timeseries,
    }
```

- [ ] **Step 2: Smoke-test the generator**

Run: `cd backend && python -c "from app.synthetic import generate_dataset; d = generate_dataset(); print(len(d['normalized']), 'sites,', sum(len(v) for v in d['timeseries'].values()), 'points')"`
Expected: `12 sites, <some number > 100> points`.

---

## Task 7: API Routes

**Files:**
- Create: `backend/app/routes.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/routes.py`**

```python
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
        # Flatten last 10 readings across sites for sparkline
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
```

- [ ] **Step 2: Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(title="Groundwater Connector Framework — Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"status": "ok", "service": "groundwater-connector-demo"}
```

- [ ] **Step 3: Smoke-test the API locally**

Run: `cd backend && python -m uvicorn app.main:app --port 8000 &` then `sleep 2 && curl -s http://localhost:8000/api/sites | head -c 400 && echo && curl -s http://localhost:8000/api/operators | head -c 400`
Expected: JSON arrays with site and operator records. Kill the server after verifying.

---

## Task 8: Frontend Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/Dockerfile`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "groundwater-connector-demo",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}
```

- [ ] **Step 2: Create `frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '0.0.0.0' },
});
```

- [ ] **Step 3: Create `frontend/tailwind.config.js`**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flag: {
          valid: '#16a34a',
          baro: '#f59e0b',
          stale: '#64748b',
          datum: '#a855f7',
          spike: '#dc2626',
          gap: '#0ea5e9',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `frontend/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Groundwater Connector Framework — Demo</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
```

- [ ] **Step 8: Create `frontend/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

## Task 9: Frontend Shared Modules

**Files:**
- Create: `frontend/src/api.js`
- Create: `frontend/src/constants.js`
- Create: `frontend/src/components/QualityFlag.jsx`
- Create: `frontend/src/components/DataAge.jsx`
- Create: `frontend/src/components/NavTabs.jsx`

- [ ] **Step 1: Create `frontend/src/api.js`**

```javascript
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function j(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export const api = {
  sites: () => j('/api/sites'),
  normalized: () => j('/api/normalized'),
  rawForOperator: (op) => j(`/api/raw/${op}`),
  timeseries: (siteId) => j(`/api/sites/${siteId}/timeseries`),
  operators: () => j('/api/operators'),
};
```

- [ ] **Step 2: Create `frontend/src/constants.js`**

```javascript
export const FLAGS = {
  VALID: {
    color: '#16a34a',
    label: 'Valid',
    explanation: 'Passed all automated QC checks.',
  },
  BARO_UNCORRECTED: {
    color: '#f59e0b',
    label: 'Baro Uncorrected',
    explanation:
      'Reading has not been compensated for atmospheric pressure. Absolute depth may drift up to ±0.3 m.',
  },
  STALE: {
    color: '#64748b',
    label: 'Stale',
    explanation:
      'No transmission in > 30 days. Value shown reflects the last successful reading, not current state.',
  },
  DATUM_UNVERIFIED: {
    color: '#a855f7',
    label: 'Datum Unverified',
    explanation:
      'Reference datum (ground level vs casing top vs geodetic) has not been confirmed against field survey.',
  },
  SPIKE_DETECTED: {
    color: '#dc2626',
    label: 'Spike Detected',
    explanation:
      'Reading differs from trend by more than 3σ. Likely sensor fault or manual reset — flagged for review.',
  },
  GAP_INTERPOLATED: {
    color: '#0ea5e9',
    label: 'Gap Interpolated',
    explanation:
      'Value synthesised from neighbouring readings to maintain time-series continuity. Do not use for compliance reporting.',
  },
};

export const OPERATORS = ['SWALIM', 'WorldVision', 'INGO_3'];

export const OPERATOR_DESCRIPTIONS = {
  SWALIM: 'FAO-SWALIM. Daily telemetry. Geodetic datum.',
  WorldVision: 'World Vision. Quarterly field visits. Casing-top reference.',
  INGO_3: 'Third INGO. Monthly reports. Datum unverified.',
};
```

- [ ] **Step 3: Create `frontend/src/components/QualityFlag.jsx`**

```jsx
import { FLAGS } from '../constants';

export default function QualityFlag({ flag, showTooltip = true }) {
  const f = FLAGS[flag] || { color: '#999', label: flag, explanation: '' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: f.color }}
      title={showTooltip ? f.explanation : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {f.label}
    </span>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/DataAge.jsx`**

```jsx
function humanize(hours) {
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

function colorFor(hours) {
  if (hours < 48) return 'text-emerald-600';
  if (hours < 168) return 'text-amber-600';
  if (hours < 720) return 'text-orange-600';
  return 'text-slate-500';
}

export default function DataAge({ hours }) {
  return (
    <span className={`text-sm font-medium ${colorFor(hours)}`}>
      {humanize(hours)}
    </span>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/NavTabs.jsx`**

```jsx
const TABS = [
  { id: 'raw', label: '1. Raw vs Normalized' },
  { id: 'map', label: '2. Monitoring Map' },
  { id: 'dashboard', label: '3. Operator Dashboard' },
];

export default function NavTabs({ active, onChange }) {
  return (
    <nav className="flex gap-1 border-b border-slate-200 bg-white px-6">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
            active === t.id
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

---

## Task 10: View 1 — Raw vs Normalized (Priority View)

**Files:**
- Create: `frontend/src/views/RawVsNormalized.jsx`

- [ ] **Step 1: Create `frontend/src/views/RawVsNormalized.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import { OPERATORS, OPERATOR_DESCRIPTIONS } from '../constants';
import QualityFlag from '../components/QualityFlag';

function RawCard({ operator, rawRecords }) {
  if (!rawRecords || rawRecords.length === 0) return null;
  const sample = rawRecords[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{operator}</h3>
        <span className="text-xs text-slate-500">raw format</span>
      </div>
      <p className="mb-3 text-xs text-slate-600">{OPERATOR_DESCRIPTIONS[operator]}</p>
      <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
        {JSON.stringify(sample, null, 2)}
      </pre>
    </div>
  );
}

export default function RawVsNormalized() {
  const [raw, setRaw] = useState({});
  const [normalized, setNormalized] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const rawEntries = await Promise.all(
          OPERATORS.map(async (op) => [op, await api.rawForOperator(op)]),
        );
        setRaw(Object.fromEntries(rawEntries));
        setNormalized(await api.normalized());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-8 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          Same measurement. Three vocabularies. One output.
        </h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          Each operator sends groundwater depth under a different field name
          against a different datum. The connector translates every record into
          a common schema anchored to WaterML 2.0 conventions before anything
          reaches the dashboard.
        </p>
      </header>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Raw input — as received
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {OPERATORS.map((op) => (
            <RawCard key={op} operator={op} rawRecords={raw[op]} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Normalized output — unified schema
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Site</th>
                <th className="px-3 py-2">Operator</th>
                <th className="px-3 py-2">Raw field</th>
                <th className="px-3 py-2">Value (raw)</th>
                <th className="px-3 py-2">water_level_mbgl</th>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {normalized.map((r) => (
                <tr key={r.site_id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{r.site_name}</div>
                    <div className="text-xs text-slate-500">{r.site_id}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.operator}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">
                    {r.raw_field_name}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {r.water_level_raw}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-slate-900">
                    {r.water_level_mbgl}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {r.datum_reference_method}
                  </td>
                  <td className="px-3 py-2">
                    <QualityFlag flag={r.quality_flag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
```

---

## Task 11: View 2 — Monitoring Map

**Files:**
- Create: `frontend/src/views/MonitoringMap.jsx`

- [ ] **Step 1: Create `frontend/src/views/MonitoringMap.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import { FLAGS } from '../constants';
import QualityFlag from '../components/QualityFlag';
import DataAge from '../components/DataAge';

const PUNTLAND_CENTER = [9.0, 48.5];

export default function MonitoringMap() {
  const [sites, setSites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.sites().then(setSites);
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.timeseries(selected.site_id).then((pts) => {
      setSeries(
        [...pts]
          .reverse()
          .map((p) => ({ ...p, t: p.timestamp_utc.slice(0, 10) })),
      );
    });
  }, [selected]);

  return (
    <div className="grid h-[calc(100vh-120px)] grid-cols-[1fr_420px]">
      <div>
        <MapContainer
          center={PUNTLAND_CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sites.map((s) => (
            <CircleMarker
              key={s.site_id}
              center={[s.lat, s.lng]}
              radius={10}
              pathOptions={{
                color: FLAGS[s.quality_flag]?.color || '#999',
                fillColor: FLAGS[s.quality_flag]?.color || '#999',
                fillOpacity: 0.75,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(s) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{s.site_name}</div>
                  <div className="text-slate-500">{s.operator}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
        {!selected ? (
          <div className="text-slate-500">
            Click a site to inspect its latest reading, quality flag, and
            time-series.
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {selected.operator}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selected.site_name}
              </h2>
              <div className="text-xs text-slate-500">{selected.site_id}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Water level (mbgl)"
                value={selected.water_level_mbgl.toFixed(2)}
              />
              <Metric label="Data age" value={<DataAge hours={selected.data_age_hours} />} />
              <Metric label="Datum" value={selected.datum_reference_method} />
              <Metric
                label="Baro (hPa)"
                value={
                  selected.barometric_pressure_hpa?.toFixed?.(1) ?? '—'
                }
              />
            </div>

            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Quality
              </div>
              <QualityFlag flag={selected.quality_flag} />
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {FLAGS[selected.quality_flag]?.explanation}
              </p>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Time series
              </div>
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={series}>
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis
                      reversed
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: 'mbgl',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 10 },
                      }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="water_level_mbgl"
                      stroke={FLAGS[selected.quality_flag]?.color || '#0ea5e9'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Y axis reversed — deeper water levels appear lower.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}
```

---

## Task 12: View 3 — Operator Dashboard

**Files:**
- Create: `frontend/src/views/OperatorDashboard.jsx`

- [ ] **Step 1: Create `frontend/src/views/OperatorDashboard.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { OPERATOR_DESCRIPTIONS } from '../constants';
import QualityFlag from '../components/QualityFlag';
import DataAge from '../components/DataAge';

function Sparkline({ values, color }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-16">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SPARK_COLOR = {
  SWALIM: '#0ea5e9',
  WorldVision: '#a855f7',
  INGO_3: '#f59e0b',
};

export default function OperatorDashboard() {
  const [ops, setOps] = useState([]);
  useEffect(() => {
    api.operators().then(setOps);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          Three operators. Three cadences. One picture.
        </h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          The freshness and quality story across the whole Puntland network, at
          a glance. Fragmentation is the problem the connector exists to solve.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {ops.map((o) => (
          <div
            key={o.operator}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {o.operator}
                </h3>
                <p className="text-xs text-slate-500">
                  {OPERATOR_DESCRIPTIONS[o.operator]}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-slate-900">
                  {o.site_count}
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  sites
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Data freshness
                </div>
                <DataAge hours={o.avg_data_age_hours} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Dominant flag
                </div>
                <QualityFlag flag={o.dominant_quality_flag} />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Recent readings (mbgl)
              </div>
              <Sparkline
                values={o.recent_readings}
                color={SPARK_COLOR[o.operator] || '#64748b'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 13: Wire It All Together

**Files:**
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/App.jsx`**

```jsx
import { useState } from 'react';
import NavTabs from './components/NavTabs';
import RawVsNormalized from './views/RawVsNormalized';
import MonitoringMap from './views/MonitoringMap';
import OperatorDashboard from './views/OperatorDashboard';

export default function App() {
  const [tab, setTab] = useState('raw');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Groundwater Connector Framework
            </h1>
            <p className="text-xs text-slate-500">
              Puntland demo · synthetic data · UNICEF Innovation pitch
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Prototype — not production
          </span>
        </div>
      </header>
      <NavTabs active={tab} onChange={setTab} />
      <main>
        {tab === 'raw' && <RawVsNormalized />}
        {tab === 'map' && <MonitoringMap />}
        {tab === 'dashboard' && <OperatorDashboard />}
      </main>
    </div>
  );
}
```

---

## Task 14: End-to-End Verification

- [ ] **Step 1: Build and start the stack**

Run: `cd /Users/joyghosh/akvo/akvo-repos/bd-pitches && docker compose up --build`
Expected: Both containers start. Backend logs show uvicorn running on 0.0.0.0:8000. Frontend logs show Vite ready on 0.0.0.0:5173.

- [ ] **Step 2: Sanity-check the API**

Run (new terminal): `curl -s http://localhost:8000/api/sites | python -m json.tool | head -40` and `curl -s http://localhost:8000/api/operators | python -m json.tool`
Expected: 12 normalized records; 3 operator summaries with distinct avg_data_age_hours and dominant flags.

- [ ] **Step 3: Open the browser and walk the demo**

Open http://localhost:5173.

Verify manually:
1. **Raw vs Normalized** (default): three raw JSON cards show different field names (`GW_depth_m`, `water_table_below_casing`, `borehole_level`). Normalized table below shows all 12 rows with unified schema and colored quality flags.
2. **Monitoring Map**: Puntland map loads, 12 coloured dots visible across Bari / Nugaal / Mudug. Clicking a SWALIM dot shows fresh data age in green; a WorldVision dot shows a "60d ago" or similar age with STALE flag; INGO_3 dots show DATUM_UNVERIFIED with some SPIKE_DETECTED and GAP_INTERPOLATED. Time series renders with reversed Y axis.
3. **Operator Dashboard**: three cards side by side. SWALIM card shows fresh data + VALID flag. WorldVision shows stale age + STALE flag. INGO_3 shows mixed flag + sparkline.

- [ ] **Step 4: Run backend test suite one final time**

Run: `cd backend && pytest -v`
Expected: 5 passed.

- [ ] **Step 5: Commit the working demo**

(Only if the user wants git — this working directory isn't currently a git repo. Skip unless explicitly asked.)

---

## Self-Review Notes

**Spec coverage check:**

- ✓ Vocabulary problem — Task 5 normalizer + Task 10 Raw vs Normalized view.
- ✓ Quality flag system — Task 4 schema, Task 5 flag derivation, Task 9 QualityFlag component, Task 11 map colouring, Task 12 dashboard dominant flag.
- ✓ Freshness problem — Task 6 operator-specific cadences, Task 9 DataAge component, Task 12 avg_data_age_hours per operator.
- ✓ All schema fields from spec present in `NormalizedRecord` (Task 4).
- ✓ 12 sites across Bari / Nugaal / Mudug (Task 3).
- ✓ SWALIM < 24h / WorldVision 60-90d / INGO_3 mixed (Task 6 cadence functions).
- ✓ Water levels 8-45 mbgl with seasonal variation (Task 6 `_seasonal_level`).
- ✓ docker compose up deliverable (Task 1 + Task 14).
- ✓ Raw vs Normalized prioritised as default tab (Task 13).
