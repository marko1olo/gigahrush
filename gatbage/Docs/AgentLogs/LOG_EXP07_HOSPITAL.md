# LOG_EXP07_HOSPITAL

## 2026-05-17 EXP07 Hospital Quarantine Documentation Pass

What was wrong:

Expansion 07 had only the base `expansion.md`. It defined the fantasy and MVP direction, but it did not yet provide implementation-ready phasing, a concrete content manifest or a save/load-safe integration contract. The local `.agents-skills/` registry and `Docs/Actual Domains of Project.txt` were absent in this checkout, so mandate compliance had to be documented from direct filesystem evidence and the user-provided instruction block.

What was done:

Created `Docs/Expansions/07_hospital_quarantine/implementation_plan.md` with a phased hospital quarantine MVP: contract gate, finite conditions, LIVING pocket, quarantine/sanitar checks, records/morgue and samosbor variant hooks. The plan includes DOD, risks, tests/checks and low/middle/high/ultra Math LOD.

Created `Docs/Expansions/07_hospital_quarantine/content_manifest.md` with explicit medical states, rooms, NPC, medcards, medicines, morgue entries and debug commands. MVP content is separated from reserved later content. Morgue loot budget is capped.

Created `Docs/Expansions/07_hospital_quarantine/integration_contract.md` with finite TypeScript-facing interfaces for condition definitions, active statuses, quarantine status, treatment services, medical records, events, save/load tolerance and black-box telemetry.

Created `Docs/Tasks/Status_EXP07_HOSPITAL.md` and `Docs/AgentLogs/Rationale_EXP07_HOSPITAL.md`. This LOG was appended as the final file-based report.

Cinematic Cheats used:

Disease is modeled as finite condition ids with bounded active arrays, not pathogen simulation.

Quarantine is modeled as access flags and rare events, not cell-by-cell spread through the 1024x1024 torus.

The morgue is a record contradiction system with fixed loot budget, not a combat arena or free medicine cache.

Hospital MVP is a compact `LIVING` pocket, not a new permanent floor.

Samosbor hospital responses are local variant hooks: wet infection risk and meat-resonance record corruption first, not global rule rewrites.

Exact Microseconds saved:

Avoiding per-cell contagion over the 1024x1024 world saves unbounded millisecond-scale scans; target replacement cost is under 80 us for active pocket checks on weak hardware.

`hasCondition` is designed for under 5 us via bounded arrays.

`canUseService` is designed for under 20 us via small service checks.

Rare player condition tick is designed for under 40 us.

Pocket room status tick is designed for under 80 us.

Black-box telemetry write is designed for under 5 us per entry.

Compile verification:

`npm run build` passed. Vite produced `dist/index.html` at 720.73 kB, gzip 222.56 kB, built in 795 ms.

Scope verification:

No code files were edited by this pass. No intentional edits were made to `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md` or other expansion folders. Git status shows those files have unrelated existing changes in the shared worktree; they were not touched for EXP07.
