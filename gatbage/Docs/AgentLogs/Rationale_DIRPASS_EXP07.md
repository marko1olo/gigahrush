# Rationale DIRPASS_EXP07

## Decision 1: Hospital hooks expose medical facts, not medical authority

Problem: The director needs to pace hospital consequences, but medical condition state, treatment services, quarantine flags and morgue records belong to Expansion 07.

Solution: `director_hooks.md` defines the director as a selector of beats and adapter requests. Hospital-owned systems validate treatment, quarantine, records and debts before any mutation. The director writes trace and chain state only.

Rejected Alternatives: Direct director healing, direct condition application and direct quarantine clearing were rejected because they would duplicate medical runtime and violate non-interference. A separate hospital scheduler was rejected because it would compete with the campaign director.

Scalability potential: Low uses player condition flags, one room flag and one record. Middle adds sanitar checks and service windows. High consumes partner signals from heatline, market, raionsovet and mushroom systems. Ultra spends budget on richer hospital presentation while finite logic stays unchanged.

Hardware Impact: Steady-state impact is 0 us/frame. Signal collection reads cached scalar/bitmask facts on rare director tick; on i3/MX350 class hardware this avoids full-room, full-NPC and full-record scans.

## Decision 2: Quarantine is modeled as access pressure, not contagion

Problem: Hospital quarantine must matter without becoming cell-by-cell infection spread or global service lockdown.

Solution: Quarantine beats use `quarantine_mark`, severity, sanitar failure, local room contamination and clearance-route signals. Effects request one local gate, one quarantine notice, one contaminated hospital room or one clearance route with cost.

Rejected Alternatives: Full-map infection propagation, global trade/metro/school locks and automatic sanitar combat were rejected as expensive, brittle and outside hospital ownership. Decorative quarantine with no gate was rejected because it fails the expansion purpose.

Scalability potential: Low is one mark and one gate. Middle adds clear/fake/wait branches. High lets partner systems consume quarantine paperwork. Ultra adds richer warnings and visual contamination without broader simulation.

Hardware Impact: Quarantine decisions are scalar checks and room flags. Local contamination expiry is bounded; no pathfinding or tile-spread cost is introduced.

## Decision 3: Morgue hooks reveal records, not loot or waves

Problem: The morgue needs director relevance, especially under meat/electric variants, without turning into combat spawning or a free medical stash.

Solution: Morgue beats reveal one contradiction, scramble one record or write one impossible death/monitor trace. The loot budget remains explicit and outside director effects.

Rejected Alternatives: Zombie waves, random corpse loot and global NPC identity rewrites were rejected because they break tone, performance and ownership. Pure flavor notes were rejected because they lack mechanical consequence.

Scalability potential: Low reveals one wrong card. Middle adds meat record swap. High connects contradictions to archive/404 chains. Ultra adds richer ambience, not broader record corruption.

Hardware Impact: One record id/hash per beat is cheap. No corpse scanning or combat spawn pressure is required on low-end devices.

## Decision 4: Treatment debt is a bounded bridge to economy

Problem: Hospital treatment should create consequences, but debts and contracts may belong to market/economy systems that may be absent during parallel work.

Solution: Hospital creates a capped local medical debt request and optionally asks the market adapter to convert it into a contract or pressure beat. Missing partner adapters are traced and do not break local treatment.

Rejected Alternatives: Direct market debt mutation was rejected because Market88 owns illegal debt lifecycle. Ignoring treatment cost was rejected because the expansion explicitly wants medical debt and documents.

Scalability potential: Low writes one debt note. Middle adds capped debt severity. High routes debt into market/industry/school supply chains. Ultra adds richer trader/hospital lines through the same slot ids.

Hardware Impact: Debt state is capped and event-driven. No live economy scan or per-frame debt maturation is introduced.

## Decision 5: Samosbor hospital hooks stay local and variant-specific

Problem: Hospital should react to classic, quiet, wet, electric and meat samosbor variants without taking over samosbor scheduling.

Solution: Variant beats are local: classic overloads reception, quiet delays admissions, wet contaminates one service, electric writes one false record, meat swaps one morgue record. The director only chooses legal aftermath hooks and records trace.

Rejected Alternatives: Changing samosbor timers, global door rules, tile contamination, apparatus simulation and corpse-wave combat were rejected as cross-domain control and frame-time risk.

Scalability potential: Low ships wet and meat hooks first. Middle adds classic queue. High adds electric/quiet records. Ultra increases feedback density while keeping one local hook per aftermath.

Hardware Impact: One local hook per aftermath has no frame cost. The logic reads last variant and cached hospital flags, then applies one bounded adapter request.

## Decision 6: Trace and debug are contract requirements

Problem: Director-driven medical consequences can feel arbitrary unless accepted and rejected choices are inspectable.

Solution: The hook contract requires trace fields for beat ids, reason codes, budgets, condition hash, quarantine severity, room/record/debt detail and effect result. Debug must force every major beat family and show provider status.

Rejected Alternatives: Human-only prose and chat-only reporting were rejected because they cannot support black-box debugging or future implementation validation.

Scalability potential: Low debug prints text. Middle/High route entries through director trace and medical telemetry. Ultra can add richer world-log lines while keeping the same audit data.

Hardware Impact: Trace is bounded at 300 entries by director contract and medical telemetry is fixed-size. No unbounded logs or formatted gameplay-loop work are required.
