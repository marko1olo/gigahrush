# ecology_5: water, slime and wet-line threats

> Parallel worker plan.
>
> Primary owner: `TUBE_EEL`, `LOTOCHNIK`, `VODYANOY_KOSHMAR`, `CHERNOSLIZ`, `TRUBNYY_AVTOMAT`, `SLIME_WOMAN`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- `src/systems/ai/tactics.ts`
- `src/systems/cell_hazards.ts`
- `src/systems/surface_marks.ts`
- `tests/monster_36_vodyanoy_koshmar.test.ts`
- `tests/monster_46_tube_eel_water_hazard.test.ts`
- tests for `SLIME_WOMAN`, `CHERNOSLIZ`, `TRUBNYY_AVTOMAT`

## Mission

Make wet ecology consistent: water and slime are not just texture; they are route, speed, line, pressure, ambush and cleanup decisions. Keep all wet scans bounded.

## Shared family rule

Family archetypes: `water_strider`, `wet_line`, `black_water_ambusher`, `slime_territorial`, `dry_break`.

Implementation principles:

- Local wet checks only: current cell, bounded line, small anchor search.
- Wet-line BFS/connection must have fixed max cells and cadence.
- Slime hazards must have duration/cell cap and cleanup counterplay.
- Dry floor or dry light should change behavior state.
- No full water map scan.

Potential shared helper:

```txt
wetContext(world, actor, target)
  actorWet
  targetWet
  dryEdgeNearby
  wetLineConnected bounded by maxCells
  wetAnchor within local offsets
```

Coordinate with `ecology_4` if sharing fog/wet terrain utilities.

## Monster plan

### `TUBE_EEL`

Current: `waterStrider`.

Goal: simple water/pipe ambusher: fast in water, answer is dry edge/harpoon/bait.

Implementation lane:

- Reuse current water-strider movement/damage multipliers.
- Add local ripple/cue if missing.

Counterplay transition:

- Dry edge slows it or lowers damage.
- Bait can draw it away before combat lock.

Tests:

- water speed/damage differs from dry.
- no full water scan.

### `LOTOCHNIK`

Current: `waterStrider`, `drainArmor`.

Goal: heavier wet-service crawler with armor/regeneration in drain/water and dry weakness.

Implementation lane:

- Share water-strider helper with `TUBE_EEL`.
- Keep drain armor as local cell/feature check.

Counterplay transition:

- Pull onto dry threshold to remove armor/regeneration.

Tests:

- dry threshold disables armor state.
- local terrain only.

### `VODYANOY_KOSHMAR`

Current: `waterPressureLine`.

Goal: wet-line PSI predator where retreating along one wet route is the mistake.

Implementation lane:

- Keep bounded wet-line check constants.
- If shared helper is introduced, preserve max cells, scan seconds and dry-break window.

Counterplay transition:

- Step onto dry concrete long enough to break pressure.

Tests:

- wet-line pressure ramps only on bounded connected line.
- dry break resets after fixed delay.

### `CHERNOSLIZ`

Current: `blackWaterWake`.

Goal: black-water first-shot ambusher; light/noise/probe reveals it.

Implementation lane:

- Use local water and light/noise checks.
- Do not scan all water cells.

Counterplay transition:

- Light, noise can, first shot or close dry edge reveals/weakens first ambush.

Tests:

- reveal condition uses cap/cadence.
- dry target range lower than wet target range.

### `TRUBNYY_AVTOMAT`

Current: `wetLineShot`.

Goal: wet-line machine turret with charge/recovery and flank weakness.

Implementation lane:

- Share bounded line helper with `VODYANOY_KOSHMAR` if clean.
- Keep line max cells and recovery fixed.

Counterplay transition:

- Step off wet straight before charge completes; punish long recovery.

Tests:

- wet-line shot does not fire off-line.
- recovery prevents spam.

### `SLIME_WOMAN`

Current: `slimeStrider` and `ActorTacticProfile` in `tactics.ts`.

Goal: keep as reference implementation for bounded tactic profiles.

Implementation lane:

- Do not replace profile with custom monster.ts logic.
- Polish profile facts only if needed: wet/dry anchor, crowd flee, residue, isolated ambush.
- Use existing `cell_hazards`, `surface_marks`, `publishEvent`.

Counterplay transition:

- Dry lit concrete reduces scale/tempo and publishes cue.
- Wet/slime increases tempo.
- Crowd makes her flee; isolated target invites ambush.
- Cleaning kit/fire/dry edge answer residue.

Tests:

- profile sense radius/cap/cadence enforced.
- `handled` only during actual flee/retreat/ambush.
- baseline combat resumes when profile conditions are inactive.

## Samosbor line

Wet/slime threats are `amplified` only through local wet/slime/fog terrain and samosbor scars already present. No new refill. `SLIME_WOMAN` and `CHERNOSLIZ` may be `displaced` by drying/cleaning or local rebuild if the world state changes.

## Validation

Run `npm run check`; if hazard visuals or HUD warnings change, run browser validation when possible.
