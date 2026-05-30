# Shared Contract: Geometry Agent Rules

Use this file before taking any individual floor/profile/anomaly/candidate document.

Mandatory reads:

- `README.md`
- `architecture.md`
- `../../../floors.md`
- relevant file under `Docs/GeometryProgram/`
- relevant current source under `src/`

Hard rules:

- No new `FloorLevel`.
- No content-specific logic in `main.ts`, `core/world.ts`, broad AI or renderer.
- No ordinary NPC refill.
- No per-frame full-world scans.
- No route id without generator and manifest entry.
- No `FloorGeometryId` / `FloorAnomalyId` without generation path and tests.
- No save shape change without `SAVE_SHAPE_VERSION`, sanitizer, caps and stale-save rejection.

Implementation style:

- Prefer one complete reachable gameplay path over many partial systems.
- Add focused modules in green ownership areas.
- Use ids, registries and events for cross-system communication.
- Use toroidal helpers for every coordinate operation.
- Keep geometry generation-time unless a bounded runtime system is explicitly required.

Report shape:

- changed files
- changed ids
- reachable gameplay path
- protected cells checked
- A-Life/population impact
- save/load impact
- dirty flags/cache impact
- checks run
