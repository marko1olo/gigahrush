# Design Floor: Банковский этаж

Status: implemented authored route floor. Route id: `bank_floor`. Anchor: `z=+26`. Base floor: `MINISTRY`. Shipped HUD name: `Банковский этаж`.

Owned file: `src/gen/design_floors/bank_floor.ts`. Route integration: `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/design_floors/full_floor.ts`.

## Shipped Facts

`bank_floor` is a Ministry-band route stop between the `MINISTRY` story anchor at `z=+30` and `raionsovet_archive` at `z=+22`.

The generator builds Bank B-22 with:

- lift lobby, main cash hall, teller line, deposit row, credit window, debtor queue, vault and black service bypass;
- expanded teller waiting lanes, the debtor circuit loop, a bribe/queue-skip room, an outer vault shell and a black service bypass post;
- Zinaida Balansovna, Lyuba Cashier, Prokhor Credit, Semen Collector-Guard and Mitya Overdue as registered side-quest NPCs;
- wait, deposit, loan, repayment, forged debt paper and vault-theft event tags through the existing quest, container and `rumor_observed` event systems;
- owner, locked, faction and buyable containers for deposits, debt paperwork, cashier cash, credit papers, queue bribes and vault boxes;
- a bounded generation-time vault-risk SDF around vault rooms and high-value containers, expressed as red/green floor pressure, audit tags and escape-pressure container tags;
- route expansion corridors, annex accounting rooms, overdue-deposit archive, intake post and lower bank bypass.

## Implementation Boundary

Banking is implemented through existing money items, side quests, containers, ownership rules and world events. There is no separate bank account ledger or live financial simulation.

Use the normal lift route to `z=+26` or debug route teleport to `bank_floor`. Spawn starts in `Лифтовый вестибюль банка Б-22`.
