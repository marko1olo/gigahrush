# LOG_FLOOR04_UPPER_BUREAU

## 2026-05-18

Implemented the future Upper Bureau design-floor slice in `src/gen/design_floors/upper_bureau.ts`.

The module exports a standalone `generateUpperBureauDesignFloor()` and local state helpers for `upper_bureau.appointment_token`, `upper_bureau.staff_route_known`, `upper_bureau.audit_heat` and `upper_bureau.name_erased`. It uses existing document items and existing event publication instead of adding a bureaucracy system.

Gameplay surface:

- Appointment gate supports legal permit, paid preapproval and illegal/combat key theft paths.
- Tolik's cleaner route gives a lower-combat staff bypass to the file room and future service-lift hook.
- Lev's audit quest and Anna's erased-name quests use document items and containers that create theft/audit consequences through existing container/event code.
- A Paragraph in the zero file room adds risk without making the quiet path mandatory combat.

Validation:

- Baseline `npm run build` passed.
- Direct compile of `src/gen/design_floors/upper_bureau.ts` passed.
- Full `npm run typecheck` is blocked by unrelated untracked `src/gen/design_floors/antenna_court.ts` unused import.
