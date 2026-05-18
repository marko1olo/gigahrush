# LOG_DIRPASS_EXP01

## 2026-05-17 Director-Hook Pass

What was wrong: `01_mushroom_shift` already had a strong production-system contract, but it had no explicit hook surface for `00_samosbor_director`. Future implementers could have invented local cooldowns, private scheduler logic, or direct director access to farm internals.

What was done: Created `Docs/Expansions/01_mushroom_shift/director_hooks.md` with implementation-ready DirectorBeatDef candidates, signal provider facts, conditions, blocks, adapter effects, cooldown groups, chain slots, trace requirements, debug validation, Math LOD, and non-interference rules. Updated `Docs/Expansions/01_mushroom_shift/integration_contract.md` with a focused Director Integration section pointing to the hook file.

Cinematic cheats used: Director effects are rumors, ration claims, market price flags, sanitary notices, cult/science hints, trace records, and delayed theft risk. No airborne spores, no cell biology, no per-frame NPC pressure scans, no global door control, no director-owned inventory mutation.

Exact microseconds saved: Avoiding per-frame director/farm polling preserves the target 0 us/frame steady state. Bounded signal collection saves an estimated 100-700 us on director ticks versus scanning rooms/NPCs for farm context. Room-level event facts save an estimated 50-200 us during crowded social frames compared with reconstructing reactions from live NPC scans. Cooldown-key filtering costs an estimated under 10 us per director candidate set. Trace write cost is estimated at 5-30 us per selected/rejected beat.

Verification: Scope verified with `git status --short`. Compile was not run because this pass changed markdown only and the user explicitly requested no source code changes.

Files created or changed:

| File | Action |
| --- | --- |
| `Docs/Expansions/01_mushroom_shift/director_hooks.md` | Created. |
| `Docs/Expansions/01_mushroom_shift/integration_contract.md` | Added Director Integration section. |
| `Docs/Tasks/Status_DIRPASS_EXP01.md` | Created status/checklist. |
| `Docs/AgentLogs/Rationale_DIRPASS_EXP01.md` | Created decision journal. |
| `Docs/AgentLogs/LOG_DIRPASS_EXP01.md` | Created final log. |

Protected files untouched: source code, `README.md`, `desdoc.md`, root expansion docs, `Docs/Expansions/INDEX.md`, and other expansion folders.
