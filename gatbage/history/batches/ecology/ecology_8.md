# ecology_8: mimics, false people and conditional neutrals

> Parallel worker plan.
>
> Primary owner: `NELYUD`, `PSEUDOLIFT`, `BLACK_LIQUIDATOR`, `BEZEKHIY`, `SLIMEVIK`, `GNILUSHKA`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `interactive.md`, `quests.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- `src/systems/slimevik.ts`
- `src/systems/gnilushka.ts`
- `src/systems/events.ts`
- `tests/monster_02_gnilushka.test.ts`
- `tests/monster_07_pseudolift.test.ts`
- `tests/monster_08_black_liquidator.test.ts`
- tests for false neighbors/door voices

## Mission

Preserve social uncertainty and conditional neutrality. These monsters should not all become immediate aggro mobs. Their ecology is reveal, restraint, witness, distance, door/threshold, sample, food/medicine or report.

## Shared family rule

Family archetypes: `mimic_threshold`, `false_patrol`, `door_ambusher`, `route_trap`, `conditional_neutral`.

Implementation principles:

- Reveal conditions are local and readable.
- Neutral phase must still participate in world events where relevant.
- Once revealed/provoked, baseline monster combat should handle most of the fight.
- Player-facing talk/options must not create a monster-only UI fork if existing interaction systems fit.
- Do not serialize long behavior histories.

Potential shared helper:

```txt
mimicRevealCheck(actor, context)
  distance
  light/witness
  door/container/sample
  recent damage
  reveal reason
```

Only add if it reduces duplicate reveal code.

## Monster plan

### `NELYUD`

Current: `closeReveal`, false human.

Goal: suspicion/distance/light/witness preserve choice before reveal.

Implementation lane:

- Keep close reveal local.
- Optional witness/light cue if cheap.

Counterplay transition:

- Maintain distance, bring witness/light, keep exit.
- Revealed state falls back to baseline combat.

Tests:

- close reveal threshold.
- revealed monster can target NPC if hostile.

### `PSEUDOLIFT`

Current: elevator mimic trap, route interaction.

Goal: route trap with inspection/bait/retreat decisions.

Implementation lane:

- Keep authored/lift route hooks local.
- Do not add `FloorLevel`.
- Do not hardcode transition logic in `main.ts`.

Counterplay transition:

- Inspect wrong panel/wet threshold, throw bait, back out of lift vestibule.

Tests:

- suspect event before spawn/attack.
- no route enum expansion.

### `BLACK_LIQUIDATOR`

Current: `falsePatrol`.

Goal: false cleanup patrol with sample/distance/door reveal.

Implementation lane:

- Keep local door/sample/distance reveal checks.
- If patrol knock emits events, cap cooldown.

Counterplay transition:

- Keep distance, hide samples, verify mask number, do not open door.

Tests:

- reveal reasons are local.
- neutral patrol phase does not attack immediately.

### `BEZEKHIY`

Current: `deadEcho`, door-threshold ambusher.

Goal: threshold/spine-to-door mistake is readable.

Implementation lane:

- Keep local door scan radius.
- Add cue/death hint if missing.

Counterplay transition:

- Close door, check jamb, pass threshold backwards/with sight.

Tests:

- door threshold scan cap.
- direct look reduces bonus if current behavior supports it.

### `SLIMEVIK`

Current: `slimeScavenger`, neutral slime scavenger.

Goal: barter/feed/sample/avoid, not always kill.

Implementation lane:

- Keep behavior in `systems/slimevik.ts`.
- Use events and existing interaction paths.
- Do not convert to aggressive baseline unless provoked.

Counterplay transition:

- Feed/trade/sample; do not corner.
- Injured slimevik flees or weakly defends.

Tests:

- neutral first contact.
- bad status reaction event still bounded.

### `GNILUSHKA`

Current: `defensiveNeutral`, talks/flees/fights in corner.

Goal: moral/ecological choice: help/sample/report/violence.

Implementation lane:

- Keep behavior in `systems/gnilushka.ts`.
- Avoid generic monster aggro until provoked.

Counterplay transition:

- Calm talk, food/medicine/sample container, give exit.
- Violence/corner causes dangerous defense.

Tests:

- first contact does not attack.
- corner/provoked state changes behavior.

## Samosbor line

Mimics can be `displaced` or `born` by samosbor only through explicit events. Conditional neutrals can become shelter-conflict actors, but do not auto-hostile all neutral mutants during samosbor unless a visible reason exists.

## Validation

Run `npm run check`. If interaction text/options change broadly, also run localization audit/report only if the task changes locale data or broad player-facing strings.
