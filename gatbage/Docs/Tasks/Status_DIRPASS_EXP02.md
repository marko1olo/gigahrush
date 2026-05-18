# Status_DIRPASS_EXP02

Agent: DIRPASS_EXP02  
Domain: `Docs/Expansions/02_metro_error_line`  
Task count: 4  
Write scope: EXP02 expansion package plus DIRPASS_EXP02 status/rationale/log only.  
Status: complete.

## Applied Mandates

| Mandate | Evidence |
| --- | --- |
| Scoped docs-only work | No source, root docs, README, desdoc, index or other expansion folder edits. |
| Director data contract | `director_hooks.md` defines data-driven beats, signal provider, conditions, effects and traces. |
| No direct dependencies | Chain slots use ids and optional hooks, not imports from future Archive/404/HELL/market/hospital code. |
| Predictability over realism | Wrong exits require warning stack, deterministic destination override and expected/actual trace entries. |
| Rare tick / zero hot path | Director checks are limited to rare tick, route selection, samosbor start/end, arrival or debug. |
| Cinematic cheat | Metro pressure uses route flags, warnings, closure state, announcements and pocket hooks, not simulated rail networks. |
| Black-box trace | Trace detail and reason codes are specified for chosen/rejected metro beats. |
| Debug falsifiability | Forced route, closure, wrong-exit and trace validation scenarios are listed. |

## Checklist

- [x] Task 1: Read EXP02 package and `00_samosbor_director` contract. DOD practice: extracted facts from `expansion.md`, `content_manifest.md`, `implementation_plan.md`, `integration_contract.md`, plus director expansion/contract. Rejected alternative: infer hook names without reading package. Estimate: 1800 us.
- [x] Task 2: Create `director_hooks.md`. DOD practice: implementation-ready contract with route/wrong-exit/station-closure beats, signals, conditions, effects, cooldowns, chain slots, trace entries and debug validation. Rejected alternative: bullet-only idea dump with no adapter semantics. Estimate: 4200 us.
- [x] Task 3: Update local `integration_contract.md` only where needed. DOD practice: added Director Integration Contract section that points to `director_hooks.md` and constrains future code ownership. Rejected alternative: duplicate the entire hook spec inside integration contract. Estimate: 900 us.
- [x] Task 4: Create status/rationale/log. DOD practice: this file plus `Rationale_DIRPASS_EXP02.md` and `LOG_DIRPASS_EXP02.md` record decisions and scope evidence. Rejected alternative: chat-only report. Estimate: 1100 us.

## Iterative Passes

- [x] Loop 1: Scope pass. Verified write scope and dirty worktree. DOD: no edits outside allowed paths. Rejected alternative: clean or revert unrelated files. Estimate: 400 us.
- [x] Loop 2: Source pass. Read EXP02 and EXP00 contracts. DOD: beat ids and route ids come from existing docs. Rejected alternative: invented station/route set. Estimate: 1800 us.
- [x] Loop 3: Director mapping pass. Mapped director beat shape to EXP02 route, warning and closure lifecycle. DOD: each beat has requires/blocks/effects/debug summary. Rejected alternative: generic "metro can be directed" paragraph. Estimate: 2500 us.
- [x] Loop 4: Integration pass. Added only the minimal Director Integration section to local contract. DOD: future implementer can find source of truth and adapter limits. Rejected alternative: broad rewrite of integration contract. Estimate: 900 us.
- [x] Loop 5: Self-audit pass. Checked that wrong exits require warning ids, station closure cannot trap player and optional chains do not hard depend on missing expansions. DOD: debug validation covers these failure cases. Rejected alternative: assume director will validate later. Estimate: 1200 us.

## Verification

- [x] Docs-only validation: no TypeScript build required because no code changed. DOD practice: check changed paths and content. Rejected alternative: run full build for markdown-only scope while shared source tree is dirty. Estimate: 300 us.
- [x] Scope validation completed. DOD practice: verified scoped status output shows only `Docs/Expansions/02_metro_error_line/`, `Docs/Tasks/Status_DIRPASS_EXP02.md`, `Docs/AgentLogs/Rationale_DIRPASS_EXP02.md` and `Docs/AgentLogs/LOG_DIRPASS_EXP02.md` as touched by this pass. Rejected alternative: rely on memory of edits. Estimate: 300 us.

## Notes For Integrator

EXP02 director hooks deliberately do not require `FloorLevel.METRO`, Archive/404 implementation, HELL transition, global metroworker faction or source-level director adapters. Future implementation should register beats only when the metro route system exists and should fail wrong-exit beats without warning ids.
