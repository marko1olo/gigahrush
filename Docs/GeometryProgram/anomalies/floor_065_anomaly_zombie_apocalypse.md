# Procedural Anomaly: `zombie_apocalypse`

Type: existing `FloorAnomalyId`.

Goal: make outbreak geometry meaningful without refill.

Geometry plan:

- Quarantine rings.
- Crowd funnels.
- Infection Voronoi cells.
- Medical counterplay pockets.

Runtime constraints:

- No refill-to-cap.
- Infection conversions capped and event-driven.
- Only active where NPCs are permitted.

Validation:

- Outbreak events publish compact facts.
- Lift route not blocked by quarantine ring.
