# A-Life Population

Persistent A-Life is a central game feature of ГИГАХРУЩ: the building is not a spawn faucet, it is inhabited.

The player does not enter an empty procedural map that slowly fills itself. The population already exists. Entering a floor activates the slice of that population assigned to that floor; leaving the floor freezes it. Killing someone removes that person from the global population forever.

## Design Goal

The final design target is:

- Up to `1_000_000` procedural NPC identities per run when runtime memory allows it.
- `100_000` procedural NPC identities as the fallback floor for constrained browsers.
- Every ordinary NPC has a stable identity, floor assignment, faction, occupation, level, inventory, family/friend graph, rank state, quest potential and death state.
- Quest NPCs are part of the same identity model instead of being a separate magical category.
- Only the active floor is materialized into live `entities`.
- Off-floor NPCs do not pathfind, fight, tick needs or run frame AI.
- The player can theoretically depopulate the Khrushchev block. The count goes down, not back up to a target cap.

Current shipped baseline:

- `src/systems/alife.ts` creates a compact in-memory pool of `1_000_000` procedural NPC records on browsers with enough heap, otherwise `100_000`.
- Records are distributed across story floors, routed design floors and the per-run procedural floor deck.
- Live `entities` still contain only the active floor.
- Generator-owned ambient NPCs become placement templates; A-Life records are materialized into those slots.
- `alifeId` and `persistentNpcId` identify materialized procedural NPCs.
- `plotNpcId` deaths are tracked by A-Life so killed named NPCs do not reappear on later generation.
- Materialized A-Life NPCs carry personal `playerRelation`; AI hostility checks it before falling back to faction hostility.
- Browser saves store A-Life seed, total population, dead ids, dead plot ids and bounded changed-record overrides. Full live entities are not serialized.

## Core Rule

There is no ordinary background refill.

Allowed population creation:

- Initial run creation of the A-Life identity pool.
- Floor generation producing geometry and ambient placement templates.
- Materialization of existing A-Life records when the player enters or rebuilds a floor.
- Explicit authored/event spawns: samosbor, quest waves, lift encounters, hack backlash, emergency responses, caravans and scripted consequences.

Forbidden population creation:

- Timed refill-to-cap for ordinary NPCs.
- Monster refill just because the monster count dropped.
- Silent replacement of a killed persistent NPC by another persistent NPC in the same materialized slot.
- Generator code that invents ordinary ambient NPC identity after A-Life materialization.

Event actor policy:

- If an event spawns an ordinary person who can survive beyond the event, that person should reserve or receive a persistent identity.
- If an event spawns temporary pressure, the actor must stay scoped to that event and must not count as population refill.
- Faction reinforcements, caravans and evacuees are migrations or authored arrivals, not hidden replacement of dead residents.

If a system needs a person, it should first ask whether that person is:

- An existing persistent A-Life NPC.
- A named authored `plotNpcId` NPC.
- A temporary event actor with a bounded event reason.

## Mental Model

```txt
Run start
  -> create A-Life identity pool
  -> distribute identities by floor route key

Enter floor
  -> generate world geometry and content
  -> use generated ambient NPCs as placement templates
  -> remove those template NPCs
  -> materialize live NPC entities from the floor's A-Life slice
  -> run existing AI/combat/quests/trade exactly as before

Leave floor / rebuild / save
  -> fold live A-Life entity state back into records
  -> keep current-floor player/runtime state
  -> freeze all off-floor records

NPC death
  -> mark A-Life record dead
  -> drop inventory into current floor
  -> never materialize that identity again
```

The system is deliberately cinematic and data-oriented. Off-floor life is represented by compact facts and slow aggregate state, not invisible per-NPC simulation.

## Identity Fields

An A-Life record should be able to answer:

- Who is this person?
- Where do they belong?
- What can they do when materialized?
- What happened to them permanently?

Current fields:

- `id`: stable numeric A-Life id.
- `floorKey`: story/design/procedural route key.
- `floor`: base `FloorLevel`.
- `faction`: current faction.
- `occupation`: runtime sprite/role.
- `name`, `female`: display and grammar.
- `familyId`: current compact family grouping.
- `canGiveQuest`: active/authored quest affordance; persistent A-Life NPCs get a stable bounded candidate roll instead of a special quest-giver caste or a universal offer flag.
- `level`, `str`, `agi`, `int`: RPG state.
- `hp`, `maxHp`: folded health.
- `money`, `weapon`, `inventory`: folded economy/loadout.
- `sprite`, `spriteSeed`: folded visual identity when a floor template provides special NPC art.
- `kills`, `npcKills`, `monsterKills`: optional changed counters; default is zero by absence.
- `playerRelation`: optional personal attitude to the player. Absence means "not individually initialized yet"; on first materialization it is initialized from the NPC faction's current relation to the player plus a small deterministic fluctuation.
- `karma`: compact moral/social charge in `[-128, 128]`. Scientists skew high, cultists skew low, every NPC still has deterministic fluctuation.
- `x`, `y`, `angle`: optional last known position.
- `dead`: permanent removal flag.

Target fields:

- `homeFloorKey`, `homeRoomId` or procedural home anchor.
- `workFloorKey`, `workRoomId` or faction/work anchor.
- `friends`: bounded ids, preferably 3-8.
- `family`: spouse/parent/child/sibling ids through compact relation edges.
- `rank`: faction or global social rank.
- `playerSeen`, `lastSeenAt`.
- `questSeed`, `questRole`, `questState`.
- `reputation`, `debt`, `fear`, `loyalty` as compact social values.

Do not add large object graphs. Use ids, typed arrays or bounded sparse override records.

## Procedural Identity Generation

A-Life generation must be at least as varied as the old per-floor procedural population. It should preserve floor taste, faction pressure and special local visuals while moving identity ownership into one persistent pool.

Generation inputs:

- route floor key and base `FloorLevel`
- danger `1..5`
- procedural floor majority faction when available
- authored/design floor id, such as `floor_69` or `bank_floor`
- deterministic run seed and A-Life id
- data profiles from `src/data/alife_generation.ts`

Level distribution:

- Levels are generated across `1..100`.
- Most NPCs should remain around levels `1..10`.
- High levels are a long tail, not a flat random range.
- Current implementation uses a logarithmic/asymptotic distribution close to `1/L`, with danger and elite factions shifting the tail upward.
- Level `100` exists, but should be rare enough that reaching it still feels exceptional.

Faction distribution:

- Faction weights are data profiles, not a switch that every future faction must edit by hand.
- Citizens are the largest default population.
- Liquidators, wild residents, scientists and cultists are rarer and floor-biased.
- Cultists are globally rare but dominant on Hell/cult routes.
- Procedural floors boost their majority faction without excluding minorities.
- Adding a new faction should mean adding a profile with weights, occupations, wealth and pockets.

Floor-specific visuals:

- Special floor NPC visuals must survive A-Life materialization.
- If a generated floor provides a special ambient template sprite, A-Life stores that sprite on the record during materialization.
- `floor_69` female NPC sprites are the first concrete case: A-Life must not replace them with generic traveler art.
- Future special floors should expose their local visual language through templates or data tags, not renderer-side A-Life exceptions.

Wealth distribution:

- Money uses a heavy tail.
- Most NPCs carry little cash.
- Procedural millionaires can exist, but should be very rare.
- Billionaire/ministry/bank oligarch roles should usually be authored or quest-owned identities, not common procedural output.
- Ministry, bank and high-status profiles multiply wealth without making rich NPCs common.

Inventory generation:

- Initial inventory comes from faction, occupation, danger and common pockets.
- Weapons remain loadout items and are stored in inventory too.
- NPC looting/trading can change inventory later; touched inventory folds back into A-Life overrides.
- Inventories stay small and capped. Variety should come from weighted profiles and floor context, not huge per-NPC arrays.

Counters and relation:

- Default counters are zero by absence.
- Persistent counters should include kills, NPC kills, monster kills, rank score inputs and personal relation to the player.
- Relation-to-player is a compact number first; detailed memories should be event facts or sparse overrides.
- Initial personal relation is faction relation to the player plus deterministic per-NPC fluctuation. This keeps faction mood recognizable while making individuals vary.
- If personal relation reaches the same hostile threshold as faction hostility, that NPC treats the player as hostile even if the faction as a whole has not crossed the threshold.
- Player damage to an NPC lowers that NPC's personal relation and, when the factions are not already hostile, lowers the faction relation too.
- Completing a quest gives the issuing faction a small fixed positive relation gain in normal cases (`+1`); the individual giver gets a stronger but capped personal gain because the task mattered to that person.
- Karma is affected by deeds: attacking a non-enemy, stealing and urinating on owned floor reduce it. Positive karma sources can be added later through rescue, repair, honest quest outcomes and shelter help.
- Rank menus and leaderboards should be views over level, wealth, kills, karma, quests and survival facts.

## Player As A-Life Actor

The player is part of A-Life as an actor, not as one of the ordinary NPC pool slots.

Current shipped state:

- The player entity has the same `karma`, `kills`, `npcKills`, `monsterKills` and rank-score inputs as NPCs.
- The player starts with `karma = 0`.
- The player's personal relation to self is `playerRelation = 100`.
- The player appears in the A-Life top-100 rating with a real global rank among alive persistent NPCs.
- Saves store the player's A-Life actor fields together with normal player state.

This keeps future possession simple: controlling another persistent NPC should be a controlled-agent swap, not a rewrite of AI, rank, karma or inventory rules. The selected body already has identity, faction, floor, inventory, karma, rank inputs and personal relations; the game only needs to move player control and camera/input ownership onto that entity.

Apartments and homes:

- Full room/home assignment can wait until first floor visit, because the real apartment graph exists only after generation.
- Before first visit, the pool knows floor identity and can know intended home/work anchors later.
- On first materialization, generated rooms and placement templates can bind records to concrete coordinates, rooms and special local visuals.

## Floor Keys

Population is assigned by route identity, not just by base enum floor.

- Story floors: `story:living`, `story:kvartiry`, `story:ministry`, etc.
- Design floors: their `DesignFloorId`, e.g. `bank_floor`.
- Procedural floors: their per-run spec key, e.g. `z13`.

This makes routed floors persistent even when multiple floors share the same base `FloorLevel`.

## Route Population Shape

A-Life distribution is route-key weighted and data-driven. The current code gives ordinary story-floor population the strongest weights around dense residential/social anchors (`KVARTIRY`, `LIVING`), lower ordinary weights for industrial/Hell anchors, and no ordinary NPC allocation for `VOID`. Authored design floors use `src/data/design_floor_population.ts`; procedural floors use `proceduralPopulationBudget()` plus `floorRunZAllowsNpcs()`.

That means "farther from the center gets harsher" is a systemic bias, not a single hardcoded formula. Route depth, danger, anomaly pressure, floor role and local overrides can all shift the mix. Extreme endgame stops can be ordinary-NPC-free while still adding monster/protocol pressure; nearer authored floors can be unusually dangerous if their role demands it.

## Materialization Contract

Floor generators still own construction:

- world geometry
- rooms
- lifts
- POIs
- authored NPCs
- monsters
- loot
- ambient placement templates

A-Life owns ordinary procedural NPC identity:

- It removes ambient generator NPCs that are not `plotNpcId`, not already persistent and not special quest/event actors.
- It uses those removed NPCs only as placement templates.
- It materializes existing records into the first matching slots for that floor.
- Dead slots stay empty.
- Existing AI, combat, trade and quest systems operate on materialized entities.

The template slot rule matters. If floor generation provides 5,000 ambient NPC slots and 100 matching A-Life records are dead, the floor materializes 4,900 A-Life NPCs. It does not pull 100 unrelated people from deeper in the pool to hide the deaths.

This is also the active-floor budget. A floor may own thousands of identity records, but runtime work is capped by slots, authored anchors and explicit encounters. Future work must not materialize every assigned record just because it exists in the pool.

If a player clears a floor, the deaths remain real. The floor can later receive people only through explicit migration or arrival logic: unassigned overflow residents, caravans, refugees, faction movement or quest consequences. If lazy migration brings people to the currently active floor, they should enter through a believable anchor such as a lift, stairwell, caravan route or event door.

## Named And Quest NPCs

Current shipped behavior:

- Authored named NPCs keep `plotNpcId`.
- A-Life records killed `plotNpcId` values and filters those named NPCs on later floor generation.
- Persistent A-Life NPCs can be quest candidates through their stable `canGiveQuest` affordance. It is not a separate population caste and it is not true for every persistent NPC.

Target behavior:

- Plot NPCs should be declared as fixed A-Life identities with reserved ids.
- Side quest NPCs should also resolve to reserved or generated A-Life identities.
- Quest references should prefer stable ids: `plotNpcId` or `persistentNpcId`, not transient live entity ids.
- Generated quest givers should remain attached to the same A-Life person after save/load/floor travel.
- Killing a quest giver should be a real quest fact, not a recoverable spawn failure.
- Any suitable NPC can become a quest source by data/rules. Being "quest NPC" is a current role, not a different species of NPC.

Practical migration path:

1. Keep `plotNpcId` as the stable authored identity key.
2. Add reserved A-Life ids for plot/side NPCs.
3. Store quest references by `persistentNpcId`.
4. Make quest generation draw from `canGiveQuest` A-Life records on the active floor.
5. Remove remaining generic quest-giver assumptions based on live entity id.

## Families, Friends And Social Graphs

The social graph should be compact and useful, not decorative.

Minimum viable graph:

- `familyId` groups 2-8 NPCs.
- A family prefers the same floor and compatible home zone.
- A few friend edges cross family boundaries.
- Faction and occupation bias friend selection.

Gameplay effects:

- Killing one NPC can make relatives fearful, hostile, grieving or rumor-bearing.
- Family members can inherit quests, debts, grudges or keys.
- Friends can report deaths or point to last known positions.
- Reputation changes can spread through a small local graph rather than all NPCs.
- The shipped baseline stores compact per-NPC relation-to-player for materialized/touched NPCs. Future family/friend propagation should modify this value through bounded local edges, not by scanning the full population.

Do not simulate all social relationships every frame. Update graph consequences through event publication and slow, bounded ticks.

## Rank And Growth

A-Life should make the population grow with the player.

Current shipped state:

- NPCs have RPG level/attributes.
- Materialized NPCs use existing combat and can be killed permanently.
- The Faction/A-Life panel shows a cached `A-LIFE РЕЙТИНГ ТОП 100` list and the player's own global rank.

Target rank model:

- Global and per-faction leaderboards can be derived from compact record fields.
- Current rank inputs: level, kills, NPC kills, monster kills, wealth and karma.
- Future rank inputs: quest outcomes, faction standing, survival time, family consequences and off-floor event victories.
- Rank score should be formula-driven and expandable: killing higher-level enemies, completing valuable quests, gaining money and surviving major events can all add score.
- Named lists such as "лучший ликвидатор", "самый богатый жилец" or "главный убийца этажа" are views over the same facts, not hardcoded special systems.
- High-rank NPCs should be discoverable through rumors, faction panels or logs.
- NPCs should gain XP only when materialized or through rare aggregate off-floor events.
- Off-floor growth must be coarse and bounded, never hidden per-frame combat.

Example visible outputs:

- "Петя Петушко, 17 уровень, 42 убийства, пропал на z13."
- "Самый опасный ликвидатор этажа: Майор Кравченко."
- "Семья Ивановых потеряла троих после второго самосбора."

## Monsters

Persistent A-Life is primarily about NPCs.

Monster policy:

- Initial monster placement remains generator/event owned.
- Samosbor, quest waves, lift encounters, hack backlash and authored consequences may spawn monsters.
- Ordinary timed monster refill is not part of A-Life.

Future option:

- Important monsters and bosses can get persistent identity records.
- Ordinary monsters can remain ecology/event pressure.
- If monster persistence is added, it should use a separate compact pool or ecology state, not the NPC social graph.

## Off-Floor Simulation

Off-floor NPCs are frozen by default.

Allowed off-floor updates:

- Very slow aggregate faction pressure.
- Event summaries.
- Quest deadline consequences.
- Caravan/economy effects.
- Rare rank changes from coarse events.
- Death or migration only when caused by a recorded event.
- Lazy bounded batches over off-floor records, e.g. process `N` identities per slow tick and stop immediately at the budget.

Forbidden off-floor updates:

- Pathfinding.
- Needs ticking.
- Per-NPC combat.
- Per-NPC line-of-sight or noise reaction.
- Full floor scans.

This preserves the fantasy of a living building without spending CPU on invisible theatre.

Lazy off-floor work is allowed only as expandable aggregate A-Life. It must never become honest current-floor simulation for floors the player cannot see.

## Save Model

Current save shape version is in `src/systems/save_runtime.ts`.

A-Life save data stores:

- population version
- seed
- total population count
- dead A-Life ids
- dead plot NPC ids
- bounded changed-record overrides: position, health, money, inventory, RPG state, visual seed/sprite and changed counters

The full pool is regenerated deterministically from seed and run route state, then overrides are applied.

Rules:

- Do not serialize the live `entities` array.
- Do not serialize all `100_000` or `1_000_000` full records when deterministic reconstruction plus overrides is enough.
- Bump save shape if persistent identity fields become required, if floor allocation changes, or if route floor keys/reserved plot ids can move existing NPC identities.
- Current development saves may be invalidated instead of migrated.

## Scaling Target

The shipped runtime target is adaptive:

- Use `1_000_000` NPC identities when browser heap/device memory indicates enough room.
- Fall back to `100_000` NPC identities on constrained or unknown runtimes.
- Keep active-floor materialization around the existing floor population budgets, roughly thousands of live NPCs, not the full bucket.

Measured on 2026-05-20 with the current JS object pool in Node/V8:

- `100_000` records: about `42.6 MB` heap, about `101 ms` creation.
- `1_000_000` records: about `425 MB` heap, about `804 ms` creation.

The architecture must remain compatible with `1_000_000` NPCs:

- Use ids and compact numeric fields.
- Prefer deterministic generation from seed.
- Store sparse overrides for changed records.
- Avoid per-record object churn in hot paths.
- Do not put large strings or arrays on every record unless memory has been measured.

If `1_000_000` becomes too heavy as JS objects, move the pool toward structure-of-arrays:

- typed arrays for ids, floor indexes, faction, occupation, level, hp, flags
- string tables for names
- sparse maps for inventory, coordinates and changed state

## Integration Rules

- `systems/alife.ts` is the owner of persistent procedural NPC identity.
- `core/types.ts` may expose only primitive identity fields needed by live `Entity`.
- `gen/` can create placement templates but must not implement refill logic.
- `systems/ai/` keeps behavior unchanged and consumes live entities only.
- `systems/quests.ts` should move toward stable persistent ids.
- `systems/events.ts` should record deaths, rank changes and social consequences.
- Migration, resettlement and off-floor event passes must be slow, bounded and explicit; they are not refill-to-cap.
- `render/` should display A-Life facts but never own A-Life decisions.
- Debug tools may inspect, kill, teleport or rank A-Life records, but must call system APIs.

Useful telemetry:

- total population, alive count, dead count
- current floor key, floor bucket size and materialized count
- template slot count and empty-dead-slot count
- changed-record override count and cap pressure
- faction/rank/family summaries for the active floor
- recent A-Life events: death, migration, quest-giver loss, rank change, family reaction

## Owner Decisions

Decisions recorded on 2026-05-20:

1. Target population is `1_000_000` when memory allows it. The fallback is `100_000`.
2. Active floor population remains bounded by the existing floor budgets, roughly thousands of NPCs, not the whole floor bucket.
3. NPCs can migrate between floors through events, caravans, quests, resettlement and future lazy background migration.
4. Off-floor migration/event work may process records in bounded batches of `N`; it must not become full simulation.
5. Death is permanent for every NPC, including authored, plot and quest NPCs. There is no respawn.
6. Any suitable NPC can be a quest source. Quest-giver is a role produced by rules/content, not a separate global class.
7. Family, friend and relation-to-player data should become real gameplay when memory allows it: fear, revenge, rumor, discounts, help, hostility.
8. Rank is formula-driven and expandable. Start with score from level, kills, high-level kills, money, quests and survival; expose special lists as views.
9. A cleared floor stays meaningfully changed, but can later receive explicit migrants, overflow residents, caravans, refugees or faction arrivals.
10. If migration reaches the active floor, new arrivals should appear through believable anchors such as lifts or route entrances.
11. Rank and population should get gameplay UI, not only debug output.
12. Killing everyone is simply possible. It does not need to be a win condition yet; endings/achievements can extend it later.

## Completion Definition

A-Life is considered fully integrated when:

- All ordinary generated NPCs materialize from A-Life records.
- Plot and side NPCs have reserved persistent identities.
- Quests reference stable identity, not transient entity id.
- The player can depopulate a floor and the absence persists until explicit migration/resettlement changes it.
- The global alive count can only decrease through permanent deaths; floor population counts change through explicit migration/outcome rules.
- Rank/family/friend data has at least one visible gameplay surface.
- Save/load preserves deaths, touched state and quest identity.
- No ordinary NPC or monster system refills to a cap in the background.
