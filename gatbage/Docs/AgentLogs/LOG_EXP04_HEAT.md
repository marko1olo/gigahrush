# LOG_EXP04_HEAT

## 2026-05-17 - Expansion 04 Heatline Zero Documentation Pass

What was wrong: Expansion 04 had the high-level `expansion.md`, but no implementation-grade handoff files for a playable MVP. The missing pieces were a phased build plan, a concrete content manifest, and a cross-system integration contract that keeps heat work decoupled from renderer, samosbor, monster AI, and other agents.

What was done: Created `Docs/Expansions/04_heatline_zero/implementation_plan.md`, `Docs/Expansions/04_heatline_zero/content_manifest.md`, and `Docs/Expansions/04_heatline_zero/integration_contract.md`. Created `Docs/Tasks/Status_EXP04_HEAT.md` and `Docs/AgentLogs/Rationale_EXP04_HEAT.md`. This log records the report on disk as required.

Cinematic Cheats used: Steam is specified as HUD warning, tint, alpha strips, wall-column noise, and optional heat haze. Gameplay truth is discrete node state, not particles or volumetric simulation. Fog burn is a temporary local request, not permanent fog deletion.

Exact Microseconds saved: Rejected per-cell heat map estimated at 1024x1024 scan risk per tick. Chosen direct node-link update targets under 20 us per valve action and 0 us/frame idle. Rejected volumetric steam and particle collision; low-tier renderer fallback is text/tint with no new continuous simulation. Telemetry is one fixed ring assignment per recorded transition, target under 3 us per entry when enabled.

Verification update: read-back review found required DOD, risk, Math LOD, debug, fog, visual, and telemetry sections. Scoped `git status --short` shows changes only in the EXP04 folder plus `Status_EXP04_HEAT.md`, `Rationale_EXP04_HEAT.md`, and this log. `npm run build` passed through Vite singlefile output in 715 ms.
