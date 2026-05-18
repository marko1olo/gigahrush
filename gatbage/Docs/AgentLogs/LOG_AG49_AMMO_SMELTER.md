# LOG AG49 Ammo Smelter

## 2026-05-17

Implemented Kvartiry illegal ammo smelter POI.

- Added `src/gen/kvartiry/ammo_smelter.ts` with `Гильзоплавка сорок шестой`, Gesha's buy/help path, Polina's report path, armed bystanders, small loot, and three manual containers.
- Wired the module through `src/gen/kvartiry/content_manifest.ts` after the medicine swap and before the false-neighbor room.
- Added `illegal_ammo_smelter` factory recipe: 6x `ammo_9mm` per 300 seconds for 2 `ammo`, 2 `metal`, and 1 `labor`.
- Added contracts `kv_smelter_metal_run` and `kv_smelter_denunciation` with Kvartiry target metadata.
- Added rumors `kvartiry_ammo_smelter_heat` and `kvartiry_ammo_smelter_theft`.
- Balance: static risky stock is 12x 9mm, 16x nails, and 2x shells; side quest adds 10x 9mm and 10x nails; production is slow and resource-limited.

Validation:

- Baseline `npm run typecheck`: passed before implementation.
- Post-implementation `npm run typecheck`: failed only in unrelated `src/systems/void_protocols.ts`.
- `npm run check`: failed at typecheck on unrelated `src/systems/void_protocols.ts`, so unit/build/smoke did not run.
