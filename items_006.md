# Items 006: gasmask_filter

Status: single-item parallel worker plan, not shipped behavior. Created 2026-05-24.

Use this file as the complete brief for one GPT-5.5 subagent. That subagent owns only `gasmask_filter` and must not opportunistically implement neighboring items.

## Mandatory Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `items_orchestrator.md`
- Source plan row(s):
- items_1.md:74 (Liquidator cleanup, PPE and samosbor field gear)

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
| id | `gasmask_filter` |
| Russian name | Фильтр противогаза |
| mode | improve |
| intended type | MISC |
| gameplay role | Consumable protection pressure |
| reachability target | Medical, storage, liquidator stash |
| implementation note | Map to tools or new filter resource only if orchestrator approves. |

## Source Starting Points

- https://samosborarchive.fandom.com/ru/wiki/Ликвидаторы
- https://samosborarchive.fandom.com/ru/wiki/Противогаз
- https://samosborarchive.fandom.com/ru/wiki/Слизь
- https://samosb0r.fandom.com/ru/wiki/Ликвидаторы
- https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы

Do not copy numeric balance from external sources. Convert lore into existing mechanics: type, tags, value, spawn access, resource pressure, use handler, recipe, contract or event.

## Parallel Write Scope

Preferred isolated output after the orchestrator registry pre-pass:

- src/data/item_packs/gasmask_filter.ts

Optional integration surface, only if explicitly assigned and safe:

- src/systems/liquidator_cleanup_items.ts

If the pack registry pre-pass has not happened, do not make broad central-registry edits in a 200-agent parallel run. Either stop after a data draft or coordinate with the orchestrator for a sequential slot.

## Implementation Contract

- Add or improve only `gasmask_filter`.
- Keep existing ids stable; do not rename unrelated items.
- Use existing `ItemType` values; do not add a new enum.
- Give the item a real reachable path matching the row above.
- Give the player one decision around the item: buy, steal, repair, seal, forge, report, hide, trade, burn, use, bait, save or spend.
- Keep Russian player-facing text canonical and concise.
- Use ids/tags/events for cross-system communication, not display-name lookups.
- Do not add content-specific logic to `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.

## Type-Specific Checks

- Use tags such as `document`, `permit`, `sample`, `contraband`, `evidence`, `forgery`, `repair`, `resource` only when gameplay reads them.
- If this is a document or sample, make sure it has a handoff, access, audit, trade or evidence decision.

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

- Whether `gasmask_filter` was added, improved, merged into an existing id or rejected.
- Exact file paths changed.
- The reachability path.
- Resource/economy mapping or reason it is exempt.
- Whether it touches weapons, ammo, PSI, A-Life, factions, economy, quests, events, save/load, localization or render.
- Checks run and results.
