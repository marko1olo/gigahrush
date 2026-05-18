# LOG DIRPASS_EXP06

## 2026-05-17 Director Hook Pass

What was wrong: Expansion 06 had a grouped evacuation contract, lesson/perk data and debug plans, but no director-facing hook contract. The director could not legally schedule school lessons, evacuation drills, bad-food canteen pressure, quiet alarm beats or aftermath documents without inventing source-level coupling.

What was done: Created `Docs/Expansions/06_obzh_school/director_hooks.md` with implementation-ready registry ids, school signal provider contract, five beat definitions, effect adapter payloads, cooldown/max-run rules, chain slots, trace requirements, debug validation flow and rejected patterns. Updated `Docs/Expansions/06_obzh_school/integration_contract.md` with a narrow Director Integration section and a legal `director` start source for future local evacuation requests. Created required status and rationale files.

Cinematic cheats used: Bad food is modeled as canteen pressure, ration flag, rumor and document consequence instead of disease simulation. Quiet alarm is a local school warning/classification branch instead of a global samosbor timer change. Evacuation remains grouped, not per-child AI.

Exact microseconds saved: Steady-state runtime cost remains `0 us/frame` because this is docs-only. Future low-tier provider target is below 50 us per rare director tick by reading cached school aggregates instead of scanning world cells, NPCs or containers. Avoiding per-child evacuation and sickness logic prevents O(group size) hot-path work.

Files changed in allowed scope:

| File | Change |
| --- | --- |
| `Docs/Expansions/06_obzh_school/director_hooks.md` | New director hook contract. |
| `Docs/Expansions/06_obzh_school/integration_contract.md` | Added Director Integration section and `director` evacuation source. |
| `Docs/Tasks/Status_DIRPASS_EXP06.md` | New status checklist. |
| `Docs/AgentLogs/Rationale_DIRPASS_EXP06.md` | New decision journal. |
| `Docs/AgentLogs/LOG_DIRPASS_EXP06.md` | New appended report file. |
