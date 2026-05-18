# Status_ORCHESTRATOR_ITERATION2

Date: 2026-05-17  
Scope: refresh active agent prompt queue for iteration 2.

## Source Read

- Read `README.md` as shipped implementation map.
- Read `architecture.md` for layer and parallel ownership rules.
- Read `desdoc.md` iteration priorities, especially shooter readability, monster counterplay, contracts, samosbor, loot/containers, floor roles, A-Life and smoke.
- Read first-wave status/log headings and key completion notes.
- Read implementation surfaces in `src/core`, `src/data`, `src/gen`, `src/systems`, `src/render`, `tests`, and `scripts`.

## Decision

The old `Docs/AgentPrompts/AGENT_01..30` files were first-wave work prompts. Their results are already represented by code, README facts, `Docs/Tasks/Status_AG*.md`, and `Docs/AgentLogs/LOG_AG*.md`.

Active prompt queue now uses `AGENT_31..60` for iteration 2. Historical task/status/log files were preserved.

## New Prompt Lanes

- AG31-33: shooter HUD, weapon roles, projectile/impact feedback.
- AG34-35: monster counterplay data and encounter reachability.
- AG36-37: samosbor warning and aftermath.
- AG38-40: contracts, routing, theft witnesses.
- AG41-44: production/container and Living expedition loops.
- AG45-47: Ministry document/combat-prep roles.
- AG48-49: Kvartiry scarcity/social conflict.
- AG50-52: Maintenance repair/water/pressure expeditions.
- AG53-55: Hell and Void late-game encounters.
- AG56-58: rumors, faction residue, ARPG stats.
- AG59-60: smoke scenario and integration QA/README.

## Verification

- Active prompt files: 30.
- File range: `Docs/AgentPrompts/AGENT_31_*.md` through `Docs/AgentPrompts/AGENT_60_*.md`.
- Each active prompt has one `<AGENT_PROMPT id="...">` block and one `<POLISH_MANDATE>`.
- First `npm run typecheck` exposed pre-existing strict errors in untracked `src/gen/procedural_floor.ts`: unused `anomalyById` import and unused `world` parameter.
- Fixed only those two no-behavior TypeScript issues: removed unused import and renamed parameter to `_world`.
- Final `npm run typecheck`: passed.
- Final `npm run check`: passed. Unit tests passed, Vite build passed, smoke passed with `hudLit=36864`, `webglLit=1024`.
