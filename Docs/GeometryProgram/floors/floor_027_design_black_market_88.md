# Design Floor: `black_market_88`

Route: z=-10, base `LIVING`, role "trade, contraband, debt".

Primary source:

- `src/gen/design_floors/black_market_88.ts`
- `src/gen/living/black_market_88.ts`
- `Docs/Expansions/05_black_market_88/`

Safe improvement target:

- Bazaar lattice, auction pit, service guts and smuggling chords.
- Scale-free market hubs with capped hub degree.
- Small-world alleys and raid shutter min-cuts.

Implementation notes:

- No economy-wide ledger.
- No high-tier loot flood.
- Heat/trust/debt state must stay compact and bounded.

Required decisions:

- Password entry.
- Buy/sell.
- Steal.
- Take debt.
- Hide courier.
- Survive raid shutters.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
