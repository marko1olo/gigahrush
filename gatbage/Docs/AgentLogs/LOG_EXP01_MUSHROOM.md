# LOG_EXP01_MUSHROOM

## 2026-05-17 Documentation Pass

What was wrong:

The existing `Docs/Expansions/01_mushroom_shift/expansion.md` described the direction correctly but did not provide the three implementation handoff artifacts requested for parallel-agent work. It lacked a phased MVP execution plan, a stable content manifest, and a narrow integration contract defining how Mushroom Shift should consume future shared systems without blocking on them or duplicating them.

What was done:

Created `Docs/Expansions/01_mushroom_shift/implementation_plan.md`. It defines the playable MVP as a room-level production loop inside existing `LIVING`, `MAINTENANCE`, `KVARTIRY`, and market content. It includes phased implementation, DOD, risks, Math LOD low/middle/high/ultra, tests, and the rule that HYDROPONICS remains a later pocket/floor-instance after the MVP proves the loop.

Created `Docs/Expansions/01_mushroom_shift/content_manifest.md`. It defines stable proposed IDs for rooms, NPCs, items/resources, eight strains, documents, events, quest beats, and debug commands. The manifest is technical and scoped to the production loop, not a loose idea pile.

Created `Docs/Expansions/01_mushroom_shift/integration_contract.md`. It defines future runtime files, expected shared interfaces, fallbacks when events/economy/containers/NPC memory are absent, farm state API shape, samosbor effect mapping, debug/telemetry requirements, and parallel-agent safety rules.

Created `Docs/Tasks/Status_EXP01_MUSHROOM.md` with checklist, DOD justifications, rejected alternatives, microsecond estimates, missing registry/domain-file notes, and final state.

Created `Docs/AgentLogs/Rationale_EXP01_MUSHROOM.md` with decision journaling for non-trivial choices: existing-floor MVP, room-level farm state, structured events with local fallback, stable content IDs, debug-first MVP testing, four-tier Math LOD, and no compile run for a docs-only pass.

Cinematic Cheats used:

The plan replaces biological simulation with room-state flags, phase textures, sprite racks, lamp color changes, HUD messages, documents, bounded event rolls, and social consequences. Wetness, mold, meat resonance, PSI mutation, and production pressure are represented as cheap state transitions and visual/audio fakes. No particle spore simulation, no per-tile mold automata, no individual mushroom entity swarm.

Exact Microseconds saved:

Room-level farm state instead of per-mushroom entities: estimated 100-500 us saved in dense farm scenes on low-end i3/MX350 class hardware, with ordinary frames at 0 us farm cost when no coarse tick is due.

Slow farm tick instead of per-frame growth scan: estimated 50-300 us saved in normal play depending on farm count, because update cost is O(active farms due for tick), not O(world rooms/tiles).

Event-driven NPC reactions instead of NPC-farm cross scan: estimated 50-200 us saved during crowded social frames.

Static visual cheats instead of airborne spore particles: estimated 100-400 us saved in wet/moldy rooms, plus avoided memory churn.

No docs-only build run: runtime impact 0 us; avoided unrelated wall-clock build noise while preserving future build requirement for code phases.

Verification:

Read required source documents: `README.md`, relevant `desdoc.md` sections, root `expansion.md`, `Docs/Expansions/INDEX.md`, and `Docs/Expansions/01_mushroom_shift/expansion.md`.

Checked for mandated local files. `.agents-skills/` and `Docs/Actual Domains of Project.txt` were absent in this checkout, so mandates were derived from the supplied instructions and available project docs.

No code files, `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md`, or other expansion folders were edited by this pass. `git status --short` shows unrelated pre-existing modifications/untracked files in protected/root and other expansion areas; they were left untouched.
