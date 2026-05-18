# Status DIRPASS_EXP06

Agent: `DIRPASS_EXP06`  
Domain: `Docs/Expansions/06_obzh_school`  
Task count: 4  
Write scope obeyed: yes  
Source-code edits: none

## Relevant Mandates Used

The repository has no local `.agents-skills/` directory, so the applicable mandates were taken from the supplied AGENTS protocol and project documents:

| Mandate | Application |
| --- | --- |
| Domain boundary | Edited only EXP06 docs and DIRPASS_EXP06 status/rationale/log files. |
| Simultaneous execution | Added director integration through declarative beats, optional providers and adapters; no dependency on unmerged code. |
| Cinematic Cheat Protocol | Bad food and quiet alarm are flags, route pressure and documents, not physical or disease simulation. |
| Frame Time Dictatorship | Director and school provider are rare-tick/event-bound only; target steady state is `0 us/frame`. |
| Math LOD | Hook contract caps signal count and keeps Ultra presentation-only. |
| Black Box | Kept director trace separate from school evacuation telemetry and preserved the future 300-entry dump requirement. |

## Checklist

| Task | Status | DOD practice | Alternative rejected | Microsecond estimate |
| --- | --- | --- | --- | --- |
| 1. Read EXP06 package and Director package | Done | Compared school `expansion.md`, `content_manifest.md`, `implementation_plan.md`, `integration_contract.md` against director `expansion.md`, `integration_contract.md`, `director_hooks.md`. | Relying on prompt summary. | 0 us/frame; docs-only. |
| 2. Create EXP06 `director_hooks.md` | Done | Added implementation-ready beat definitions, signals, conditions, effects, cooldowns, chain slots, trace fields and debug validation. | Bullet list of ideas without registry contract. | 0 us/frame idle; provider cap 16-32 signals on rare tick. |
| 3. Update local `integration_contract.md` if needed | Done | Added narrow Director Integration section and `director` start source so the future adapter has a legal call path. | Editing global director docs or source code. | 0 us/frame; documentation only. |
| 4. Create status/rationale/log | Done | Created this checklist plus rationale and appended final log entry. | Chat-only report. | 0 us/frame. |

## Iteration Notes

| Loop | Check | Result |
| --- | --- | --- |
| 1 | Scope check | Only EXP06 and DIRPASS_EXP06 agent docs are needed. |
| 2 | Director compatibility check | Hook uses registry/provider/effect model and typed rejection reasons from Expansion 00. |
| 3 | School compatibility check | Hook preserves grouped evacuation and local school ownership. |
| 4 | Performance check | No per-frame work, no crowd simulation, no global scans. |
| 5 | Polish check | Contract names debug flows, trace hashes, cooldowns and rejected patterns explicitly. |
