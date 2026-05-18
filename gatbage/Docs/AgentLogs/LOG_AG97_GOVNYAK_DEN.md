# AG97 Govnyak Smoke Den Log

2026-05-18

Implemented a Living-zone smoke den POI as `src/gen/living/govnyak_smoke_den.ts` and imported it through `src/gen/living/content_manifest.ts`.

Content delivered:
- Cramped protected room: `Дымная комната за мусоропроводом`, registered in Living zone 37.
- NPCs: dealer, debtor, witness, liquidator reporter, scientist handler.
- Decisions: buy without ledger debt, refuse credit/protect debtor, settle debt, steal from controlled containers, report to liquidators, turn dealer to science oversight.
- Stock uses the existing `govnyak_roll` item id from AG96; the POI never forces use.
- Containers: finite dealer stock, debt cashbox/evidence, witness packet; owner/faction access routes theft through existing witness/audit system.
- Events: local observer republishes den purchase, debt, refusal/protection, report, science-turn and theft outcomes as structured `faction_relation_changed` events with `govnyak_den`, `den_cleared` or `left_open` tags.
- Rumors: added specific lead/fallout rumor ids for den discovery, purchase, debt, refusal, theft and report.

Validation:
- `npm run typecheck`: blocked; script missing.
- `npx tsc --noEmit`: failed on existing/current-worktree unrelated project errors; no AG97 file errors were reported.
- `npm run build`: final rerun blocked by unrelated current-worktree error: `src/main.ts` imports `tryUseProceduralFloorAnomaly`, which is not exported by `src/systems/procedural_anomalies.ts`.
- `npm run check`: blocked; script missing.
- `npm run smoke`: blocked; script missing.
