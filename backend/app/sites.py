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
