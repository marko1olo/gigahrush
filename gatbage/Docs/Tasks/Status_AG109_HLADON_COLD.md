# AG109 Hladon Cold Pocket Status

Date: 2026-05-18

## Preflight

- Extracted prompt block: `AGENT_109_HLADON_COLD_POCKET`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.6, `Docs/ProceduralFloors/anomaly.md`, `src/data/procedural_floors.ts`, `src/gen/procedural_floor.ts`, `src/systems/heatline.ts`, `src/render/hud_fx.ts`.
- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.

## Implemented

- Added procedural anomaly id `hladon` with low/medium frequency, min danger 2, cold/heat-counter tags, loot bias and monster bias.
- Procedural generator now selects a few non-spawn cold rooms, renames them with `Хладон:`, applies pale frost marks, frosted floor/wall treatment, local fog, boundary stamps and a visible apparatus.
- Nearby warm supply room now seeds route preparation items: `boiler_water`, `asbestos_cord`, `sealant_tube`, `cloth_roll`, plus a stove/machine warmth marker.
- Added `src/systems/hladon.ts`:
  - per-world cached cold mask built from Hladon room names;
  - no global temperature field;
  - local movement slow and food/water/sleep pressure only inside or near cold cells;
  - passive counter from warm items/fire weapons/near warm features;
  - interaction counter on cold apparatus/machine/stove using valve tag, boiler water, asbestos+sealant or fire;
  - events for entered, countered, escaped and cleared states through `publishEvent`;
  - debug summary lines.
- Integrated movement/update/interact hooks in `src/main.ts`.
- Added debug visibility in the balance/catalog debug command and a debug teleport command `ТП: хладон`.
- Added `[E]` prompt target visibility for Hladon apparatus via HUD interaction targeting.
- Updated procedural anomaly docs and README shipped-behavior notes.

## Performance Notes

- No per-frame full-world scan.
- The cold mask is a `Uint8Array` cached per generated `World` and built once from active Hladon rooms.
- Per-frame runtime work is O(1): current-cell mask lookup plus a small 5x5 warm-feature check.
- Generation-time stamping is bounded by the selected rooms only.

## Validation

- `npm run typecheck`: failed, missing script.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run check`: failed, missing script.
- `npm run test:unit`: failed, missing script.
- `npm run smoke`: failed, missing script.

## Done State

Hladon is a bounded procedural anomaly, not a global temperature simulation. It creates local route/preparation pressure through visible cold rooms, temporary slow/needs pressure, heat/steam/fire counterplay and clear/escape events.
