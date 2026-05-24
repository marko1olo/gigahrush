# Items 188: plastic_sheet

Status: single-item parallel worker plan, not shipped behavior. Created 2026-05-24.

Use this file as the complete brief for one GPT-5.5 subagent. That subagent owns only `plastic_sheet` and must not opportunistically implement neighboring items.

## Mandatory Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `items_orchestrator.md`
- Source plan row(s):
- items_5.md:101 (Trade, production, contraband, electronics and resident goods)

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
| id | `plastic_sheet` |
| Russian name | Пластик |
| mode | new |
| intended type | MISC |
| gameplay role | Craft material |
| reachability target | Vending/production |
| implementation note | Resource electronics/tools. |

## Source Starting Points

- https://samosborarchive.fandom.com/ru/wiki/Завод
- https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- https://samosb0r.fandom.com/ru/wiki/Железные_дороги
- https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы
- https://samosborminecraft.fandom.com/ru/wiki/Автомагазин
- https://samosborminecraft.fandom.com/ru/wiki/Чертежи

Do not copy numeric balance from external sources. Convert lore into existing mechanics: type, tags, value, spawn access, resource pressure, use handler, recipe, contract or event.

## Parallel Write Scope

Preferred isolated output after the orchestrator registry pre-pass:

- src/data/item_packs/plastic_sheet.ts

Optional integration surface, only if explicitly assigned and safe:

- src/data/factories.ts only if orchestrator assigns recipe integration

If the pack registry pre-pass has not happened, do not make broad central-registry edits in a 200-agent parallel run. Either stop after a data draft or coordinate with the orchestrator for a sequential slot.

## Implementation Contract

- Add or improve only `plastic_sheet`.
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

- Whether `plastic_sheet` was added, improved, merged into an existing id or rejected.
- Exact file paths changed.
- The reachability path.
- Resource/economy mapping or reason it is exempt.
- Whether it touches weapons, ammo, PSI, A-Life, factions, economy, quests, events, save/load, localization or render.
- Checks run and results.
