# LOG: DIRPASS_EXP04

## 2026-05-17 Director-Hook Pass

What was wrong: `04_heatline_zero` had a strong local heat-node, steam, fog, debug, and telemetry contract, but no explicit binding to `00_samosbor_director`. Without that binding, future code would either ignore heatline in campaign pacing or let director mutate heat/fog state directly.

What was done: Created `Docs/Expansions/04_heatline_zero/director_hooks.md` with a concrete heatline director contract: signal provider, condition vocabulary, effect vocabulary, six beat definitions, cooldowns, chain slots, trace requirements, debug validation, LOD behavior, and implementation DOD. Updated local `integration_contract.md` with a Director Integration section that points to the hook doc and defines the adapter boundary. Created persistent status and rationale files for `DIRPASS_EXP04`.

Cinematic Cheats used: Steam remains a readable room/route request, not simulated fluid. Fog burn is temporary local suppression, not permanent cleanse. Pressure aftermath is a warning and adapter request, not random pipe physics. Ultra-tier cost buys visuals/audio/traces only, not new simulation truth.

Exact Microseconds saved: Director steady-state remains 0 us/frame because heatline hooks are rare tick, aftermath, or debug only. Signal collection target is below 5 us on low tier from cached fields. Accepted warning/pressure/debug beats are estimated below 5-8 us. Accepted fog burn request is estimated below 15 us because the adapter clamps radius or room modifier count. Trace write remains a fixed ring-buffer assignment estimated below 3 us.

Files changed: `director_hooks.md`, local `integration_contract.md`, `Status_DIRPASS_EXP04.md`, `Rationale_DIRPASS_EXP04.md`, `LOG_DIRPASS_EXP04.md`.
