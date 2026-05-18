# LOG AG84 False Safe Block

Date: 2026-05-18

## Final Report

- Added procedural anomaly `false_safe_block` with low weight, cult/shelter tags, loot/monster bias hooks and procedural run debug visibility.
- Generation now stamps one bounded quiet shelter block: clean rooms/corridors, missing-siren screen, black-hand marker, cult-owned supply, hidden evidence stash and a small caretaker cap.
- Runtime hooks let the player investigate/report the screen, loot the cult-owned supply, reveal the hidden stash, or break the marker with a cleaning kit/jackhammer at a samosbor-timer cost.
- Events use existing `floor_transition`, `rumor_observed`, `player_use_item` and container events with `false_safe_block` tags; rumor/log hooks make the anomaly visible without a new event bus.
- Samosbor pressure is only partially delayed: the anomaly gives a small timer relief before danger pressure, and resolving the marker makes the local room unsafe and shortens the timer.
- Debug menu has a direct `ТП: тихий блок` command that forces/teleports to a procedural floor with the anomaly.

## Validation

- Baseline `npm run typecheck`: blocked; script is missing from `package.json`.
- Direct `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run check`: blocked; script is missing from `package.json`.
