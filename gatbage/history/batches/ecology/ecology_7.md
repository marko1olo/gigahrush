# ecology_7: sources, hives, rooted and room hazards

> Parallel worker plan.
>
> Primary owner: `MATKA`, `KHOROVAYA_MATKA`, `IDOL`, `BORSHCHEVIK`, `BLOOD_PLANT`, `SWARM`, `SPORE_CARPET`, `OBZHIVALSHCHIK`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `samosbor.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- `src/systems/swarm_nests.ts`
- `src/systems/cell_hazards.ts`
- `src/systems/borshchevik.ts`
- `src/systems/blood_plant.ts`
- `src/systems/room_memory.ts`
- source/hive/root tests under `tests/monster_*.test.ts`

## Mission

Make source and room-bound monsters visible, capped and cleanly counterable. A source is allowed to create pressure only while its source exists and within fixed caps.

## Shared family rule

Family archetypes: `source_hive`, `rooted_source`, `trap_tether`, `room_puzzle_boss`, `lurking_furniture`.

Implementation principles:

- Every child/hazard has a source, cap and lifetime.
- No runtime refill to population cap.
- Source cleanup has event and route clue.
- Rooted monsters do not need full path brains.
- Room-bound monsters use room id/anchor and local memory, not global scans.

Potential shared helper:

```txt
sourceSpawnBudget(sourceId, kind)
  activeChildren
  maxChildren
  nextSpawnAt
  sourceAlive
```

Only create if current `swarm_nests`/source logic is insufficient for more than one source family.

## Monster plan

### `MATKA`

Current: spawner boss.

Goal: keep as old source lesson: kill source, clear children, or leave.

Implementation lane:

- Verify child cap and entity soft-limit check.
- Avoid new source abstraction unless needed.

Counterplay transition:

- Killing source stops children.
- Child cap prevents runaway.

Tests:

- child count cap.
- source death stops spawn.

### `KHOROVAYA_MATKA`

Current: choir countdown spawner.

Goal: countdown/readability source with open attack window.

Implementation lane:

- Keep countdown local.
- Publish cue only on phase change.

Counterplay transition:

- Kill source before new wave or clear children then punish.

Tests:

- countdown cadence fixed.
- no unbounded children.

### `IDOL`

Current: immobile psi monolith.

Goal: territorial immobile hazard, not moving actor.

Implementation lane:

- Data/cue or local field helper.
- Do not add movement/path logic.

Counterplay transition:

- Leave field, break line, destroy source/anchor.

Tests:

- field cap/locality.

### `BORSHCHEVIK`

Current: `rootedPlant`, seeds/roots.

Goal: corridor plant blockade with cutting/fire/salt decisions.

Implementation lane:

- Use existing `borshchevik` system.
- Keep root/seed cooldowns and cell caps.

Counterplay transition:

- Cutting quiet path, fire fast kill with risk, dry route bypass.

Tests:

- root/tendril max cells.
- seed puff cooldown.

### `BLOOD_PLANT`

Current: `rootHive`, red-mold source.

Goal: source heals from local red mold and controls short radius.

Implementation lane:

- Use existing `blood_plant` helpers.
- Keep heal scan cadence/cap.

Counterplay transition:

- Salt/fire/cutting and removing nearby mold weakens source.

Tests:

- heal scan cadence.
- tendril range cap.

### `SWARM`

Current: `sourceSwarm`, `foodBait`; nests handled by `updateSwarmNests`.

Goal: visible vent/void source with seal/burn/run decisions.

Implementation lane:

- Coordinate with existing `swarm_nests.ts`.
- No independent spawn loop in monster AI.

Counterplay transition:

- Seal vent/slot, burn source, bait bodies away.

Tests:

- source sealed stops bodies.
- children count respects soft limit.

### `SPORE_CARPET`

Current: `lurkingFurniture`.

Goal: domestic trap: opened container/proximity/fire reveal.

Implementation lane:

- Keep local container/door/proximity scans with cadence.
- Puff target cap and fog cell cap fixed.

Counterplay transition:

- Read lifted corner, avoid threshold, burn/salt/filter.

Tests:

- container wake scan cadence.
- puff cap and fire recoil.

### `OBZHIVALSHCHIK`

Current: `roomBoundAberration`.

Goal: room-bound resident aberration with anger, noise and containment.

Implementation lane:

- Use room id/anchor, local door/room memory.
- Do not chase forever unless anger/samosbor explicitly breaks tether.

Counterplay transition:

- Do not breach/steal/noise; report/help reduces pressure if existing content supports.
- Hermetic/door containment matters.

Tests:

- room tether returns or holds.
- anger cap fixed.

## Samosbor line

This packet owns the most direct samosbor reactions. Valid reactions: `born`, `amplified`, `shelter_conflict`. Every one needs source id, cap and visible reason. No invisible refill.

## Validation

Run `npm run check`; run generation tests if source placement/generation changes.
