# Items 107: blueprint_t3_folder

Status: single-item parallel worker plan, not shipped behavior. Created 2026-05-24.

Use this file as the complete brief for one GPT-5.5 subagent. That subagent owns only `blueprint_t3_folder` and must not opportunistically implement neighboring items.

## Mandatory Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `items_orchestrator.md`
- Source plan row(s):
- items_3.md:99 (Documents, permits, bureaucracy and access goods)
- items_5.md:72 (Trade, production, contraband, electronics and resident goods)

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
| id | `blueprint_t3_folder` |
| Russian name | Папка чертежей Т3 |
| mode | new |
| intended type | MISC |
| gameplay role | Rare recipe unlock |
| reachability target | Frozen item/deep route |
| implementation note | Coordinate with items_5. |

## Duplicate/Merged Source Rows

This concrete item appeared in multiple domain plans. Merge the intent, do not create multiple ids.

- items_3.md:99: Rare recipe unlock; Coordinate with items_5.
- items_5.md:72: Rare recipe unlock; High-value, stack 1.

## Source Starting Points

- https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- https://samosb0r.fandom.com/ru/wiki/Концентрат
- https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы
- https://samosb0r.fandom.com/ru/wiki/Железные_дороги
- https://samosborarchive.fandom.com/ru/wiki/Завод
- https://samosborminecraft.fandom.com/ru/wiki/Автомагазин
- https://samosborminecraft.fandom.com/ru/wiki/Чертежи

Do not copy numeric balance from external sources. Convert lore into existing mechanics: type, tags, value, spawn access, resource pressure, use handler, recipe, contract or event.

## Parallel Write Scope

Preferred isolated output after the orchestrator registry pre-pass:

- src/data/item_packs/blueprint_t3_folder.ts

Optional integration surface, only if explicitly assigned and safe:

- src/data/permits.ts only if orchestrator assigns this item a sequential slot
- src/data/factories.ts only if orchestrator assigns recipe integration

If the pack registry pre-pass has not happened, do not make broad central-registry edits in a 200-agent parallel run. Either stop after a data draft or coordinate with the orchestrator for a sequential slot.

## Implementation Contract

- Add or improve only `blueprint_t3_folder`.
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

- Whether `blueprint_t3_folder` was added, improved, merged into an existing id or rejected.
- Exact file paths changed.
- The reachability path.
- Resource/economy mapping or reason it is exempt.
- Whether it touches weapons, ammo, PSI, A-Life, factions, economy, quests, events, save/load, localization or render.
- Checks run and results.
