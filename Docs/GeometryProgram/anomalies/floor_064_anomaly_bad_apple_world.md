# Procedural Anomaly: `bad_apple_world`

Type: existing `FloorAnomalyId`.

Goal: keep media topology bounded and non-render-owned.

Geometry plan:

- Screen room bounds.
- Black/white cell bands.
- Projector/control access.

Runtime constraints:

- Animation mutates only known room bounds.
- Route anchors are outside animated topology.
- Renderer does not own gameplay state.

Validation:

- Projector toggles animation.
- Floor remains reachable with animation on/off.
