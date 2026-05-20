# MACRO2_98: Performance Telemetry Black Box

Модель: GPT-5.5, reasoning extra high.

Цель: expose bounded performance counters for AI, projectiles, render collection, entity index, pathfinding, generation and smoke.

Критично: scaling to 10k requires measurements, not assumptions.

Ownership: `src/systems/debug.ts`, `src/systems/entity_index.ts`, `src/systems/ai/pathfinding.ts`, `src/main.ts`, `scripts/smoke-playability.mjs`.

Читать: `architecture.md Black Box And Telemetry`, `scaling.md`, current debug overlay.

Deliverables:
- last 300 sample ring or compact current counters;
- debug command/overlay for entity counts, hot paths, frame budget;
- smoke can report perfFrameCount metrics.

Проверки: `npm run typecheck`, stress smoke with `SMOKE_PERF_FRAMES`.

Параллельные ограничения: telemetry must be cheap and bounded; no console spam.
