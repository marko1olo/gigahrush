# Design Floor: Чердак техслужб

Status: implemented authored route floor. Route id: `chthonic_attic`. Anchor: `z=+46`. Base floor: `MINISTRY`. Shipped HUD name: `Чердак техслужб`.

Owned file: `src/gen/design_floors/chthonic_attic.ts`. Planning sections below preserve the original brief; shipped z differs from the old `z=-36` plan because the current route spans `z=-50..+50` and reserves even z-slots for future authored/story floors.

## Role

This is the roof's inverse: an attic above the Ministry where concrete roots, cable bundles and old shrine niches grow upward. It should feel wrong because the "upper" floor behaves like a buried place.

Primary decisions: cut roots or feed them, burn a shrine or use it as shelter, route through crawlspaces, steal relics, bargain with cult-adjacent residents, flee before the ceiling closes.

## Generation

- Low corridors, crawlspace-like rooms, cable roots crossing doorways.
- Small chapel niches and sealed storage cells.
- Vertical holes look upward but lead to service spaces, not free fall simulation.
- Use wall marks and obstruction features, not new physics.
- Keep routes connected with at least one wide combat corridor and one stealth crawl path.

Base mood: Hell/Ministry hybrid. Reuse concrete, dark, gut/meat marks sparingly. Do not turn the whole floor into Hell; this floor foreshadows it.

## NPCs

- `attic_agrafena_rootkeeper`: caretaker who knows which concrete roots are load-bearing.
- `attic_deacon_ostap`: cult-adjacent clerk, trades shelter for witness statements.
- `attic_cable_boy_yura`: fast guide through crawl routes.
- `attic_liquidator_masha`: wants a controlled burn, not a crusade.

## Quests

- `attic_cut_or_feed_root`: choose repair parts for Service Floor or relic access for Hell chain.
- `attic_burn_niche`: cleanse a shrine, causing smoke and possible cult hostility.
- `attic_crawl_escort`: guide Yura through a tight route during warning phase.
- `attic_black_hand_report`: bring wall mark evidence to Ministry, Yakov or cultists.

## Samosbor

The attic reacts by tightening routes. During warning, some crawl doors become one-way. During active phase, root rooms can seal as shelter but demand a cost: item, HP, reputation or delayed door opening.

No per-cell growth simulation. Choose affected rooms at event start and store compact room ids.

## Cross-Floor Hooks

- Roof leaks light into one attic room if signal/weather state is good.
- Ministry uses attic evidence as contraband/cult paperwork.
- Underhell can reference roots first seen here.
- Service Floor repairs can reopen burnt root doors.

## DoD

- At least two alternate routes from entry to exit.
- One meaningful choice changes later floor state by flag/event.
- Root sealing is deterministic and cannot softlock the player.
- Cult content remains gameplay, not exposition.
