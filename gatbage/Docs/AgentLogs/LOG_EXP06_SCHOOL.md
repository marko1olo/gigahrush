# LOG_EXP06_SCHOOL

## 2026-05-17 Expansion 06 Planning Pass

What was wrong: Expansion 06 had a strong base `expansion.md`, but no implementation-grade breakdown for playable MVP, no content manifest, and no integration contract protecting A-Life/pathfinding from crowd-simulation scope creep.

What was done: Created `Docs/Expansions/06_obzh_school/implementation_plan.md` with phased school MVP, DOD, risks, Math LOD and verification matrix. Created `Docs/Expansions/06_obzh_school/content_manifest.md` with rooms, NPC, evacuation groups, lessons, micro-perks, documents, items/containers and debug commands. Created `Docs/Expansions/06_obzh_school/integration_contract.md` with grouped NPC evacuation interfaces, event contract, AI/pathfinding limits, panic model, save/load guidance, debug flow and black-box telemetry contract.

Cinematic Cheats used: Class-sized child movement is represented by `SchoolEvacGroupState` aggregates, route nodes, panic values, cluster sprites and sound/log feedback. No per-child crowd physics. Wet/electric variants use route flags, room risk and light/radio state rather than fluid or electrical simulation.

Exact Microseconds saved: Avoiding per-child BFS for a 12-child class is estimated to save 500+ us in worst active-event cases on low-end hardware. Precomputed route-node advancement targets 35-50 us per low-tier event tick. Micro-perk checks are estimated under 5 us per active event tick. Fixed telemetry write target is about 5 us per active tick. Runtime outside active school event is designed as 0 us except debug/start checks.

Verification: Read relevant sections of `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md`, and full `Docs/Expansions/06_obzh_school/expansion.md`. Local `.agents-skills/` and `Docs/Actual Domains of Project.txt` were absent and recorded. Ran `npm run build`; build passed. Changed files stayed inside assigned write scope.

