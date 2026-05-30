# Procedural Geometry: `communal_knots`

Type: existing `FloorGeometryId`.

Goal: make communal kitchens, queues and shared services into macro geometry.

Geometry plan:

- Ring/loop grammar around kitchen, water, pantry, smoking and common rooms.
- Small-world shortcuts through flats.
- Potts grievance domains.

Gameplay decisions:

- Join crowd.
- Use through-flat.
- Steal pantry.
- Expose notice.

Implementation constraints:

- Broad population by placement field only.
- Keep lift backbone ungated.

Validation:

- Forced spec with `geometryId: 'communal_knots'`.
- At least one service loop and one bypass loop.
