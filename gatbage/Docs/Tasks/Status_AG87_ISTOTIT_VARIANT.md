# AG87 Istotit Variant MVP Status

Date: 2026-05-18

## Preflight

- [x] Extracted prompt block `AGENT_87_ISTOTIT_VARIANT_MVP`.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` section 16.3, and `istotit.md`.
- [x] Read `src/data/samosbor_variants.ts`, `src/systems/samosbor.ts`, `src/systems/samosbor_director.ts`, `src/render/hud_fx.ts`, `src/systems/events.ts`, and `src/systems/debug.ts`.
- [x] Created this status file.
- [!] Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script.

## Implementation

- [x] Confirmed existing rare `istotit` `SamosborVariantDef` with gold tint, bell cue, choir modifier and civil-floor rarity.
- [x] Kept shelter candidate selection bounded to warning/event start; no per-frame shelter scan.
- [x] Added per-shelter church supply containers tagged `istotit_supply`.
- [x] Added explicit Istotit interaction choices through `tryUseSamosborVariantInteraction`: shelter alone, admit nearby NPC, step toward bell, or disrupt a marked shelter door.
- [x] Added cost/debt to choices through needs/PSI loss, relation shifts, fog backlash, monster risk and structured `samosbor_warning` events with `decision` data.
- [x] Preserved container theft path for stealing the church supply through existing container/audit/witness events.
- [x] Added active HUD prompt for Istotit shelter/bell decisions.
- [x] Added direct debug force command: `ИСТОТИТ: force + самосбор`.
- [x] Carried Istotit decision data into `samosbor_ended` and aftermath event data.

## QA Trigger

1. Open debug overlay with backquote.
2. Select command `ИСТОТИТ: force + самосбор` (`36` in the visible one-based debug list, zero-based command `35`).
3. Press `E`; the next samosbor starts as Istotit.
4. During Istotit, use `M` to verify gold shelter contours, look at a church-supply container and press `E` to steal/open, or press `E` inside/outside a shelter to choose shelter/admit/bell/disrupt behavior.

## Validation

- [!] `npm run typecheck`: blocked because the script is missing.
- [!] `npx tsc --noEmit`: blocked by existing unrelated worktree errors, including missing procedural anomaly exports, unfinished faction event helpers, unused monster/faction symbols, and existing HUD missing refs.
- [!] `npm run check`: blocked because the script is missing.
- [!] `npm run build`: blocked by existing unrelated `src/main.ts` import of missing `tryUseProceduralFloorAnomaly` from `src/systems/procedural_anomalies.ts`.
- [x] `git diff --check` on AG87-touched files: passed.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG87_ISTOTIT_VARIANT.md`.
