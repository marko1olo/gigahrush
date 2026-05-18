# LOG DIRPASS_EXP07

## 2026-05-17 Director Hook Pass

What was wrong: `07_hospital_quarantine` had a strong medical/quarantine contract, content manifest and implementation plan, but no local director hook document. The existing `integration_contract.md` defined medical events, save tolerance and black-box telemetry but did not state how the Samosbor Director may read hospital facts, request effects, seed chains or trace rejected beats.

What was done: Created `Docs/Expansions/07_hospital_quarantine/director_hooks.md` as an implementation-ready contract. It defines the `hospital_quarantine` signal provider, stable signal vocabulary, condition vocabulary, adapter-owned effects, beat rows, condition/quarantine/morgue/medical-debt handling, samosbor variant hooks, cross-expansion chain slots, cooldown and budget rules, trace fields, debug validation, failure behavior and LOD rules. Updated local `integration_contract.md` with a Director Integration section tying those hooks to existing medical ownership, events, save tolerance and telemetry.

Cinematic Cheats used: Quarantine is flags, service gates, documents and room contamination, not contagion spread. Wet samosbor contaminates one hospital service, not the map. Meat resonance corrupts morgue records, not corpses. Electric aftermath writes false records, not a simulated apparatus network. Medical debt is a capped record/request, not a live economy loop.

Exact Microseconds saved: Runtime code was not changed, so current shipped cost remains 0 us/frame. Future contract savings are explicit: no per-frame director work; no full-world scans; no tile-by-tile infection; no all-NPC medical scan; no corpse/record scan during selection. Target future director signal collection remains scalar/bitmask rare-tick work, estimated under 5-20 us per hospital provider tick on low-end i3/MX350 class hardware, with 0 us/frame steady state.

Files created or updated:

| File | Action |
| --- | --- |
| `Docs/Expansions/07_hospital_quarantine/director_hooks.md` | Created director contract. |
| `Docs/Expansions/07_hospital_quarantine/integration_contract.md` | Added Director Integration section. |
| `Docs/Tasks/Status_DIRPASS_EXP07.md` | Created status checklist and verification note. |
| `Docs/AgentLogs/Rationale_DIRPASS_EXP07.md` | Created decision journal. |
| `Docs/AgentLogs/LOG_DIRPASS_EXP07.md` | Created final disk log. |

Verification: Docs-only pass. No source code, README, root expansion docs, index docs or other expansion folders were edited. No TypeScript compile was run because this task intentionally made no code changes.
