# LOG_DIRPASS_EXP02

## 2026-05-17 - Director Hook Pass For EXP02

What was wrong: `Docs/Expansions/02_metro_error_line` had strong route/runtime planning but no dedicated contract for `00_samosbor_director`. Route offers, station closure, warning stacks, wrong exits, cross-expansion chain payloads and director trace validation were implicit.

What was done: Added `Docs/Expansions/02_metro_error_line/director_hooks.md`. It defines the EXP02 signal provider, director beat catalog, cooldowns, max runs, conditions, effects, chain slots, trace metadata, reason codes, debug validation and performance contract. Updated local `integration_contract.md` with a concise Director Integration Contract section that points future implementation to `director_hooks.md` and prohibits direct route mutation, permanent floor creation, large NPC spawning and bypassing metro validation.

Cinematic Cheats used: Route pressure is represented by hints, warning ids, station closure flags, announcements, documents, pocket destinations and deterministic overrides. No simulated rail network, no per-frame station scan, no NPC migration through tunnel cells.

Exact Microseconds saved: Estimated steady-state savings versus a naive director polling metro routes each frame is full hot-path elimination: 0 us/frame target instead of continuous scans. Event-bound costs are specified as 10-60 us depending on beat/effect. Wrong-exit resolution is constrained to arrival, station closure to samosbor/director events, and route offers to rare ticks.

Files created:

- `Docs/Expansions/02_metro_error_line/director_hooks.md`
- `Docs/Tasks/Status_DIRPASS_EXP02.md`
- `Docs/AgentLogs/Rationale_DIRPASS_EXP02.md`
- `Docs/AgentLogs/LOG_DIRPASS_EXP02.md`

Files updated:

- `Docs/Expansions/02_metro_error_line/integration_contract.md`

Key decisions:

- Wrong exit is a warning-first chain: warning stack before destination override.
- Station closure has a hard no-trap validation condition.
- Optional Archive/404/HELL links are chain slots and fallback paths, not direct dependencies.
- Director effects call future metro adapters and return reason-coded results.
- Debug validation must fail forced wrong exits without warnings and closures without fallback.
