# ecology_9: parasites, packs and NET command

> Parallel worker plan.
>
> Primary owner: `HEAD_SLUG`, `MUKHOZHUK_HOST`, `CHERVIE_AVATAR`, `GREEN_DOG`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `alife.md`, `online.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- `src/entities/head_slug.ts`
- `src/entities/mukhozhuk.ts`
- `src/entities/chervie_avatar.ts`
- `src/entities/green_dog.ts`
- `src/systems/ai/monster.ts`
- `src/systems/combat_stimulus.ts`
- `src/systems/noise.ts`
- `src/systems/events.ts`
- `tests/monster_06_head_slug.test.ts`
- `tests/monster_14_mukhozhuk.test.ts`
- tests for `GREEN_DOG`/NET avatars

## Mission

Make local command, infection/host and pack behavior powerful but strictly capped. This packet must be extra careful not to create uncontrolled identity changes or all-to-all brains.

## Shared family rule

Family archetypes: `parasite_controller`, `pack_hunter`, `local_command`, `net_source_avatar`.

Implementation principles:

- Pack/command uses `queryRadiusCapped`.
- Infection/host transfer uses fixed radius/cap/cooldown.
- No new ordinary A-Life identity creation.
- If a host persists, use existing persistent identity/foldback rules; do not mutate A-Life pool directly from AI.
- NET/source power reads local screen/server/apparatus facts.

Potential shared helper:

```txt
shareLocalTarget(actor, target, radius, cap, cooldown, predicate)
  capped neighbor query
  writes combatTargetId only to matching actors
  returns shared count for event/debug
```

Coordinate with `ecology_4` for `FOG_SHARK`, but this packet owns any generic pack helper.

## Monster plan

### `HEAD_SLUG`

Current: `hostParasite`, host/detached stages.

Goal: host transfer is scary, visible and capped.

Implementation lane:

- Preserve `HEAD_SLUG_HOSTED_STAGE` and `HEAD_SLUG_DETACHED_STAGE`.
- Use existing rehost radius/caps.
- No new identity creation.

Counterplay transition:

- Kill host at distance.
- Fire/UV/hermetic separation delays transfer.
- Finish detached slug before it reaches corpse/stunned NPC.

Tests:

- rehost cap/radius.
- detached stage and host stage remain bounded.

### `MUKHOZHUK_HOST`

Current: `parasiteLeader`, `foodBait`.

Goal: parasite authority gives local bad commands, not global mind control.

Implementation lane:

- Keep command radius/cap/cooldown.
- Command only local NPCs matching current hostility/social rules.
- Food/guard/document behavior remains local.

Counterplay transition:

- Prevent host reaching guards/food/crowd.
- Expose/quarantine with witnesses if content supports.

Tests:

- command max NPC cap.
- command does not affect entire floor.

### `CHERVIE_AVATAR`

Current: `netPossessor`, screen/server source avatar.

Goal: NET avatar is strong near source, weak when disconnected.

Implementation lane:

- Use existing `findChervieNetSource()` and source radius.
- Mind pulse uses radius/cap/cooldown.
- Coordinate with Net Sphere optionality: local single-player must work offline.

Counterplay transition:

- Break line/source, disable apparatus, use energy/GBE if available.

Tests:

- powered vs cut multiplier.
- pulse cap and cooldown.

### `GREEN_DOG`

Current: `packHowl`, `noiseFear`, `foodBait`.

Goal: door-pack predator whose pack can be broken by loud metal/noise.

Implementation lane:

- Preserve current capped pack share and noise fear.
- If adding shared pack helper, migrate only after tests pass.

Counterplay transition:

- Loud metal, valve, noise can or shotgun scares/breaks pack.
- Food can lure but may call garbage threats.

Tests:

- pack share cap.
- scary noise causes flee without player-only branch.
- target sharing uses cooldown.

## Samosbor line

Pack/parasite/NET monsters can be `amplified` by panic only through local actors/sources. No off-floor infection simulation. No A-Life pool mutation unless a separate explicit persistent consequence is designed and tested.

## Validation

Run `npm run check`; add save/A-Life tests only if persistent host consequences are introduced, which this pass should avoid.
