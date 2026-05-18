# AG24 Monster Ecology Rationale

## Decision 0 - Ecology As Data

Problem: Existing monsters had behavior and variants, but floor identity lived in scattered spawn lists.

Solution: Add `src/data/monster_ecology.ts` as a data-only table for all 22 monster kinds. Each row owns floors, preferred rooms, variant ids, spawn weight, counterplay, loot hint, rumor ids, and rare existing-item drops.

Rejected Alternatives: Adding more monsters would dilute the existing set. Encoding ecology in AI or generators would create content-specific shared-system branches.

Hardware Impact: Static table cost is 0 us/frame. Selection scans 22 rows only during samosbor spawn calls, which already run on event/slow cadence.

## Decision 1 - Samosbor Spawn Integration

Problem: The samosbor wave list was one global progression, so floors did not express monster ecology.

Solution: Replace the local hardcoded wave picker in `systems/samosbor.ts` with `chooseFloorMonsterKind()`. Corridor, random-map, and fog spawns now use current floor, samosbor count, and a small rare allowance.

Rejected Alternatives: Rewriting floor generators or monster AI would exceed scope and risk broad churn. Room-level spawning can use the same helper later without changing the API.

Hardware Impact: Each spawn selection is a 22-row weighted pass. No per-frame scan was added.

## Decision 2 - Loot As Hints And Optional Helper

Problem: The task asks for loot identity, but the project forbids a new inventory system and heavy per-kill generation.

Solution: Store rare drops as existing item ids with low chances and expose `chooseMonsterRareDrop()`. Current AG24 gameplay records loot hints in kill event data; it does not force new per-kill item spawning.

Rejected Alternatives: Directly adding drops to every monster death would touch `main.ts`, increase hot combat responsibilities, and duplicate existing variant-drop work.

Hardware Impact: No new kill-time loot generation is active. Event enrichment copies compact static hints only when existing kill events are published.

## Decision 3 - Kill Events Carry Ecology

Problem: Rare monster kills should be visible to event consumers without changing combat.

Solution: `systems/events.ts` enriches existing `player_kill_monster` and `npc_kill_monster` drafts when `monsterKind` is present. It adds ecology tags/data and raises rare monster kills to severity 4.

Rejected Alternatives: Editing combat call sites in `main.ts` would exceed the declared AG24 owned files. A new event bus would duplicate `systems/events.ts`.

Hardware Impact: Work is event-bound and compacted by the existing event sanitizer. There is no render or AI-loop cost.

## Decision 4 - Rumor Coverage

Problem: Existing rumors covered several classic monsters but not all current ecology/counterplay identities.

Solution: Add 22 compact ecology rumors, one per current monster kind, and reference them from the ecology table.

Rejected Alternatives: Adding many generated lines per monster would bloat the catalog and weaken selection. A live rumor spread simulation would violate the bounded-memory pattern already in place.

Hardware Impact: Rumor selection already scans a static catalog on talk only. The added rows increase interaction-time selection only, not frame cost.
