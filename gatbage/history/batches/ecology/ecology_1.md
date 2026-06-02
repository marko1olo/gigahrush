# ecology_1: cheap chasers and crowd pressure

> Parallel worker plan.
>
> Primary owner: `SBORKA`, `ZOMBIE`, `DIKIY_MERTVYAK`, `TRESKOTNIK`, `POLZUN`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- `src/entities/sborka.ts`
- `src/entities/zombie.ts`
- `src/entities/dikiy_mertvyak.ts`
- `src/entities/treskotnik.ts`
- `src/entities/polzun.ts`
- `src/data/monster_ecology.ts`
- `src/systems/ai/monster.ts`
- `tests/ai-full-pass.test.ts`
- `tests/monster_00_base_registry_audit.test.ts`
- relevant `tests/monster_*.test.ts`

## Mission

Make the mass, cheap, early-pressure monsters more readable and more ecological without making them expensive. These monsters are common enough that their behavior must stay mostly baseline stats + one flag + local cue.

Do not build tactic profiles for all five by default. Prefer tiny flag/helper improvements and better tests around current `combatScanCd`, movement, target selection, crowd and counterplay.

## Shared family rule

Family archetype: `chaser`, `crowd_chaser`, `door_pressure`.

Expected implementation shape:

- Existing baseline target scan remains authoritative.
- Special logic may only add a local cue, interrupt window, door/crowd modifier, or brief panic/stagger event.
- Expensive work happens on actor-local cooldown, not every frame.
- Target can be player, NPC or monster.
- No spawn/refill logic.

Potential shared helper:

```txt
cheapCrowdPressure(actor, target, radius, cap)
  reads entity_index queryRadiusCapped
  counts nearby actors / door jam context
  returns compact pressure scalar
```

Only add it if at least two assigned monsters use it.

## Monster plan

### `SBORKA`

Current: `foodBait`, fast weak chaser, bait-attracted.

Goal: keep as cheapest swarm body and make "wide place / early cheap shot / bait" more readable.

Implementation lane:

- Prefer data/test/cue update.
- If touching runtime, add a tiny first-sight or bait-attraction cue with cooldown.
- Do not add pack intelligence; `SBORKA` should stay dumb and numerous.

Counterplay transition:

- Bait can redirect target before combat lock.
- Early damage can briefly stagger only if existing generic damage/stagger hooks support it cheaply; otherwise leave as pure HP body.

Tests:

- bait attraction still works from `monster-bait.test.ts`;
- remote `SBORKA` still updates in full-pass AI;
- no scan cadence regression.

### `ZOMBIE`

Current: baseline humanoid undead, dangerous in crowd/door/kitchen.

Goal: make death/crowd/door mistakes legible without adding a custom brain.

Implementation lane:

- Add ecology cue/death-log wording if missing.
- Optional local door-jam damage/readability helper shared with `DIKIY_MERTVYAK`.

Counterplay transition:

- Wide floor and early hits should be the answer.
- Door/crowd pressure can increase threat only through local actor count or adjacent blocked cells, capped.

Tests:

- zombie remains valid in samosbor/route spawn tests;
- crowd/door modifier, if added, has a local cap and does not scan full entities.

### `DIKIY_MERTVYAK`

Current: `crowdShove`, fragile crowd-runner.

Goal: preserve current shove/crowd behavior but make interrupt and door-jam counterplay clearer.

Implementation lane:

- Work near existing `crowdShove` code.
- Prefer one focused test around early damage cancelling or reducing momentum if current behavior supports it.

Counterplay transition:

- Early hit cancels or weakens sprint pressure.
- Open floor reduces crowd shove.

Tests:

- shove uses capped local actor query.
- target can be NPC, not only player.

### `TRESKOTNIK`

Current: `fractureSprint`, brittle windup sprinter.

Goal: make red crack windup the model case for cheap readable interrupt.

Implementation lane:

- Keep short windup, sprint, stagger, cooldown in current monster runtime.
- Add cue/event only on windup start, with cooldown.
- Avoid tactic profile unless current code becomes unmaintainable.

Counterplay transition:

- Any meaningful hit during windup cancels sprint or causes stagger.
- Corner/door break line denies direct sprint.

Tests:

- windup can be interrupted;
- sprint does not require player target;
- no per-frame scan beyond current target loop.

### `POLZUN`

Current: `foodBait`, slow heavy body.

Goal: make "slow in open, lethal in door/water/bathroom" an explicit local ecology rule.

Implementation lane:

- Reuse local terrain feature checks, not full room scans.
- Consider shared `door_or_wet_close_pressure` helper only if another agent does not own it.

Counterplay transition:

- Dry open floor keeps it kitable.
- Door/water/bathroom adjacency increases contact pressure or cue, bounded.
- Bait can redirect before combat lock.

Tests:

- open-floor movement remains baseline.
- wet/door bonus, if added, is local and capped.

## Samosbor line

Default reaction: `amplified` only by ordinary samosbor pressure and baseline combat. These monsters should not receive extra refill. `ZOMBIE`/`SOBRANNYY` style post-samosbor content is owned by existing samosbor systems and other packets.

## Validation

Run `npm run check` after runtime changes. Docs/data-only changes can use `npm run typecheck`, but AI behavior changes require `npm run check`.
