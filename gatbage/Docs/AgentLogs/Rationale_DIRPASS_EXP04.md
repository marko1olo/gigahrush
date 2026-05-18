# Rationale: DIRPASS_EXP04

Date: 2026-05-17  
Domain: `Docs/Expansions/04_heatline_zero`

## Decision 1: Director owns selection, Heatline owns physics truth

Problem: The director needs to trigger pressure/steam/fog moments without becoming a second heat simulation or mutating route state behind the heat system.

Solution: Define heatline director hooks as data-only beats, read-only signals, and declarative effect requests. Pressure, steam damage, fog suppression, noise, and visuals remain heatline or adapter-owned. The director records choice and trace.

Rejected Alternatives: Direct director mutation of pressure nodes, fog cells, routes, or monster attention. That would be faster to write but would duplicate heatline logic, create cross-agent compile dependencies, and make trace lie about the true owner of state.

Scalability potential: Low uses text traces and cached signals. Middle adds pressure/fog adapter requests. High adds chain consumers and NPC barks. Ultra spends only on presentation: richer steam visuals, alarm audio, and trace variety.

Hardware Impact: On low-end silicon such as i3/MX350, steady-state cost remains 0 us/frame because hooks run only on director tick or event aftermath. Accepted beat overhead is estimated under 15 us with bounded signal/effect payloads.

## Decision 2: Fog burn is relief, not victory

Problem: Heatline can counter samosbor fog, but a director-selected steam beat could accidentally become a global cleanse or a free safe route.

Solution: `heat_fog_burn_window_offer` emits one temporary `heatline_fog_burn_request` with radius `2..4`, duration `45..90` seconds, and explicit `suppress_only` semantics inherited from the heatline contract. Trace text states this is borrowed time, not cleansing.

Rejected Alternatives: Director changing zone ownership, clearing samosbor state, or raising a permanent route flag. That standard shortcut would be too powerful and would make the heatline expansion invalidate samosbor pressure.

Scalability potential: Low uses HUD text and a local marker. Middle applies bounded fog suppression. High lets later systems produce backlash chain steps. Ultra adds visual overkill only: dense steam, heat haze, condensation, and sound layering.

Hardware Impact: The fog adapter clamps affected cells or room modifier count, estimated below 15 us on accepted beat and 0 us/frame while inactive. Cheap devices avoid per-cell fog scans.

## Decision 3: Chain slots are optional and expiring

Problem: Heatline has natural links to hospital, raionsovet, market, monsters, and 404, but those systems may be unavailable or in parallel development.

Solution: Define chain slots such as `steam_burn_paper_chain:injury` and `steam_fog_backlash_chain:burn_window` as director-owned state with TTL. Missing consumers produce `chain_consumer_missing` trace and expire cleanly.

Rejected Alternatives: Direct imports from hospital, raionsovet, market, monster AI, or 404 code. Standard Unity-style direct references would be brittle in this repo and violate the stated parallel-agent workflow.

Scalability potential: Low ignores consumers and keeps trace. Middle consumes one or two chains. High links social consequences and faction pressure. Ultra adds more unique lines, not more coupling.

Hardware Impact: Chain state is a few bounded records inside director save/trace state. Estimated cost is below 5 us on chain update, with no frame cost.

## Decision 4: Debug validates rejections as much as accepted hooks

Problem: Director bugs are invisible if only successful beats appear in the log. Heatline pressure/fog hooks can be rejected for safe reasons that testers must see.

Solution: `director_hooks.md` requires concrete rejection reasons for every condition and debug checks for forced beats, missing adapters, trace output, and fog expiry. Accepted and rejected candidates must include heatline details in trace/debug summary.

Rejected Alternatives: A generic `failed` or `not applicable` debug result. That hides whether the block was cooldown, missing provider, unsafe retreat, wrong floor, missing fog, or depleted budget.

Scalability potential: Low debug is text-only. Middle includes node/room pressure detail. High and Ultra add richer trace sink presentation while preserving the same bounded trace model.

Hardware Impact: Debug and trace are event-bound. One trace write is a fixed assignment in the director ring buffer; estimated below 3 us per recorded entry.

