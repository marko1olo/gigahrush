# AG69 Silver Temptation Log

## 2026-05-18

- Added `slime_sample_silver` as the sealed silver slime item and `slime_sample_silver_open` as the opened residue item.
- Sealed use is optional and costly: it gives short visible relief through sleep/PSI, costs water/HP, publishes `player_use_item`, and leaves an opened sample.
- Opened sample use destroys the residue with a small water/HP cost and publishes `player_destroy_item`.
- Added silver sample resource pricing under `slime_samples`, a science handoff contract, and trade/handoff event publication for silver sample sales.
- Added rumor hooks for sealed sale suspicion, science handoff, use, and destruction.
- Reachability: existing debug command `Спавн предметов` drops both item ids; existing NII/contraband hooks that referenced `slime_sample_silver` now resolve to a real item.

Validation:

- Baseline `npm run typecheck`: failed before edits because the script is missing.
- `npm run check`: failed because the script is missing.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
