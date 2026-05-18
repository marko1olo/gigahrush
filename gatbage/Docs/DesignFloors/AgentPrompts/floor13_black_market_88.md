# FLOOR13_BLACK_MARKET_88

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Black Market 88 design floor.

<AGENT_PROMPT id="FLOOR13_BLACK_MARKET_88">
PROMPT IDENTIFIED: FLOOR13_BLACK_MARKET_88 | DOMAIN: Design floor / Illegal economy / Debts and raids | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/black_market_88.md`.
2. Read references: `Docs/Expansions/05_black_market_88/`, `src/gen/living/black_market_88.ts`, `src/systems/economy.ts`, `src/systems/containers.ts`, `src/data/contracts.ts`.
3. Create `Docs/Tasks/Status_FLOOR13_BLACK_MARKET_88.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR13_BLACK_MARKET_88.md`.
5. Run baseline `npm run build`.

## Goal

Implement a full Floor 88 market slice that extends the existing hidden debt counter into a larger illegal-economy space.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/black_market_88.ts`
- Optional local market data file
- `Docs/Tasks/Status_FLOOR13_BLACK_MARKET_88.md`
- `Docs/AgentLogs/LOG_FLOOR13_BLACK_MARKET_88.md`

Forbidden:
- Do not replace the existing hidden Market 88 content.
- Do not build live buyer/seller simulation.
- Do not create infinite money or stock.
- Do not edit global economy architecture without an integrator task.

## Implementation Tasks

1. Export `generateBlackMarket88DesignFloor()`.
2. Stamp market lanes, debt office, document booth, weapon stall, medicine locker and service hatch.
3. Add multiple access gates and owner/access containers.
4. Add purchase, contract, debt and raid-warning loops.
5. Tie state to heat/trust/scarcity lanes with bounded updates.
6. Run `npm run check`.

## Done Means

The market has one purchase, one contract, one debt and one raid/raid warning, all bounded against exploits.
</AGENT_PROMPT>

<POLISH_MANDATE>
Try to exploit the market in your head: buy/sell loops, repeated rewards, repeated raid loot. Cap or remove each exploit.
</POLISH_MANDATE>

