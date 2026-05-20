# MACRO2_13: Weapon Role And Scarcity Balance

Модель: GPT-5.5, reasoning extra high.

Цель: у каждого physical/PSI оружия есть различимая роль, стоимость и причина существовать.

Критично: 31 physical и 16 PSI entries легко превращаются в дубли HP/DPS, что ломает survival choice.

Ownership: `src/data/weapons.ts`, `src/data/psi.ts`, `src/data/items.ts`, `src/systems/inventory.ts`, `tests/inventory-rpg.test.ts`.

Читать: `desdoc.md P0.1`, `README.md Items/Weapons`, `src/data/weapons.ts`, `src/data/psi.ts`.

Deliverables:
- tier map: melee emergency, Makarov precise, shotgun corridor stop, PPSh/AK ammo burn, industrial tools, rare energy, PSI;
- ammo/resource scarcity tied to economy/resources;
- focused tests for no missing ammo/stat ids.

Проверки: `npm run typecheck`, `npm run test:unit`, manual debug firing range.

Параллельные ограничения: do not add new weapons until existing roles are non-duplicate.
