# Items 136: burn_gel

Status: single-item parallel worker plan, not shipped behavior. Created 2026-05-24.

Use this file as the complete brief for one GPT-5.5 subagent. That subagent owns only `burn_gel` and must not opportunistically implement neighboring items.

## Mandatory Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `items_orchestrator.md`
- Source plan row(s):
- items_4.md:92 (NII sampleware, slime, medicine, food and anomaly loot)

Also inspect current source before changing anything:

- `src/data/items.ts`
- `src/data/weapons.ts` if this is or touches a weapon
- `src/data/psi.ts` if this is or touches PSI
- `src/data/resources.ts` if scarcity/economy should see it
- `src/systems/inventory.ts` if it needs active use behavior
- relevant tests under `tests/`

## Candidate

| Field | Value |
| --- | --- |
| id | `burn_gel` |
| Russian name | Противоожоговый гель |
| mode | new |
| intended type | MEDICINE |
| gameplay role | Fire/slime burn treatment |
| reachability target | Medical/HQ |
| implementation note | Small HP, tag burn. |

## Source Starting Points

- https://samosborarchive.fandom.com/ru/wiki/Слизь
- https://samosborarchive.fandom.com/ru/wiki/НИИ
- https://samosborarchive.fandom.com/ru/wiki/Газ
- https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- https://samosb0r.fandom.com/ru/wiki/Концентрат
- https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы

Do not copy numeric balance from external sources. Convert lore into existing mechanics: type, tags, value, spawn access, resource pressure, use handler, recipe, contract or event.

## Parallel Write Scope

Preferred isolated output after the orchestrator registry pre-pass:

- src/data/item_packs/burn_gel.ts

Optional integration surface, only if explicitly assigned and safe:

- src/systems/sampleware_items.ts only for generic sample behavior

If the pack registry pre-pass has not happened, do not make broad central-registry edits in a 200-agent parallel run. Either stop after a data draft or coordinate with the orchestrator for a sequential slot.

## Implementation Contract

- Add or improve only `burn_gel`.
- Keep existing ids stable; do not rename unrelated items.
- Use existing `ItemType` values; do not add a new enum.
- Give the item a real reachable path matching the row above.
- Give the player one decision around the item: buy, steal, repair, seal, forge, report, hide, trade, burn, use, bait, save or spend.
- Keep Russian player-facing text canonical and concise.
- Use ids/tags/events for cross-system communication, not display-name lookups.
- Do not add content-specific logic to `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.

## Type-Specific Checks

- Keep use effects bounded and consistent with existing `feed`, `drink`, `medicine` and PSI medicine patterns.
- Do not add a new status system unless the orchestrator explicitly assigns it.

## Validation

Minimum for data-only implementation:

```bash
npm run typecheck
```

Preferred after source changes:

```bash
npm run check
```

Also run `npm run check:browser` if this item changes projectile visuals, HUD behavior, input/use interactions or browser rendering.

## Final Worker Report

Report back:

- Whether `burn_gel` was added, improved, merged into an existing id or rejected.
- Exact file paths changed.
- The reachability path.
- Resource/economy mapping or reason it is exempt.
- Whether it touches weapons, ammo, PSI, A-Life, factions, economy, quests, events, save/load, localization or render.
- Checks run and results.
