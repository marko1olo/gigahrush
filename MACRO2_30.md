# MACRO2_30: Late Topology Anomaly Repair

Модель: GPT-5.5, reasoning extra high.

Цель: every topology-changing anomaly leaves spawn, exits and intended rooms reachable or creates an explicit escape.

Критично: `bad_apple_world`, `wall_snake`, `section_shift`, `conway_life`, `rail_trains` can invalidate earlier connectivity.

Ownership: `src/gen/procedural_anomalies/*.ts`, `src/gen/procedural_floor.ts`, `tests/procedural_anomalies_*.test.ts`.

Читать: `anomalies.md`, `Docs/ProceduralFloors/anomaly.md`, anomaly source files.

Deliverables:
- forced anomaly reachability tests per profile;
- repair/escape hooks for route-cutting anomalies;
- no hidden instant-death sealed starts.

Проверки: `npm run test:unit`, forced anomaly debug teleports.

Параллельные ограничения: runtime anomaly logic remains bounded by cooldown/radius/sparse maps.
