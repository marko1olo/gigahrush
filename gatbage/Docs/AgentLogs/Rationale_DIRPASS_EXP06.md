# Rationale DIRPASS_EXP06

## Decision 1: Director integration as declarative hook contract

Problem: The school expansion needed director linkage without source edits or direct dependency on unfinished director code.

Solution: Added `director_hooks.md` with static beat definitions, a bounded signal provider contract and optional effect adapter payloads. This follows the director registry pattern and keeps missing integrations as typed rejection results.

Rejected Alternatives: Direct imports from school into director or director into school were rejected because 20+ agents are working in parallel and unmerged modules cannot be assumed. A prose-only list of possible events was rejected because it would not be implementation-ready.

Scalability potential: Low uses five beat definitions and up to 16 signals. Middle adds cross-expansion pressure signals. High adds richer aftermath selection. Ultra spends budget on presentation lines/audio/visuals, not larger logic.

Hardware Impact: On low-end silicon such as i3/MX350, idle cost remains `0 us/frame`; rare director tick school signal collection should stay below 50 us because it reads cached aggregate flags only.

## Decision 2: Bad food as flag and social consequence, not simulation

Problem: The school canteen needs to connect to industry/market bad concentrate without creating disease, digestion or per-NPC inventory state.

Solution: Modeled bad food as `school.bad_food_pressure`, `flag_school_bad_food_batch`, optional rumor and aftermath document. It can modify ration/panic decisions later but remains a cinematic fake.

Rejected Alternatives: Per-child sickness rolls, food poisoning simulation and container-wide item rewrites were rejected as slow, exploit-prone and outside the director pass.

Scalability potential: Low shows one canteen warning. Middle links market/industry chain pressure. High adds parent/faction reaction. Ultra adds richer canteen props, barks and documents while preserving the same flag logic.

Hardware Impact: Estimated gain versus per-NPC sickness simulation is avoiding O(children/NPC) updates entirely; runtime cost stays event-bound and effectively 0 us/frame idle.

## Decision 3: Quiet alarm as local school warning, not samosbor timer mutation

Problem: The school should react to quiet/silent samosbor pressure, but the director must not alter global samosbor timing or own the alarm system.

Solution: Added `school.alarm.quiet_radio` with payload `arm_school_silent_alarm`. The school adapter may arm a local silent/false alarm branch and radio classification while global samosbor remains untouched.

Rejected Alternatives: Changing global samosbor frequency, forcing variants, or adding a director-owned alarm timer were rejected because they violate non-interference and would couple EXP06 to global systems.

Scalability potential: Low creates a delayed warning. Middle uses radio readiness to classify false/silent alarms. High ties outcome to documents and parent pressure. Ultra improves audio/radio presentation only.

Hardware Impact: No frame cost. Future local alarm state is a compact flag read on school event ticks; no world scan.

## Decision 4: Separate director trace from school black-box telemetry

Problem: Director trace explains selection, but school evacuation telemetry explains execution. Combining them would blur ownership and either over-log or under-debug failures.

Solution: The hook requires director trace fields for chosen/rejected beat, budgets and hashes, while preserving `SchoolEvacTelemetryEntry[300]` for future evacuation state and dump path `Docs/AgentLogs/Dump_EXP06_SCHOOL.bin`.

Rejected Alternatives: Using only director trace was rejected because it cannot explain route state, panic and group counts after selection. Using school telemetry for director decisions was rejected because it would not cover cooldowns and rejected candidates.

Scalability potential: Low trace records selection only. Middle/High add chain ids and signal hashes. Ultra keeps the same trace cap and improves debug formatting.

Hardware Impact: Fixed 300-entry rings prevent allocation churn. Trace writes happen on rare ticks/events, not render frames.
