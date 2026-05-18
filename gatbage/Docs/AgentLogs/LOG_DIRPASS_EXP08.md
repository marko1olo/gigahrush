# LOG DIRPASS_EXP08

## 2026-05-17 Director Hook Pass

What was wrong: `Docs/Expansions/08_concentrate_industry` defined factory lines, shift state, supply adapters, samosbor effects and telemetry, but it did not expose an implementation-ready Samosbor Director hook surface. Future code would have to invent private scheduling or let the director mutate production state directly.

What was done: Created `Docs/Expansions/08_concentrate_industry/director_hooks.md` as the industry director contract. It defines a bounded signal provider, beat definitions for work-shift hunger/injury/fear, jammed press, missing inputs, sabotage risk, bad-batch hold/release/divert, clean supply relief and samosbor aftermath variants. It also defines conditions, rejection codes, effect requests, cooldowns, chain slots, trace fields, debug validation and scale rules. Updated `Docs/Expansions/08_concentrate_industry/integration_contract.md` with a Director Integration section. Created `Docs/Tasks/Status_DIRPASS_EXP08.md` and `Docs/AgentLogs/Rationale_DIRPASS_EXP08.md`.

Cinematic cheats used: Factory production remains abstract supply instead of item-stack simulation. Work shifts are aggregate morale/injury/hunger/fear values instead of per-worker director scans. Samosbor contamination is an idempotent event-sequence modifier, not fog-cell sampling. Bad concentrate is a traced quality/supply chain slot, not hidden poisoning logic. Supply relief is price/stock pressure and bounded container output, not live economy simulation.

Exact microseconds saved: Stable frame cost is 0 us because the contract permits director work only on rare tick, event aftermath, contract completion or debug force. Avoided full-world scans, per-NPC worker checks, direct container sampling and repeated samosbor fog inspection; practical savings versus naive implementation are at least several hundred microseconds per director decision and can reach milliseconds on weak hardware. Intended provider cost is one bounded line read, one bounded shift read and compact supply/quality flags.

Validation: Docs-only pass. No TypeScript compile was run because no source files changed.

