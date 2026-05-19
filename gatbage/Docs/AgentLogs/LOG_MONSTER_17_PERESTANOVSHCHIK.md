# LOG_MONSTER_17_PERESTANOVSHCHIK

## Final Report

Implemented `perestanovshchik` / `Перестановщик` as a local Void topology encounter in `src/gen/void/perestanovshchik.ts`.

The chamber uses existing sparse `world.anomalyTeleports` pairs only inside the local encounter. It presents repeated door/cell cues, a safe intentional route, a wrong loop into a side room, a small side-room `SHADOW` threat, and a reachable anchor room. A normal physical route remains open, so the encounter does not change global floor transitions and cannot trap the player.

The anchor is a visible public container with `lift_scheme`, `void_spike`, and a note. Taking from it disables only this chamber's teleport links and publishes an `elevator_loop_exit` event tagged with `monster`, `topology`, `teleport`, `route`, and `perestanovshchik`.

Validation:

- Baseline `npm run typecheck`: exit code `0`.
- Focused `npx tsx --test tests/monster_17_perestanovshchik.test.ts`: exit code `0`, 2 tests passed.
- Intermediate post-change `npm run typecheck`: exit code `2`, blocked by unrelated unused locals in `src/gen/living/samosbornyy_ostov.ts` and `src/gen/maintenance/pressovik.ts`.
- Final `npm run check`: exit code `0`; typecheck, 98 unit tests, and Vite build passed.
