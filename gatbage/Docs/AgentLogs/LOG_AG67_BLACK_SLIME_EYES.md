# AG67 Black Slime Eyes Log

- Extracted `AGENT_67_BLACK_SLIME_EYES` and completed mandatory source reads.
- Added a single maintenance-floor black slime residue encounter in `src/gen/maintenance/black_slime_eyes.ts`.
- The site has a warning antechamber, a fire/light counterplay locker, a seal container, and a lure/sample container with `slime_sample_black`.
- Taking the sample publishes a black-slime sample event and, if not sealed, disturbs the residue and spawns 1-3 small `EYE` threats with the `black_slime_eye` variant.
- Opening the seal container marks the site sealed and suppresses or removes spawned eyes. Player kills on spawned eyes publish capped black-slime threat events.
- The encounter publishes an afteraction line warning that black residue watches back.
- Added `black_slime_eye` to `src/data/monster_variants.ts` and wired the module through `src/gen/maintenance/content_manifest.ts`.

Validation:

- Baseline `npm run typecheck` failed: `package.json` has no `typecheck` script.
- `npx tsc --noEmit` failed on unrelated existing workspace errors outside AG67.
- `npm run build` passed once after AG67 implementation; a later rerun failed on an unrelated missing export `tryUseProceduralFloorAnomaly`.
- `npm run check` failed: `package.json` has no `check` script.
- Direct smoke failed on unrelated runtime blocker `updateActiveFactionClashes is not defined`.
