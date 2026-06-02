# ecology_4: fog, dark and phase predators

> Parallel worker plan.
>
> Primary owner: `SHADOW`, `TONKAYA_TEN`, `GLUBINNAYA_TEN`, `TUMANNIK`, `FOG_SHARK`, `LISHENNYY`, `SPIRIT`, `LOZHNYY_DUKH`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- `src/systems/noise.ts`
- fog/light terrain code used by monster runtime
- `tests/monster_04_fog_shark.test.ts`
- `tests/monster_12_lishennyy.test.ts`
- `tests/monster_21_tumannik.test.ts`
- `tests/monster_33_glubinnaya_ten.test.ts`

## Mission

Make darkness/fog/phase monsters readable without reducing them to the same shadow. The shared vocabulary is reveal, false position, light safe state, phase cooldown, second beat, fog speed and line break.

## Shared family rule

Family archetypes: `ambusher`, `fog_predator`, `dark_bait`, `phase_pursuer`, `light_lure`.

Implementation principles:

- Fog/dark checks are local cell/zone checks.
- Light counterplay must affect state, not just damage.
- Phase/wall traversal remains rare, cooldown-bound and readable.
- Do not use render darkness as gameplay truth; use `world.light`, `world.fog`, features, zones or existing systems.
- Target can be NPC. If an effect is player-facing text only, keep gameplay target-generic.

Potential shared helper:

```txt
shadowTerrainContext(world, actor, target)
  actorDark
  targetDark
  actorFog
  targetFog
  lightSafe
  fogPressure
```

Only create if it removes repeated local terrain logic.

## Monster plan

### `SHADOW`

Current: dark silhouette melee ambusher.

Goal: base dark predator: teaches light/open space.

Implementation lane:

- Keep current windup/strike rules.
- Add only minimal cue or tests if needed.

Counterplay transition:

- Light or open move cancels/weakens strike.

Tests:

- light state affects behavior.
- non-player target still valid.

### `TONKAYA_TEN`

Current: `baitLine`, lure to dark line.

Goal: make "do not chase first silhouette" a tactical rule.

Implementation lane:

- Existing bait line logic should remain local.
- Add/update event on bait arm only.

Counterplay transition:

- Holding position, light, noise or refusing chase makes it reset/return weak.

Tests:

- bait line does not scan whole map.
- target can be NPC if local conditions fit.

### `GLUBINNAYA_TEN`

Current: `secondBeat`.

Goal: second-beat strike should be a clear dark-pursuit punishment.

Implementation lane:

- Keep current `secondBeat` constants.
- Consider sharing light-safe helper with `SHADOW`.

Counterplay transition:

- Stop, hold light exit, or reveal real body before second beat.

Tests:

- second beat arms and cancels.
- no permanent suppression of baseline combat.

### `TUMANNIK`

Current: `fogOffset`.

Goal: fog false silhouette with light/fire/fog-exit collapse.

Implementation lane:

- Use local fog and light checks.
- Cue when offset is armed, not every frame.

Counterplay transition:

- Leaving fog or using light/fire collapses offset.

Tests:

- offset refresh cadence.
- collapse state works against NPC target logic too.

### `FOG_SHARK`

Current: `fogSwimmer`, pack predator.

Goal: keep fog pack pressure but coordinate with pack owner in `ecology_9` only through helper contracts.

Implementation lane:

- This packet owns fog terrain speed/turn/damage and fire risk.
- `ecology_9` owns generic pack helper if extracted.

Counterplay transition:

- Leaving fog sharply cuts speed/turn/damage.
- Fire kills reliably but dangerous close.

Tests:

- fog/dry multiplier verified.
- pack share cap preserved if touched.

### `LISHENNYY`

Current: `lightFollower`.

Goal: light is lure and danger, not pure safety.

Implementation lane:

- Use local light item/feature scan with cadence and cap.
- Do not scan every item drop every frame.

Counterplay transition:

- Drop/disable light lure, use UV/counter item, break contact.

Tests:

- light target scan cap.
- contact decay event once per cooldown.

### `SPIRIT`

Current: phasing ghost-like pursuit.

Goal: walls/doors are not full safety, but movement/UV/distance matters.

Implementation lane:

- Prefer data/cue or tiny cooldown-bound phase behavior.
- Do not make all doors irrelevant for all monsters.

Counterplay transition:

- Movement before contact and UV disrupts pace.

Tests:

- baseline target scan still works.
- phase behavior does not require player target.

### `LOZHNYY_DUKH`

Current: `falsePhase`, one door phase with cooldown.

Goal: make one-pass-through-door readable and avoid repeat spam.

Implementation lane:

- Keep local door scan radius.
- If refactoring, share reveal/phase cooldown helper only with `SPIRIT` if useful.

Counterplay transition:

- Cold draft warning, open floor, UV or precise shot interrupts/weakens.

Tests:

- phase cooldown fixed.
- closed door pass does not become permanent wallhack.

## Samosbor line

Fog/dark monsters can be `amplified` by samosbor fog/darkness only if they read existing local fog/light facts. No custom samosbor refill. `FOG_SHARK`, `TUMANNIK`, `SHADOW`, `LISHENNYY` should become more dangerous through terrain state, not through hidden spawn logic.

## Validation

Run `npm run check`; browser validation only for visual/fog/light cue changes.
