# MACRO2_99: Parallel Batch Ownership Contract Refresh

Модель: GPT-5.5, reasoning extra high.

Цель: define a new parallel-agent contract for implementing these MACRO2 plans without shared-file collisions.

Критично: 100 agents can easily fight over `main.ts`, manifests, docs and broad systems.

Ownership: new compact doc such as `MACRO2_PARALLEL_CONTRACT.md`, `architecture.md` only if ownership rules change.

Читать: `architecture.md Parallel Agent Ownership`, `gatbage/Docs/AgentPrompts/BATCH4_PARALLEL_CONTRACT.md`, all `MACRO2_*.md`.

Deliverables:
- classify each MACRO2 as green/yellow/red ownership;
- define ordering dependencies and integration owners;
- require per-agent checks and no README update before verified behavior.

Проверки: docs grep and manual review; no source checks unless source changed.

Параллельные ограничения: do not recreate historical prompt folders unless explicitly requested.
