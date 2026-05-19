# Status MONSTER_02_PLOMBIROVSHCHIK

Status: implemented with one Living manifest hook.

Preflight:
- Extracted `<AGENT_PROMPT id="MONSTER_02_PLOMBIROVSHCHIK">` from `Monster_02.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `AGENTS.md`.
- Read listed source: `src/gen/living/hermoseam_station.ts`, `src/systems/hermodoor_borer.ts`, `src/entities/shovnik.ts`, `src/entities/monster.ts`, `src/systems/ai/monster.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: exit 0.

Implemented:
- Added `src/gen/living/plombirovshchik.ts`.
- Registered it in `src/gen/living/content_manifest.ts` with `import './plombirovshchik';`.
- Added `tests/monster_02_plombirovshchik.test.ts`.

Encounter facts:
- Uses `MonsterKind.SHOVNIK` body named `Пломбировщик`; no new enum.
- Creates a Living repair nook and a side bypass.
- One internal hermodoor starts locally locked by a visible white seal; the bypass remains open, so the POI is not softlocked.
- Counterplay paths: take/read the seal note to notice the warning, deposit a cutting tool to break the seal, deposit `sealant_tube`/`hermo_gasket` to repair it, fire a loud shot nearby to interrupt, or kill the threat away from the seam to open the route.
- Killing it in the seam leaves the local door jammed and points the player to the bypass.
- Publishes existing structured events with tags `monster`, `plombirovshchik`, `seal`, `hermodoor`, `route_denial`.

Validation:
- `npm run typecheck`: exit 0.
- `npx tsx --test tests/monster_02_plombirovshchik.test.ts`: exit 0.
- `npm run build`: exit 0.
- `npm run smoke`: exit 0. Smoke passed with `hudLit=6234`, `hudCenterLit=125`, `sceneLit=202142`.
- `npm run check`: exit 1. It passed typecheck and reached unit tests, then failed in `tests/monster_16_ekrannik.test.ts` with `AssertionError: 2 !== 3` for `ekrannik misinformation stays local and publishes reversible encounter events`. Build did not run inside `check` because `test:unit` stopped the script.
