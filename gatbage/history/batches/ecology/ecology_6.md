# ecology_6: food, bait, corpse and document scent

> Parallel worker plan.
>
> Primary owner: `KRYSNOZHKA`, `POMOYNY_ROY`, `ZHORNAYA_TVAR`, `OLGOY`, `PECHATEED`, `KONTORSHCHIK`, `PROTOKOLNIK`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `items.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/data/monster_ecology.ts`
- `src/systems/ai/monster.ts`
- `src/systems/monster_bait.ts`
- `src/systems/document_scent.ts`
- `src/systems/events.ts`
- `tests/monster-bait.test.ts`
- tests for document predators and `OLGOY`

## Mission

Make scent ecology a compact, local stimulus system: food, bait, corpses, blood and documents change monster target choice, but do not create full inventory/world scans.

## Shared family rule

Family archetypes: `resource_predator`, `scent_lunge`, `garbage_surround`, `document_predator`, `protocol_pressure`.

Implementation principles:

- Scent target choice must use local radius, cap and cooldown.
- Bait is a route/resource decision, not a magic despawn.
- Document scent must work for NPC carriers too.
- Corpse/blood scans must be capped and cadence-bound.
- No per-frame inventory scans across all actors.

Potential shared helper:

```txt
monsterScentStimulus(actor, state)
  food/bait/drop/corpse/document pressure
  target id or cell
  severity and tags
```

Only create if it simplifies both food and document paths; otherwise keep current specialized helpers.

## Monster plan

### `KRYSNOZHKA`

Current: `foodBait`.

Goal: cheap garbage/food swarm pressure.

Implementation lane:

- Reuse `monster_bait`.
- Add better cue/test around food in pocket only if existing helpers support it.

Counterplay transition:

- Throw bait away from route.
- Keep food in container or avoid garbage room.

Tests:

- bait attraction works.
- non-food target scan remains baseline.

### `POMOYNY_ROY`

Current: `foodBait`, `garbageSurround`.

Goal: surround target around food/bait using deterministic local slots.

Implementation lane:

- Keep capped slot behavior.
- Avoid all-to-all pack intelligence.

Counterplay transition:

- Closed food lowers scent.
- Fire/door/narrow exit denies surround.

Tests:

- surround uses fixed slot count.
- bait/food scent cap fixed.

### `ZHORNAYA_TVAR`

Current: `foodBait`, `scentOvercommit`.

Goal: food/carry scent lunge with miss recovery.

Implementation lane:

- Use existing carrier/drop scan caps.
- Keep lunge and recovery actor-local.

Counterplay transition:

- Sealed food or thrown meat redirects.
- Miss creates punish window.

Tests:

- carrier/drop scans capped.
- miss recovery prevents immediate relunge.

### `OLGOY`

Current: `foodBait`, `meatWorm`.

Goal: heavy meat/corpse/water/pipe worm.

Implementation lane:

- Preserve current corpse/meat caps.
- If corpse scan is high, keep cadence and cap explicit.

Counterplay transition:

- Raw meat distracts.
- Dry open floor slows/weakens.
- Water/pipe/abyss makes bite/drag worse.

Tests:

- corpse scan cap and cooldown.
- dry vs wet behavior.

### `PECHATEED`

Current: `documentHunter`.

Goal: document scent is a real inventory route risk.

Implementation lane:

- Use `document_scent` helpers.
- Avoid scanning every item in every inventory per frame.

Counterplay transition:

- Drop/stash low-value papers to reduce scent.
- Cabinets/doors/angles break pursuit.

Tests:

- document carrier can be NPC.
- no scent means fallback detect range.

### `KONTORSHCHIK`

Current: `documentScent`.

Goal: slower but stronger office/document corpse pressure.

Implementation lane:

- Share document helper with `PECHATEED`.
- Keep unique cue for noisy paperwork.

Counterplay transition:

- Remove forms/permits/seals from inventory or throw cheap form.
- Furniture/office clutter can be counterplay if already local.

Tests:

- scent strength changes range/pressure.
- no player-only inventory branch.

### `PROTOKOLNIK`

Current: `protocolPressure`.

Goal: long fight with valuable documents becomes pressure; short burst or document drop is answer.

Implementation lane:

- Keep pressure scalar actor-local.
- Cap pressure and decay.
- Publish event only on threshold crossings.

Counterplay transition:

- Drop/stash documents, burst damage, or leave before pressure closes.

Tests:

- pressure max and safe cap enforced.
- document drop reduces future growth.

## Samosbor line

Scent predators are mostly `amplified` by chaos only through more corpses, dropped items, panic noise and route pressure that already exists. Do not add background scent spawners. Bait/corpse/document events are enough.

## Validation

Run `npm run check`. If item definitions or use effects change, include focused item tests.
