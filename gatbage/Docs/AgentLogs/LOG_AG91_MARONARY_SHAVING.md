# AG91 Maronary Shaving Log

## Final Report

- Implemented `maronary_shaving` as a risky high-value Maronary evidence/reagent item with tags for Maronary, contraband, evidence, science, and cult handling.
- Added non-AG90-dependent sources: rare safe/secret-stash rolls and a debug command (`МАРОНАРИЙ: выдать стружку`). Existing Maronary aftermath residue remains supported.
- Added outcomes:
  - Science/Yakov handoff through trade.
  - Cult handoff through trade.
  - Ministry-floor handoff through trade.
  - Suspicious ordinary sale through trade.
  - Destruction from inventory use.
  - Hidden contraband deposit in secret/trash containers.
- Published structured events for acquire, handoff/sale, destruction, and hidden deposit paths, with rumor ids where relevant.
- Added rumors for carrying/hiding the shaving, repeated-door dreams, cult buyers, and Ministry buyers.

## Validation

- `npm run typecheck`: unavailable; package has no script.
- `npm run check`: unavailable; package has no script.
- `npx tsc --noEmit`: blocked by existing non-AG91 dirty-tree errors.
- `npm run build`: blocked by existing missing export in `src/render/hud.ts` / `src/systems/procedural_anomalies.ts`.
