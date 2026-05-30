# Design Floor: `bank_floor`

Route: z=+26, base `MINISTRY`, role "money, debt, safes".

Primary source:

- `src/gen/design_floors/bank_floor.ts`
- `Docs/DesignFloors/bank_floor.md`
- `Docs/DesignFloors/rework_floor_06_bank_floor.md`

Safe improvement target:

- Teller lanes, debtor queues, vault shells and black service bypass.
- Debt-circuit loop graph.
- Vault risk SDF around high-value rooms/containers.

Implementation notes:

- Do not add a new global banking ledger.
- Use existing money, events, ownership, locks and bounded room facts.
- Vault theft route must have readable escape pressure.

Required decisions:

- Wait.
- Bribe.
- Deposit/borrow/repay.
- Forge debt.
- Steal vault.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
