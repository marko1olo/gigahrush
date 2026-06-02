# ecology_0: индекс параллельного апдейта экологии монстров

> Стартовый индексатор для GPT-5/Codex агентов.
>
> Роль: распределить имплементацию monster ecology по независимым пакетам, чтобы параллельные агенты не ломали новую full-pass AI систему и не конфликтовали в одних и тех же файлах.

## Обязательное чтение для каждого агента

Перед кодом каждый агент читает:

- `README.md`: фактическая карта shipped-систем.
- `AGENTS.md`: репозиторный контракт.
- `architecture.md`: слой ownership, AI/A-Life/floor boundaries.
- `ai.md`: current active-floor AI and tactic profile contract.
- `monsters.md`: current monster package contract and designer table.
- `ecology.md`: общий план апдейта экологии.
- Свой `ecology_N.md`.
- Релевантные source files под своим пакетом.

Если агент меняет player-facing text, он дополнительно читает `scenarist.md`. Если агент меняет save shape, он читает `save.md`, но текущий план должен избегать save-shape изменений.

## Неприкосновенная цель

Нельзя сломать живую эмерджентную AI систему:

- `updateAI()` остается единой full-pass точкой для live AI actors.
- NPC и монстры продолжают выбирать hostile targets не только вокруг игрока.
- NPC-vs-NPC, NPC-vs-monster и monster-vs-NPC combat остается настоящим: movement, HP, projectiles, marks, drops, events.
- Special behavior не заменяет baseline monster loop навсегда.
- Если special condition не активен, монстр должен fall back to `updateSimpleMonster()`.
- Никакого player bubble, far-freeze, hot/cold actor tiers or refill-to-cap.
- Никакого full-world/per-frame scan, per-actor BFS, DOM work or renderer-owned gameplay state.

## Распределение агентов

Primary owner означает: этот агент отвечает за дизайн и кодовые изменения monster kind. Другие агенты могут ссылаться на это поведение, но не правят его без координации.

| File | Agent packet | Primary monster kinds |
| --- | --- | --- |
| `ecology_1.md` | Cheap chasers and crowd pressure | `SBORKA`, `ZOMBIE`, `DIKIY_MERTVYAK`, `TRESKOTNIK`, `POLZUN` |
| `ecology_2.md` | Concrete, wall, debris predators | `TVAR`, `SHOVNIK`, `PANELNIK`, `REBAR`, `ZAKALENNAYA_ARMATURA`, `BETONOED`, `BETONNIK`, `RZHAVNIK` |
| `ecology_3.md` | Line, light, office and control threats | `EYE`, `LAMPOVY`, `LAMPOGLAZ`, `PARAGRAPH`, `KANTSELYARSKIY_IDOL`, `ROBOT`, `SLEPOGLAZ`, `PAUPSINA` |
| `ecology_4.md` | Fog, dark, phase predators | `SHADOW`, `TONKAYA_TEN`, `GLUBINNAYA_TEN`, `TUMANNIK`, `FOG_SHARK`, `LISHENNYY`, `SPIRIT`, `LOZHNYY_DUKH` |
| `ecology_5.md` | Water, slime and wet-line threats | `TUBE_EEL`, `LOTOCHNIK`, `VODYANOY_KOSHMAR`, `CHERNOSLIZ`, `TRUBNYY_AVTOMAT`, `SLIME_WOMAN` |
| `ecology_6.md` | Food, bait, corpse and document scent | `KRYSNOZHKA`, `POMOYNY_ROY`, `ZHORNAYA_TVAR`, `OLGOY`, `PECHATEED`, `KONTORSHCHIK`, `PROTOKOLNIK` |
| `ecology_7.md` | Sources, hives, rooted and room hazards | `MATKA`, `KHOROVAYA_MATKA`, `IDOL`, `BORSHCHEVIK`, `BLOOD_PLANT`, `SWARM`, `SPORE_CARPET`, `OBZHIVALSHCHIK` |
| `ecology_8.md` | Mimics, false people and conditional neutrals | `NELYUD`, `PSEUDOLIFT`, `BLACK_LIQUIDATOR`, `BEZEKHIY`, `SLIMEVIK`, `GNILUSHKA` |
| `ecology_9.md` | Parasites, packs, NET command | `HEAD_SLUG`, `MUKHOZHUK_HOST`, `CHERVIE_AVATAR`, `GREEN_DOG` |
| `ecology_10.md` | Heavy elites and bosses | `NIGHTMARE`, `KOSTOREZ`, `SAFEGUARD`, `SOBRANNYY`, `MANCOBUS`, `HERALD`, `CREATOR` |
| `ecology_11.md` | Final orchestrator | Merge order, shared helpers, audit, validation and conflict resolution |

Coverage: all 67 current `MonsterKind` values are assigned exactly once.

## Shared implementation lanes

Agents should choose the cheapest lane that produces real behavior:

1. Data/readability only: `src/data/monster_ecology.ts`, rumors, cues, tests.
2. Existing `aiFlag`: reuse current rules before adding new flags.
3. New shared flag/helper: only when at least two monsters in one family need it.
4. `ActorTacticProfile`: bounded multi-phase behavior with sense radius/cap/cadence.
5. Narrow generic system: source/hazard/stimulus helper shared across families.
6. Save shape: avoid unless a persistent consequence cannot be represented otherwise.

Preferred new shared helpers, if needed:

- `monster_stimulus.ts`: compact local stimuli vocabulary.
- `monster_terrain.ts`: local wall/light/fog/water/door checks.
- `monster_pack.ts`: capped target share and deterministic slotting.
- `monster_sources.ts`: capped source/hive child accounting.
- `monster_debug.ts`: sampled debug facts, no unbounded trace.

These helpers are suggestions, not mandatory architecture. If one file change in `monster.ts` is smaller and cleaner, keep it small.

## File conflict protocol

High-conflict files:

- `src/systems/ai/monster.ts`
- `src/systems/ai/tactics.ts`
- `src/entities/monster.ts`
- `src/data/monster_ecology.ts`
- `src/core/types.ts`

Rules:

- Prefer adding small helper files under `src/systems/ai/` or `src/systems/` over broad edits in `monster.ts`.
- Do not add new `MonsterKind` values for this pass.
- Do not change public `MonsterAIFlag` names owned by another agent.
- If adding a generic helper that another packet needs, document its API in the PR/final response and keep it family-neutral.
- If two agents need the same helper, first agent creates the minimum generic helper; second agent reuses it without refactoring.

## Standard patch shape

For each agent:

1. Read intake docs and relevant current tests.
2. Audit current behavior for assigned monsters from `MonsterDef`, `MONSTER_ECOLOGY`, `aiFlags`, `monster.ts`, `tactics.ts`, tests.
3. Implement one small shared family helper or profile if needed.
4. Polish assigned monsters one by one.
5. Add or update focused tests.
6. Run `npm run check` for AI behavior changes.
7. Report exact validation and residual risks.

## Global acceptance checklist

For every changed monster:

- It still targets NPCs/monsters when hostility says so.
- It still works when the player is not the target.
- It falls back to baseline behavior outside its special phase.
- It has cue, counterplay and event/log/rumor/debug visibility.
- Every scan has radius, cap and cadence.
- It uses `entity_index` and existing pathfinding; no per-actor BFS.
- It does not create ordinary population refill.
- It has samosbor behavior or explicit exemption.
- It does not change save shape unless unavoidable.
- It has a test or debug route.

## Orchestrator responsibility

`ecology_11.md` owns the final pass:

- check every `MonsterKind` is still covered;
- look for duplicate helper abstractions;
- verify no agent broke AI isotropy;
- run broad validation;
- update `ecology.md`, `monsters.md` and README only for shipped facts after code lands.
