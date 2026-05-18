# AG90 Maronary Variant MVP Status

Date: 2026-05-18

## Preflight

- [x] Extracted prompt block `AGENT_90_MARONARY_VARIANT_MVP`.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` section 16.3, `maronary.md`.
- [x] Read `src/data/samosbor_variants.ts`, `src/systems/samosbor.ts`, `src/systems/samosbor_director.ts`, `src/render/hud_fx.ts`, `src/render/marks.ts`, `src/systems/debug.ts`.
- [!] Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script.

## Implementation

- [x] Confirmed existing rare `maronary` `SamosborVariantDef` with key warning line, green fog, high beep cue and wrong-door modifier.
- [x] Added bounded green source/proof marks through `MarkType.MARONARY`.
- [x] Added warning-time Maronary source stamping and wrong-door map clue with `green_source` / `wrong_door` event tags.
- [x] Kept wrong-door behavior on the existing one-shot remap path; no new floor/system and no control loss.
- [x] Added active procedural Maronary ping cue without a per-frame scan.
- [x] Added Maronary HUD proof-noise overlay and active title.
- [x] Added Maronary item rumor hook for `maronary_shaving`.
- [x] Added explicit debug force command for Maronary.

## Validation

- [!] `npm run typecheck`: blocked before edits because script is missing.
- [!] `npx tsc --noEmit`: blocked by unrelated existing worktree errors in `contracts.ts`, `paritel_steam_bridge.ts`, `main.ts`, `faction_events.ts`, `govnyak.ts`, `inventory.ts`, `lift_arachna.ts`, `quests.ts`, `rpg.ts`, and pre-existing unresolved samosbor helper refs.
- [!] `npm run check`: blocked. `package.json` has no `check` script.
- [!] `npm run build`: blocked by unrelated current worktree issue: `src/main.ts` imports missing `tryUseProceduralFloorAnomaly` from `src/systems/procedural_anomalies.ts`.
- [x] `git diff --check` on AG90-touched files: pass.
