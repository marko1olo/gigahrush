# Addmonster Index

## Scope

External research pass for missing Samosbor/Gigahrush creatures. Sources are unstable and often contradictory, so each plan turns a repeated motif into a bounded game rule instead of copying lore text.

Current game coverage checked against `README.md`, `architecture.md`, `src/core/types.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, the obsolete/current-at-writing `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, and targeted `rg` searches.

## Hard Rule

No mechanical subspecies, no derived monsters, no universal modifier layer.

Lore may call creatures relatives, strains, or local names. Code must still implement every monster as a standalone package: own `MonsterKind`, definition, sprite, ecology, rumors, AI hook, events, reachability, and tests where needed.

## Parallel Agent Orchestration

These files are written for one GPT-5.5 worker per `addmonster_N.md`.

Wave A can run in parallel: `addmonster_01.md` through `addmonster_42.md`. Each worker owns only the monster in its file. Private package files are safe to create in parallel; shared registry edits must be minimal, append-only, and conflict-resolved by preserving every other worker's additions.

Wave B is serial: `addmonster_43.md`. It owns the runtime migration that deletes the old mechanical subtype layer. It was originally written as the final pass after Wave A, but it may also run between an incomplete first Wave A and a repeat Wave A. In that mode it must preserve every partial standalone monster already present and leave a clear handoff for repeat workers to finish missing per-monster pieces.

Repeat Wave A mode:

- Treat `addmonster_01.md` through `addmonster_42.md` as audit/completion prompts, not clean-room prompts.
- Each worker must first search the current tree for its planned `MonsterKind`, sprite module, display name, old source id, authored POI, AI hook, and tests.
- If partial work exists, keep its established ids and finish the missing `Done` items instead of adding a duplicate monster package.
- If `addmonster_43.md` already removed `monsterVariantId`, `MONSTER_VARIANTS`, and `src/data/monster_variants.ts`, repeat workers must not re-add them. Any leftover old references become direct `MonsterKind`, encounter tags, or authored module state.
- Shared-file conflict resolution is conservative: keep one canonical entry for the assigned monster, preserve unrelated monsters, and avoid sorting/refactor churn.

Common worker contract:

- Read `AGENTS.md`, `README.md`, `architecture.md`, this index, then the assigned `addmonster_N.md`.
- Do not edit another worker's monster package, another `addmonster_N.md`, or unrelated floor/content systems.
- Do not introduce or revive `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, mechanical prefixes, or derived monster stats.
- If a shared file conflicts, keep both monsters' additions and avoid sorting/refactoring churn.
- Final report must list changed paths, the new or existing `MonsterKind`, reachability/debug path, tests run, whether this was a fresh implementation or repeat completion, and any deferred integration work.

## Plans Created

| File | Candidate | Implementation shape |
| --- | --- | --- |
| `addmonster_01.md` | Собранный человек | Rare post-samosbor composite brute |
| `addmonster_02.md` | Гнилушка | Non-hostile/defensive anomaly-mutant |
| `addmonster_03.md` | Зеленая собака | Mossy pack predator with sound counterplay |
| `addmonster_04.md` | Туманные акулы | Air-swimming fog pack, fire-explosive |
| `addmonster_05.md` | Жижевая женщина | Toxic slime humanoid in water/sewers |
| `addmonster_06.md` | Головной слизень | Parasite that steals host skills |
| `addmonster_07.md` | Псевдолифт | Elevator mimic encounter |
| `addmonster_08.md` | Черные ликвидаторы | False post-samosbor cleanup patrol |
| `addmonster_09.md` | Ковер | Floating spore carpet hazard-creature |
| `addmonster_10.md` | Рой | Vent/void swarm with local queen source |
| `addmonster_11.md` | Слизневик | Slime symbiote/scavenger with bargain risk |
| `addmonster_12.md` | Лишенный | Deep shadow guardian following light |
| `addmonster_13.md` | Олгой-Хорхой | Giant meat worm in collectors/void pipes |
| `addmonster_14.md` | Мухожук | Parasitic command-host mutation |
| `addmonster_15.md` | Кровавое растение | Hivemind plant, red mold social infection |
| `addmonster_16.md` | Борщевик | Mobile/rooting hostile plant |
| `addmonster_17.md` | Паупсина | Wild service-spider monster |
| `addmonster_18.md` | Червие | Net-borne AI serpent/avatar encounter |
| `addmonster_19.md` | Комнатный обживальщик | Room-bound aberration that grows organic walls |
| `addmonster_20.md` | Трескотник | Brittle crack sprinter with interruptible windup |
| `addmonster_21.md` | Туманник | Fog-pocket ambusher with displaced silhouette |
| `addmonster_22.md` | Лоточник | Wet drain crawler with dry-ground weakness |
| `addmonster_23.md` | Безэхий | Door-threshold ambusher with suppressed warning |
| `addmonster_24.md` | Панельник | Wall-braced bruiser that loses power in open floor |
| `addmonster_25.md` | Жорная Тварь | Food-scent predator with baitable overcommit |
| `addmonster_26.md` | Конторщик | Document-scent Ministry undead |
| `addmonster_27.md` | Дикий Мертвяк | Fragile crowd-runner and door-jam panic source |
| `addmonster_28.md` | Слепоглаз | Blind-fire turret aimed at last sound |
| `addmonster_29.md` | Чернослиз | Black-water ambush eye as its own monster |
| `addmonster_30.md` | Лампоглаз | Light-linked ranged eye |
| `addmonster_31.md` | Закаленная Арматура | Heavy armor-strip melee elite |
| `addmonster_32.md` | Ржавник | Scrap-disguise warehouse ambusher |
| `addmonster_33.md` | Глубинная Тень | Deep shadow with delayed second beat |
| `addmonster_34.md` | Тонкая Тень | Cowardly lure into prepared dark line |
| `addmonster_35.md` | Протокольник | Document-pressure Ministry nightmare |
| `addmonster_36.md` | Водяной Кошмар | Water-line PSI predator |
| `addmonster_37.md` | Хоровая Матка | Choir-countdown spawner |
| `addmonster_38.md` | Канцелярский Идол | Office-field stationary PSI monster |
| `addmonster_39.md` | Трубный Автомат | Wet-corridor plasma machine |
| `addmonster_40.md` | Ложный Дух | Door-ignoring flanker |
| `addmonster_41.md` | Помойный Рой | Food-attracted garbage swarm |
| `addmonster_42.md` | Бетоноед | Standalone weak-wall breacher |
| `addmonster_43.md` | Remove Mechanical Subspecies | Runtime migration plan to delete modifier layer |

## Already Covered, No New Plan

- `Косторезы`: represented by `MonsterKind.KOSTOREZ` and `src/gen/maintenance/kostorez_locker.ts`. The source telepathic lore differs, but the game has a named readable elite already.
- Base `Крысоножки`: represented by `MonsterKind.KRYSNOZHKA`, bait logic, and swarm events. Garbage swarm content is split into `addmonster_41.md`.
- `Нелюди`: represented by `MonsterKind.NELYUD`, close reveal behavior, and "Голос за дверью" content.
- `Лифтовая арахна`: represented by `src/systems/lift_arachna.ts` as a bounded named threat using existing monster plumbing.
- `Хладоны`: represented by Hladon cold pockets and `hladonets` content.
- `Плотоядные грибы`: represented by shared/living fungus room generation and `src/systems/carnivorous_fungus.ts`.
- `Гермоточильщики`: represented by `src/systems/hermodoor_borer.ts`.

## Skipped

- `Твари`, `Мутанты`, `Аберрации`: broad classes, not single monsters. `Комнатный обживальщик` is the one concrete aberration extracted into a plan.
- `Чернобог`: deity/social-religious pattern, not a killable monster.
- `Автоны`, `Солдат в солдате`: better as NPC/faction/anomaly content or future standalone robot/human packages, not immediate monster kinds.
- `Крассусматер`, `Акулина`, `Пуффин-Фуффин`: too thin, too memetic, or not monster-shaped enough for a gameplay plan in this pass.

## Source Set

- Samosbor Wiki: https://samosbors8878.fandom.com/ru/wiki/Самосбор
- Samosbor Wiki, mutants and OПС: https://samosbors8878.fandom.com/ru/wiki/Мутанты
- Samosbor Wiki, Собранный человек: https://samosbors8878.fandom.com/ru/wiki/Собранный_человек
- Samosb0r Wiki, Гнилушка: https://samosb0r.fandom.com/ru/wiki/Гнилушка
- Samosb0r Wiki, Червие: https://samosb0r.fandom.com/ru/wiki/Червие
- Neo-Samosbor Wiki, Бетоноеды and Борщевик: https://neosamosbor.fandom.com/ru/wiki/Бетоноеды and https://neosamosbor.fandom.com/ru/wiki/Борщевик
- Khrushchepedia/ShoutWiki index and creature pages, accessed through wiki API when normal HTML was blocked by Anubis: https://samosbor.shoutwiki.com/
- ShoutWiki, Твари: https://samosbor.shoutwiki.com/wiki/Твари
- ShoutWiki pages used directly: `Зелёная_Собака`, `Лишенные`, `Олгой-Хорхой`, `Мухожук`, `Кровавые_растения`, `Паупсина`, `Аберрации`.
- Local obsolete registry audited for `addmonster_20.md` through `addmonster_42.md`: `src/data/monster_variants.ts`.
