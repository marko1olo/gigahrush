# MACRO2_44: Procedural Anomaly Docs Sync

Модель: GPT-5.5, reasoning extra high.

Цель: `Docs/ProceduralFloors/anomaly.md` and `geometry.md` match source reality: 18 anomalies and 6 geometries.

Критично: docs are active contracts for future agents; stale profile lists create duplicate or wrong implementation.

Ownership: `Docs/ProceduralFloors/anomaly.md`, `Docs/ProceduralFloors/geometry.md`, optional audit script docs check.

Читать: `src/data/procedural_floors.ts`, `src/gen/procedural_anomalies/**`, `README.md`.

Deliverables:
- docs list all profile ids, tags, runtime/rebuild constraints;
- validation checklist includes reachability after late topology changes;
- optional source-vs-doc grep check.

Проверки: `npm run content:audit`, docs/source diff script if added.

Параллельные ограничения: docs only unless a typo in source blocks audit.
