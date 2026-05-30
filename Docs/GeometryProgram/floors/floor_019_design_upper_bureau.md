# Design Floor: `upper_bureau`

Route: z=+34, base `MINISTRY`, role "documents and access".

Primary source:

- `src/gen/design_floors/upper_bureau.ts`
- `Docs/DesignFloors/upper_bureau.md`
- `Docs/DesignFloors/rework_floor_05_upper_bureau.md`

Safe improvement target:

- Office tiers, queue lanes, staff balconies and permit cuts.
- BSP or macro-WFC admin tiers.
- Min-cut checks for legal/staff/combat routes.

Implementation notes:

- No single locked edge may own progression.
- Staff-only routes are optional chords or risk/reward shortcuts.
- Use document/permit ids, not text lookups.

Required decisions:

- Appointment.
- Bribe.
- Forge/expose.
- Staff-route stealth.
- Erase or preserve record.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
