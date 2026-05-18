# Status: DIRPASS_EXP04

Agent: DIRPASS_EXP04  
Domain: `Docs/Expansions/04_heatline_zero` director-hook pass  
Task count: 4  
Last updated: 2026-05-17

## Relevant Mandates Used

| Mandate | Source available in this checkout | Applied decision |
| --- | --- | --- |
| Expansion write boundary | User prompt and project instructions | Edited only `04_heatline_zero`, DIRPASS status, rationale, and log files. |
| Director rare tick and registry | `00_samosbor_director` docs | Heatline hooks are beat definitions, signal provider, and adapter requests. |
| Cinematic cheat protocol | Heatline expansion docs | Steam/fog remain visual/request cheats, not fluid simulation. |
| Frame time dictatorship | Heatline/director docs | All hook work is rare tick or event-bound; 0 us/frame steady state. |
| Math LOD scalability | Heatline/director docs | Low/Middle/High/Ultra alter presentation and hook density, not core truth. |
| Black-box trace | Heatline/director docs | Accepted and rejected beats require trace and debug reason codes. |

Registry note: `.agents-skills` is not present in this checkout, so the pass used the project and expansion mandates available on disk.

## Checklist

| Status | Task | Evidence | DOD practice | Rejected alternative | Microsecond estimate |
| --- | --- | --- | --- | --- | ---: |
| [x] | Read Heatline package and Director expansion/contract. | Read `expansion.md`, `content_manifest.md`, `implementation_plan.md`, `integration_contract.md` for heatline; read director `expansion.md`, `content_manifest.md`, `implementation_plan.md`, `integration_contract.md`. | Evidence-based contract extraction before writing. | Guessing generic director hooks without matching existing beat/trace language. | 0 us/frame; documentation read only. |
| [x] | Create `director_hooks.md`. | Added `Docs/Expansions/04_heatline_zero/director_hooks.md`. | Implementation-ready beats with signals, conditions, effects, cooldowns, chain slots, trace, debug validation. | Bullet list of vague integration ideas. | Signal collection target below 5-15 us per rare director tick; 0 us/frame. |
| [x] | Update local integration contract only as needed. | Added Director Integration section to `Docs/Expansions/04_heatline_zero/integration_contract.md`. | Local contract now points to detailed hook doc and defines adapter/effect boundary. | Editing root docs, code, director docs, or other expansion folders. | 0 us/frame; future adapter bounded. |
| [x] | Create status/rationale/log. | Created this status, `Rationale_DIRPASS_EXP04.md`, and `LOG_DIRPASS_EXP04.md`. | Persistent disk memory for context compression and review. | Chat-only report. | 0 us/frame. |

## Verification

| Check | Result |
| --- | --- |
| Write scope | PASS for my changes: edited/created only allowed `04_heatline_zero`, status, rationale, and log paths. `git status` also shows unrelated pre-existing changes outside scope (`README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md`); not touched by this pass. |
| Markdown readback | PASS: read back `director_hooks.md`, local contract section, status, rationale, and log. |
| Code/build | Not run; task explicitly forbids code changes and asks documentation-only director pass. |
