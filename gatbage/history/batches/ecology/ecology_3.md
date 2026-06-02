# ecology_3: line, light, office and control threats

> Parallel worker plan.
>
> Primary owner: `EYE`, `LAMPOVY`, `LAMPOGLAZ`, `PARAGRAPH`, `KANTSELYARSKIY_IDOL`, `ROBOT`, `SLEPOGLAZ`, `PAUPSINA`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `fight.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- `src/systems/projectiles.ts` or projectile handling paths if touched
- `src/data/monster_ecology.ts`
- `tests/monster_17_paupsina.test.ts`
- `tests/monster_30_lampoglaz.test.ts`
- tests for line/ranged/projectile monsters

## Mission

Make ranged/line/control monsters share a small vocabulary: line, windup, cover, light, last sound, office field and web control. Keep them physically honest: projectiles and beams are real, cover/doors/angles matter, targets can be NPCs.

## Shared family rule

Family archetypes: `line_turret`, `light_lock`, `office_field`, `last_sound_line`, `web_control`.

Implementation principles:

- Windup/cooldown must be actor-local.
- Line checks must be bounded by max cells/range.
- Do not use render visibility as gameplay truth.
- No per-frame scan beyond current target validation.
- Projectile/beam consequences publish compact events only on transition/hit.

Potential shared helper:

```txt
lineThreatContext(world, actor, target, maxRange)
  los: boolean
  coverBroken: boolean
  litTarget: boolean
  lastSoundPoint?: x/y
```

Only add if it reduces repeated LOS/light/sound code.

## Monster plan

### `EYE`

Current: ranged eye with readable green windup.

Goal: keep as generic line-of-sight teacher.

Implementation lane:

- Data/cue/tests unless current windup lacks non-player target handling.
- Do not over-specialize; other line monsters build on this pattern.

Counterplay transition:

- Breaking LOS before windup fires cancels or delays shot.
- After shot, recovery window allows approach.

Tests:

- target can be NPC.
- cover break cancels/defers shot.

### `LAMPOVY`

Current: `lampPowered`.

Goal: make lamp adjacency a simple positional ecology rule.

Implementation lane:

- Use local `nearFeature(... Feature.LAMP ...)` or shared terrain helper.
- Cue only when powered state activates.

Counterplay transition:

- Move away from lamp or turn off/leave light cluster.

Tests:

- lamp bonus is local.
- no full feature scan.

### `LAMPOGLAZ`

Current: `lightLock`, ranged light-linked turret.

Goal: preserve light-lock as stronger version of `EYE`.

Implementation lane:

- Keep current light thresholds.
- If refactoring, share only LOS/windup helpers; keep light-lock constants owned here.

Counterplay transition:

- Target steps into darkness or breaks line before windup.
- Hard light lock makes shot faster/stronger.

Tests:

- dark cell weakens or cancels lock.
- lit NPC target is valid.

### `PARAGRAPH`

Current: `rangedClause`, bureaucratic line shooter.

Goal: line threat with document/office flavor, not duplicate `EYE`.

Implementation lane:

- Use shared line/windup helper if available.
- Keep unique projectile/cue text in ecology data.

Counterplay transition:

- Cabinet/door/corner breaks clause line.
- Recovery window is explicit.

Tests:

- LOS break works.
- no player-only document text branch.

### `KANTSELYARSKIY_IDOL`

Current: `officeField`, stationary/field ranged hazard.

Goal: office-field pressure should be a territorial line/field rule.

Implementation lane:

- Local office/furniture/room checks only.
- Avoid whole room scans every frame; cache room id or use local feature checks.

Counterplay transition:

- Leaving office field, breaking line or destroying/denying anchor weakens it.

Tests:

- field cap and scan cadence fixed.
- target can be non-player.

### `ROBOT`

Current: industrial ranged automaton.

Goal: plasma line threat with wet-risk cue but no unique heavy brain.

Implementation lane:

- Reuse line/windup/cooldown.
- Optional wet floor modifier must be local.

Counterplay transition:

- Leave line, avoid wet straight, punish after volley.

Tests:

- projectile fires through existing projectile system.
- wet modifier local and bounded.

### `SLEPOGLAZ`

Current: `lastSoundBeam`, blind last-sound turret.

Goal: make noise stimulus and beam target point clear.

Implementation lane:

- Reuse existing noise helpers.
- Do not scan all events; sample local noise with cadence.
- Beam hit query must remain capped.

Counterplay transition:

- Make noise/show position, sidestep before beam.
- Silence or changed position breaks aim.

Tests:

- last-sound target is not always player.
- beam scan cap enforced.

### `PAUPSINA`

Current: `webSpitter`, projectile web control.

Goal: corridor control without HP damage spam.

Implementation lane:

- Keep web projectile and slow/root bounded.
- Use line helper if available, but web behavior remains its own flag.

Counterplay transition:

- Door/shelf/angle blocks web line.
- Cutting/burning web frees target through existing status/item hooks where present.

Tests:

- web line is blocked by cover.
- web effect duration/cap does not stack indefinitely.

## Samosbor line

Most of this family is `exempt`: baseline line threats already become harder during chaos because cover and route choices matter. `KANTSELYARSKIY_IDOL` may be `amplified` by office/administrative route pressure only if local and capped.

## Validation

Run `npm run check`. If projectile visuals, HUD warnings or sprite cues change, also run browser validation when Chrome is available.
