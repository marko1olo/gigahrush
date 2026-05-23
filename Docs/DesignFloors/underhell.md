# Design Floor: Нижний пропускник

Status: implemented authored route floor. Route id: `underhell`. Anchor: `z=-38`. Base floor: `HELL`. Shipped HUD name: `Нижний пропускник`.

Owned file: `src/gen/design_floors/underhell.ts`. Planning sections below preserve the older `Ниже ада` brief and may predate the routed implementation.

## Role

Underhell is "even more chthonic" than Hell: rules are older than rooms. It should be a smaller, stranger descent where the player negotiates with thresholds, tribute, reversed shelter logic and body/identity costs.

Primary decisions: pay tribute, refuse and fight, sacrifice item, erase proof, open Void route, flee through collapsing meat roots.

## Generation

- Fewer rooms than Hell, more ritual thresholds.
- Root tunnels, black wells, sealed witness cells, inverted chapel, bone-like service conduits.
- Use strong landmarks; do not make abstract maze before Void.
- Route to Void must be gated by a clear objective.

## NPCs

- `underhell_threshold_marfusha`: not fully trustworthy guide.
- `underhell_debt_cultist`: trades Market/Floor69 debts for ritual access.
- `underhell_wordless_liquidator`: communicates by notes/marks.
- `underhell_false_yakov_echo`: PSI lure, not actual Yakov unless plot says so.

## Quests

- `underhell_pay_threshold`: choose item/document/HP/reputation tribute.
- `underhell_free_witness`: rescue or silence witness cell.
- `underhell_burn_debt`: erase Market/Floor69 debt with backlash.
- `underhell_open_void_cut`: open the Void route by breaking ritual anchor.

## Systems

Keep ritual state as flags:

```txt
underhell.thresholdPaid
underhell.witnessState
underhell.debtBurned
underhell.voidGateState
```

No global morality system. Consequences publish events and affect relevant floors.

## Cross-Floor Hooks

- Market 88 and Floor 69 debts can be burned here, with worse later consequence.
- Chthonic Attic roots can change one Underhell route.
- Podad now carries the Herald lower-route gate; this floor remains the lower threshold before it.
- Darkness can later reveal unpaid tribute.

## DoD

- One ritual gate has at least three costs.
- Debt/identity manipulation has visible cross-floor backlash.
- Void route opens deterministically and cannot softlock.
