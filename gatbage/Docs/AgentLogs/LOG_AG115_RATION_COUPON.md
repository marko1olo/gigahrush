# LOG_AG115_RATION_COUPON

## 2026-05-18

Preflight started for `AGENT_115_RATION_COUPON_AUDIT`.

Final report:

- Implemented ration coupons as document/economy pressure with fair spend, forge, report, theft, and black-market outcomes.
- Connected consequences to Ministry document stock and Kvartiry food/water stock through bounded `changeResourceStock` calls.
- Added events: `ration_coupon_spent`, `ration_coupon_stolen`, `ration_coupon_forged`, `ration_coupon_reported`, `ration_audit_resolved`.
- Added Ministry queue hall and Kvartiry ration queue hooks: audit containers, coupon documents, and report side quests.
- Added focused tests in `tests/ration-coupons.test.ts`.
- Verification: `npx tsx --test tests/ration-coupons.test.ts` passed; `npm run build` passed.
- Blockers: `npm run typecheck` and `npm run check` are missing scripts; direct `npx tsc --noEmit` is blocked by unrelated `pneumomail_station.ts` / `govnyak.ts` errors.
