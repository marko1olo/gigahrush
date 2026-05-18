# LOG FLOOR21_GEOMETRY

## Final Report

Changed files: `src/gen/design_floors/darkness.ts`, `src/gen/design_floors/full_floor.ts`, `gatbage/Docs/Tasks/Status_FLOOR21_GEOMETRY.md`, and this log.

Macro geometry: Darkness now uses light as route structure. The authored layout has a lit threshold, junction, lamp post, generator room, name registry, control room, toll room, narrow shadow toll gate, long bypass, emergency pocket, and return trace. Route decisions are physical: the short toll route is darker and hostile, the name/control route spends light on safety and information, and the bypass is longer but does not require a rare item.

Motifs implemented: light islands, dead lamp rows, generator/control rooms, shadow toll chokepoint, black corridors, and emergency stash pockets. The full-floor expansion no longer scatters random void islands; it calls the local Darkness route expansion and keeps ambient Darkness light sparse.

Counts: targeted generation produced 11 rooms, 18 entities, 2 adjacent reachable lift cells, roughly 2951 floor cells, 705 near-unlit floor cells, and 576 high-fog floor cells.

Validation: `npm run check` passed. `npm run smoke` failed once with a Chrome missing-canvas diagnostic after title/start, then passed on rerun with lit HUD and scene samples. A targeted Darkness generation check confirmed the route graph and lift adjacency.
