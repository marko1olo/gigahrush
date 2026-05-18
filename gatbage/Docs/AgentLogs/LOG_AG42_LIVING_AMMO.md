# LOG AG42 Living Ammo Scarcity Loop

## 2026-05-17

Implemented a Living-floor ammo scarcity loop centered on `Патронный шкаф домкома`.

Changed:

- Added `src/gen/living/domkom_ammo_locker.ts`.
- Registered the module in `src/gen/living/content_manifest.ts`.
- Added contract `living_domkom_ammo_parts` in `src/data/contracts.ts`.
- Added rumors `container_domkom_ammo_locker` and `contract_domkom_ammo_parts` in `src/data/rumors.ts`.
- Created `Docs/Tasks/Status_AG42_LIVING_AMMO.md`.
- Applied a narrow optional-state guard in `src/render/map_ui.ts` while exposing validation blockers.

Gameplay routes:

- Pay/trade: Zoya Patronnaya sells a tiny stock of 9mm and one shell through the existing NPC trade menu.
- Steal: the room has an owner cashbox and a liquidator faction crate with low-count ammo and visible theft risk.
- Task: Zoya accepts one `magazine_part` and rewards a small amount of 9mm plus one shell.

Balance:

- Maximum direct AG42 ammo stock is deliberately low.
- The task reward is defensive, not enough to erase early survival pressure.
- The guarded/faction stock creates a louder high-risk route instead of free hub ammunition.

Validation:

- Baseline `npm run build`: passed before implementation.
- Post-change `npm run build`: passed.
- `npm run smoke`: passed.
- `npm run check`: failed at `npm run typecheck` due current non-AG42 `src/systems/faction_events.ts` type errors.
- `npm run test:unit`: also blocked by `faction_events.ts`; it additionally reports an existing `tests/content-registry.test.ts` rumor reveal type mismatch.
