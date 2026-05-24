# Items 052: granit4u_belt_shotgun

Status: single-item parallel worker plan, not shipped behavior. Created 2026-05-24.

Use this file as the complete brief for one GPT-5.5 subagent. That subagent owns only `granit4u_belt_shotgun` and must not opportunistically implement neighboring items.

## Mandatory Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `items_orchestrator.md`
- Source plan row(s):
- items_2.md:102 (Liquidator weapons, ammo and combat roles)

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
| id | `granit4u_belt_shotgun` |
| Russian name | «Гранит»-4у |
| mode | new |
| intended type | WEAPON |
| gameplay role | Crowd-control shotgun |
| reachability target | Deep liquidator reward |
| implementation note | Balance via reload/cooldown, no free dominance. |

## Source Starting Points

- https://samosborarchive.fandom.com/ru/wiki/Ликвидаторы
- https://samosb0r.fandom.com/ru/wiki/Ликвидаторы
- https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы

Do not copy numeric balance from external sources. Convert lore into existing mechanics: type, tags, value, spawn access, resource pressure, use handler, recipe, contract or event.

## Parallel Write Scope

Preferred isolated output after the orchestrator registry pre-pass:

- src/data/item_packs/granit4u_belt_shotgun.ts plus src/data/weapon_packs/granit4u_belt_shotgun.ts for weapons

Optional integration surface, only if explicitly assigned and safe:

- src/data/resources.ts for ammo/fuel mapping

If the pack registry pre-pass has not happened, do not make broad central-registry edits in a 200-agent parallel run. Either stop after a data draft or coordinate with the orchestrator for a sequential slot.

## Implementation Contract

- Add or improve only `granit4u_belt_shotgun`.
- Keep existing ids stable; do not rename unrelated items.
- Use existing `ItemType` values; do not add a new enum.
- Give the item a real reachable path matching the row above.
- Give the player one decision around the item: buy, steal, repair, seal, forge, report, hide, trade, burn, use, bait, save or spend.
- Keep Russian player-facing text canonical and concise.
- Use ids/tags/events for cross-system communication, not display-name lookups.
- Do not add content-specific logic to `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.

## Type-Specific Checks

- If this is implemented as a real weapon, add executable stats and a role tier in the assigned weapon pack or `src/data/weapons.ts` sequentially.
- Do not create a weapon item without matching `WEAPON_STATS` coverage.
- For ranged behavior, use existing projectile types unless the orchestrator has approved a generic projectile hook.

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

- Whether `granit4u_belt_shotgun` was added, improved, merged into an existing id or rejected.
- Exact file paths changed.
- The reachability path.
- Resource/economy mapping or reason it is exempt.
- Whether it touches weapons, ammo, PSI, A-Life, factions, economy, quests, events, save/load, localization or render.
- Checks run and results.
