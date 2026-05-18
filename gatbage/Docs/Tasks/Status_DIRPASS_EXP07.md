# Status DIRPASS_EXP07

Agent: DIRPASS_EXP07  
Domain: `Docs/Expansions/07_hospital_quarantine`  
Task count: 4  
Write scope: local expansion package plus this status file and DIRPASS_EXP07 agent logs.

## Preflight

Relevant mandates applied: docs-only scope discipline; director rare tick only; no source edits; no direct dependency on unfinished systems; cinematic fakes over disease simulation; bounded signal providers; cooldowns and typed trace; Math LOD across Low/Middle/High/Ultra; debug validation as Definition of Done.

Missing mandate sources: repository-local `.agents-skills/` and `Docs/Actual Domains of Project.txt` were not present in this checkout. The task-supplied write scope and local `AGENTS.md` are the operative domain boundary.

## Checklist

| Task | State | Evidence and DOD practice | Rejected alternative | Estimate |
| --- | --- | --- | --- | ---: |
| 1. Read hospital package and director package | Done | Read `07_hospital_quarantine/{expansion,integration_contract,content_manifest,implementation_plan}.md` and `00_samosbor_director/{expansion,integration_contract,director_hooks}.md`; used package facts instead of guessing. | Reading unrelated expansion designs as requirements; it risks cross-agent contamination. | 0 us runtime |
| 2. Create `director_hooks.md` | Done | Added implementation-ready director contract covering conditions, quarantine, morgue, medical debt, signals, effects, cooldowns, chain slots, trace entries and debug validation. | Generic bullet brainstorm or hidden scheduler prose. | 0 us runtime |
| 3. Update local `integration_contract.md` only if needed | Done | Added a Director Integration section because the existing contract had events/save/telemetry but no explicit director boundary. | Editing root docs, source code, README, expansion index or director package. | 0 us runtime |
| 4. Create status/rationale/log | Done | Created this status file, `Rationale_DIRPASS_EXP07.md`, and `LOG_DIRPASS_EXP07.md`. | Reporting only in chat. | 0 us runtime |

## Iteration Log

| Loop | Check | Result |
| --- | --- | --- |
| 1 | Scope and source-of-truth read | Confirmed write scope and read hospital/director packages before editing. |
| 2 | Beat coverage readback | Verified condition, quarantine, morgue, medical debt and samosbor variant beats have explicit requires/effects/cooldowns. |
| 3 | Cross-chain readback | Verified slots exist for heatline burn paperwork, quarantine paperwork, treatment debt, wet infection aftermath and meat morgue swap. |
| 4 | Non-interference readback | Verified effects are adapter requests and do not claim direct HP, save, global service, item, pathfinding or samosbor control. |
| 5 | Debug/trace readback | Verified every major beat family has force/debug proof and trace fields for accepted/rejected candidates. |

## Verification

Docs-only pass. No TypeScript compile was run because no source, package, README, root expansion, index or generated build files were edited.
