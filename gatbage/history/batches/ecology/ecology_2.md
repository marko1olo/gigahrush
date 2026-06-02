# ecology_2: concrete, wall and debris predators

> Parallel worker plan.
>
> Primary owner: `TVAR`, `SHOVNIK`, `PANELNIK`, `REBAR`, `ZAKALENNAYA_ARMATURA`, `BETONOED`, `BETONNIK`, `RZHAVNIK`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- `src/entities/tvar.ts`
- `src/entities/shovnik.ts`
- `src/entities/panelnik.ts`
- `src/entities/rebar.ts`
- `src/entities/zakalennaya_armatura.ts`
- `src/entities/betonoed.ts`
- `src/entities/betonnik.ts`
- `src/entities/rzhavnik.ts`
- `src/systems/ai/monster.ts`
- `src/systems/monster_traits.ts`
- wall/debris tests under `tests/monster_*.test.ts`

## Mission

Unify wall-edge and concrete/debris ecology so these monsters punish bad positioning near walls, seams, weak panels or scrap, while remaining cheap local checks.

Do not create a global concrete-field simulation. These are local terrain monsters.

## Shared family rule

Family archetypes: `wall_edge`, `debris_ambusher`, `weak_wall_breacher`, `heavy_blocker`.

Implementation principles:

- Use local cell adjacency and short line checks.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist2`.
- No full map weak-wall scan.
- Runtime geometry mutation must bump existing dirty versions through current helpers if geometry changes.
- Heavy/rare monsters may have richer cues; common monsters stay cheap.

Potential shared helper:

```txt
monsterWallContext(world, actor)
  adjacentWall: boolean
  narrowDoorOrCorner: boolean
  openFloorScore: 0..1
  weakWallNearby?: cell
```

Only add if it reduces duplication across at least three monsters.

## Monster plan

### `TVAR`

Current: `foodBait`, `wallBias`.

Goal: keep as mid-tier "wall is bad" teacher.

Implementation lane:

- Reuse/clean current `wallBias` behavior.
- Add cue when wall bonus is active, with cooldown.
- Keep bait redirection owned by existing bait system.

Counterplay transition:

- Moving to center room reduces reach/damage/speed pressure.
- Bait redirects only before combat lock.

Tests:

- adjacent wall changes pressure.
- center room removes modifier.

### `SHOVNIK`

Current: `wallBias`, seam hunter.

Goal: make it a sharper but still cheap seam/wall version of `TVAR`.

Implementation lane:

- Share wall helper with `TVAR`.
- Prefer a slightly different cue/cooldown, not a separate state machine.

Counterplay transition:

- Open floor breaks seam advantage.

Tests:

- same helper works for `TVAR` and `SHOVNIK`;
- no special player-only branch.

### `PANELNIK`

Current: `wallBrace`, slab bruiser.

Goal: preserve wall-braced armor/reach and make "step away from panel" a state transition.

Implementation lane:

- Reuse existing `panelnikWallBraceActive()` / `panelnikOpenFloor()` if present.
- Avoid new broad helper unless current helper cannot serve.

Counterplay transition:

- Wall brace grants armor/reach cue.
- Open floor slows or weakens.

Tests:

- wall brace active near wall.
- open floor applies slow/weak state.

### `REBAR`

Current: `debrisLurker`, `wallBias`.

Goal: make scrap/debris ambush readable and local.

Implementation lane:

- Keep debris cover detection local.
- Add/verify first reveal cue and fallback to baseline chase.

Counterplay transition:

- Look/listen or distance exposes it.
- Center floor lowers wall bonus.

Tests:

- debris state does not scan floor debris globally.
- reveal works on NPC target or non-player stimulus when possible.

### `ZAKALENNAYA_ARMATURA`

Current: armored rebar elite with armor stacks.

Goal: make armor stack stripping readable without expensive tactical brain.

Implementation lane:

- Keep runtime stack data compact and actor-local.
- If adding counterplay, use existing damage/status path.

Counterplay transition:

- Specific damage type, repeated hits, or exposure chips armor.
- Open floor still matters if wall/debris rules apply.

Tests:

- armor stack cap is fixed.
- stack visuals remain procedural and not save-heavy.

### `BETONOED`

Current: `wallBias`, `weakWallBreach`.

Goal: keep weak-wall breach as route/noise/seal decision, not random geometry grief.

Implementation lane:

- Use only prepared weak-wall seams or current authored hooks.
- Seal/fire/noise interactions must be local and event-backed.
- Any geometry mutation must dirty world/path/render caches through precedent.

Counterplay transition:

- Seal blocks breach.
- Fire delays or scares.
- Noise can bait/accelerate in a visible way.

Tests:

- no protected apartments/lifts/hermetic walls erased.
- path/render dirty version updated if cells change.

### `BETONNIK`

Current: rare heavy concrete threat.

Goal: remain a slow blocker with route decision, not a smart boss.

Implementation lane:

- Data/cue polish preferred.
- Do not add expensive scans.
- If adding behavior, use heavy windup/line blocking with local wall/cover checks.

Counterplay transition:

- Corners, stamina, fire, noise, retreat; not direct duel.

Tests:

- no cadence cost for common monster load.

### `RZHAVNIK`

Current: `scrapWake`, scrap-disguise ambusher.

Goal: make first leap readable and interruptible while preserving mimic/trap flavor.

Implementation lane:

- Keep local scrap/cover wake radius.
- Use one wake cue with cooldown.
- Fall back to baseline after reveal.

Counterplay transition:

- First hit or cautious distance weakens leap.
- Open floor after reveal removes disguise advantage.

Tests:

- reveal is local.
- no all-entity scan for scrap context.

## Samosbor line

`BETONOED`, `BETONNIK`, `PANELNIK` can be `amplified` by route damage and concrete scars, but this packet should not add broad samosbor geometry rewrites. Use existing samosbor mutation facts only.

## Validation

Run `npm run check`; add `npm run check:browser` only if visual/render cues change.
