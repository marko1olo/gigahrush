# AG87 Istotit Variant MVP Log

## 2026-05-18

Implemented a narrow Istotit MVP pass on top of the existing rare variant scaffolding.

Changed:

- Added bounded church-supply containers to marked Istotit shelter rooms.
- Added `tryUseSamosborVariantInteraction()` so Istotit choices live in `systems/samosbor.ts`, not as content logic in `main.ts`.
- Added player choices: shelter alone, admit nearby NPC, step toward bell, and disrupt a marked shelter door.
- Added costs and consequences: needs/PSI drain, citizen relation shifts, fog backlash, possible Eye/Sborka risk, and structured event data.
- Reused existing container theft/witness/audit flow for stealing church supply.
- Added active HUD action text for Istotit shelter/bell interaction.
- Added direct debug command `ИСТОТИТ: force + самосбор`.
- Included the Istotit decision in `samosbor_ended` and aftermath event payloads.
- Created `Docs/Tasks/Status_AG87_ISTOTIT_VARIANT.md`.

Validation:

- Baseline `npm run typecheck`: blocked because `package.json` has no `typecheck` script.
- `npx tsc --noEmit`: blocked by existing unrelated worktree errors outside the AG87 slice.
- `npm run check`: blocked because `package.json` has no `check` script.
- `npm run build`: blocked by existing unrelated missing export `tryUseProceduralFloorAnomaly` in `src/systems/procedural_anomalies.ts`.
- `git diff --check` on AG87-touched files: passed.

Exact QA trigger: open debug overlay, choose `ИСТОТИТ: force + самосбор` (`36` one-based, command index `35`), press `E`, then interact during the active event.
