# AG115 Ration Coupon Audit Status

Prompt: `AGENT_115_RATION_COUPON_AUDIT`

## Preflight

- XML block identified from `Docs/AgentPrompts/AGENT_115_RATION_COUPON_AUDIT.md`.
- Read: `README.md`, `architecture.md`, `desdoc.md` sections 14 and 17.
- Read: `src/data/economy.ts`, `src/systems/economy.ts`, `src/data/items.ts`, `src/gen/kvartiry/ration_queue.ts`, `src/gen/ministry/queue_hall.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: blocked; `package.json` has no `typecheck` script.

## Implementation

- Added ration coupon runtime handling in `src/systems/ration_coupons.ts`.
- Inventory use now supports:
  - fair spending of `water_coupon` / `concentrate_coupon`;
  - forging `forged_ration_card` with `ration_stamp_pad`;
  - reporting a forged card with `ration_registry_extract`;
  - selling a forged card into the black market path.
- Added ration coupon event types and HUD/log text.
- Added bounded economy consequences for Ministry documents and Kvartiry food/water.
- Added coupon audit containers and side-quest hooks in Ministry queue hall and Kvartiry ration queue.
- Added ration coupon rumors and item/resource tags.
- Added `tests/ration-coupons.test.ts`.

## Verification

- `npm run typecheck`: blocked; missing script.
- `npx tsc --noEmit`: blocked by unrelated existing errors:
  - `src/gen/maintenance/pneumomail_station.ts(45,54)` argument count mismatch.
  - `src/systems/govnyak.ts(105,10)` unused `removeStatus`.
- `npx tsx --test tests/ration-coupons.test.ts`: pass, 5 tests.
- `npm run check`: blocked; missing script.
- `npm run build`: pass.
