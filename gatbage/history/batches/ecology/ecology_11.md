# ecology_11: финальный оркестратор экологии монстров

> Last orchestrator plan.
>
> Роль: принять результаты параллельных ecology agents, убрать дубли, проверить покрытие всех монстров, сохранить full-pass emergent AI and ship one coherent implementation.

## Intake

Read every plan and shipped source:

- `README.md`
- `AGENTS.md`
- `architecture.md`
- `ai.md`
- `monsters.md`
- `ecology.md`
- `ecology_0.md` through `ecology_10.md`
- all changed diffs from parallel agents

Do not start by refactoring. First audit what changed.

## Merge order

Recommended order:

1. Data-only ecology/cue changes.
2. New focused tests.
3. Low-conflict helper files.
4. `src/systems/ai/tactics.ts` profile additions.
5. `src/systems/ai/monster.ts` narrow integrations.
6. `src/entities/monster.ts` or `MonsterAIFlag` changes.
7. Docs updates after behavior is verified.

If two agents added similar helpers, keep the smaller one that matches existing style and delete/merge the duplicate before broad validation.

## Coverage audit

Verify all 67 current monster kinds are still represented:

```txt
SBORKA
TVAR
POLZUN
BETONNIK
ZOMBIE
EYE
NIGHTMARE
SHADOW
REBAR
MATKA
IDOL
MANCOBUS
HERALD
CREATOR
SPIRIT
ROBOT
SHOVNIK
LAMPOVY
PECHATEED
TUBE_EEL
PARAGRAPH
NELYUD
KRYSNOZHKA
KOSTOREZ
SAFEGUARD
BLACK_LIQUIDATOR
KHOROVAYA_MATKA
SLIMEVIK
SOBRANNYY
ZHORNAYA_TVAR
BEZEKHIY
PSEUDOLIFT
SLEPOGLAZ
OLGOY
VODYANOY_KOSHMAR
LAMPOGLAZ
TUMANNIK
CHERNOSLIZ
RZHAVNIK
BETONOED
PANELNIK
PAUPSINA
BORSHCHEVIK
OBZHIVALSHCHIK
HEAD_SLUG
PROTOKOLNIK
DIKIY_MERTVYAK
KONTORSHCHIK
TONKAYA_TEN
KANTSELYARSKIY_IDOL
LOZHNYY_DUKH
CHERVIE_AVATAR
POMOYNY_ROY
TRUBNYY_AVTOMAT
LOTOCHNIK
TRESKOTNIK
ZAKALENNAYA_ARMATURA
GLUBINNAYA_TEN
GREEN_DOG
SLIME_WOMAN
GNILUSHKA
MUKHOZHUK_HOST
FOG_SHARK
BLOOD_PLANT
SWARM
SPORE_CARPET
LISHENNYY
```

Use source, not memory, for final counts:

- `MonsterKind` enum in `src/core/types.ts`
- `MONSTERS` in `src/entities/monster.ts`
- `MONSTER_ECOLOGY` in `src/data/monster_ecology.ts`
- `monsters.md` designer table if updated

## Emergence audit

For every merged behavior, check:

- Does monster target selection still allow NPC targets?
- Does NPC combat still run before/around monster behavior as designed?
- Does a tactic profile return `handled` only while it truly replaces the baseline step?
- Does baseline monster behavior resume after special phase?
- Are events compact and cooldown-bound?
- Are all scans radius/cap/cadence bounded?
- Are source/pack/parasite children capped and checked against entity soft limits?
- Does samosbor reaction avoid hidden refill?
- Did any agent add player-only behavior where entity-oriented logic would work?

## Helper audit

Accepted helpers should be generic and minimal:

- `monster_terrain`: local terrain facts, no global scan.
- `monster_stimulus`: compact local stimulus, short TTL, source tags.
- `monster_pack`: capped share/pulse/slots.
- `monster_sources`: source cap and child accounting.
- `monster_debug`: sampled debug facts only.

Reject helpers that:

- own gameplay outside `updateAI()`;
- maintain global live monster controllers;
- scan full floor every frame;
- allocate large arrays per actor;
- serialize transient tactics;
- duplicate existing `entity_index`, `pathfinding`, `events`, `noise`, `monster_bait`, `document_scent` or `cell_hazards`.

## Test strategy

Minimum final gate for any runtime AI change:

```bash
npm run check
```

Add targeted tests before relying on broad `check`:

- full-pass remote actor regression;
- monster can target NPC;
- special scan cadence/cap;
- counterplay changes state;
- source/pack child cap;
- samosbor reaction is not refill;
- save shape unchanged unless intentionally bumped.

Run `npm run check:browser` if visual/HUD/render/projectile cue changes risk browser behavior.

## Docs update after merge

Only after code is verified:

- Update `monsters.md` for shipped monster behavior facts.
- Update `ecology.md` from plan to current roadmap if needed.
- Update `README.md` only for shipped implementation facts and verified counts.
- Do not promise unimplemented ecology fields in README.

## Stop conditions

Block merge and send back to the owning packet if:

- it adds per-frame full-world or full-entities scans;
- it breaks non-player target behavior;
- it introduces population refill;
- it creates a new `MonsterKind` for a set-piece that can be expressed by existing kind/content;
- it puts content-specific behavior in `main.ts`, `core/world.ts` or render;
- it changes save shape without bump/rejection/tests;
- it passes only with unrelated dirty generated artifacts.

## Final report shape

The orchestrator final response should list:

- files changed;
- monster families completed;
- shared helpers kept;
- helper duplicates removed;
- validations run;
- known residual risks;
- docs updated only for shipped facts.
