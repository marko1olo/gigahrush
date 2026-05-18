# Status AG49 Ammo Smelter

## Scope

- Prompt: `AGENT_49_KVARTIRY_AMMO_SMELTER`
- Domain: Kvartiry POI / ammo economy / faction risk.
- Owned files: new Kvartiry module, Kvartiry manifest, factories, contracts, rumors, task/log docs.

## Preflight

- Extracted `AGENT_PROMPT id="AGENT_49_KVARTIRY_AMMO_SMELTER"`.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` P0.1/P0.5/P1.
- Read required Kvartiry, production, ammo, contract, item, and container files.
- Baseline `npm run typecheck`: passed.

## Implementation

- Added `src/gen/kvartiry/ammo_smelter.ts`.
- Added `Гильзоплавка сорок шестой` as a contested Kvartiry production room.
- Added Gesha's buy/help path, Polina's report path, theft-risk containers, and armed bystanders.
- Added one slow `illegal_ammo_smelter` factory recipe using existing `ammo`, `metal`, and `labor` resource stocks.
- Added two system contracts and two rumors pointing players toward the smelter.

## Balance Notes

- Static smelter stock is 12x 9mm, 16x nails, and 2x shells behind owner theft risk.
- Help quest reward is 10x 9mm plus 10x nails for 2 metal sheets.
- Production output is 6x 9mm per 300 seconds and spends 2 ammo stock, 2 metal stock, and 1 labor, so it is a slow scarcity conversion rather than free ammo.

## Validation

- Baseline `npm run typecheck`: passed before implementation.
- Post-implementation `npm run typecheck`: blocked by unrelated `src/systems/void_protocols.ts` errors.
- `npm run check`: blocked at typecheck by the same unrelated `src/systems/void_protocols.ts` errors before tests/build/smoke could run.
