# LOG MONSTER_12_CHERNAYA_LICHINKA

Implemented a local Maintenance black-slime chamber for `chernaya_lichinka`.

Files changed:
- `src/gen/maintenance/chernaya_lichinka.ts`
- `src/gen/maintenance/content_manifest.ts`
- `Docs/Tasks/Status_MONSTER_12_CHERNAYA_LICHINKA.md`
- `Docs/AgentLogs/LOG_MONSTER_12_CHERNAYA_LICHINKA.md`

Gameplay:
- The player sees black residue, eyelet marks, UV/fire/seal supplies, a risky sample jar, and a nearby cult witness.
- Safe approaches are UV, fire, seal, avoiding the residue, or removing the witness before harvesting.
- Mishandling the room wakes a capped local ambush using existing `SBORKA` and `EYE` kinds.
- Fire can leave `psi_dust`; safe sample handling keeps `slime_sample_black` from becoming just another fight pickup.

Validation:
- Baseline `npm run typecheck`: exit 0, no diagnostics.
- Post-implementation `npm run typecheck`: exit 0, no diagnostics.
- `npm run check`: exit 0. It ran `typecheck`, `test:unit` with 101 passing tests, and `build`.
