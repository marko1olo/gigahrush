# LOG_AG102_ZHELEMISH_CELLAR

What changed:

- Added `src/gen/living/zhelemish_cellar.ts`, a reachable Living storage POI registered in zone 33 as `Желемышный погреб Мавры`.
- Added owner and witness NPCs with side quests for buy/share, sample report/surrender, burning the wet corner, sealing the cellar and resolving owner/witness rules.
- Seeded finite zhelemish resources through containers: a public harvest tray, an owner stock cabinet with theft consequences, a share bowl, a sanitary evidence box and a burn barrel.
- Wired the Living content manifest to side-effect import the new module.
- Added narrow container hooks so `zhelemish_raw` can be surrendered as evidence and `ammo_fuel` can trigger burn/sabotage deposit events.
- Added a rumor lead for `Желемышный погреб Мавры` and routed zhelemish item events to that lead.
- Created `Docs/Tasks/Status_AG102_ZHELEMISH_CELLAR.md`.

Validation:

- Baseline `npm run typecheck` could not run because `package.json` has no `typecheck` script.
- `npm run check` could not run because `package.json` has no `check` script.
- `npx tsc --noEmit` remains red on unrelated existing files, but filtered output shows no AG102-owned file errors.
- `npm run build` remains blocked by an unrelated missing export imported in `src/main.ts` from `src/systems/procedural_anomalies.ts`; Vite also reports an existing duplicate `maronary_shaving` case warning in `src/systems/rumor.ts`.
