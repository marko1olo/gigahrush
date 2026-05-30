# Procedural Geometry: `attic_weatherworks`

Type: existing `FloorGeometryId`.

Goal: make attic/roofline procedural floors read as ducts, cables, wind and documents.

Geometry plan:

- Tensor cable/duct spines on proxy grid.
- Crawl branches and service pockets.
- Hough/Radon wind/signal sight lanes when safe.

Gameplay decisions:

- Exposed service run.
- Crawl bypass.
- Repair antenna/duct.
- Steal document cache.

Implementation constraints:

- No roof-specific runtime loop.
- Use pipe/concrete texture language already in profile.

Validation:

- Forced spec with `geometryId: 'attic_weatherworks'`.
- Spines do not cut lift access.
