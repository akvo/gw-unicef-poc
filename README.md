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
