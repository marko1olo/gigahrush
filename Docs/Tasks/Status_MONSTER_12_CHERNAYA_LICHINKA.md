# Status MONSTER_12_CHERNAYA_LICHINKA

Task: implement `chernaya_lichinka` / Chernaya Lichinka as a local black-slime residue encounter.

Preflight:
- Extracted the `MONSTER_12_CHERNAYA_LICHINKA` XML block with `awk '/<AGENT_PROMPT id="MONSTER_12_CHERNAYA_LICHINKA">/{flag=1} flag{print} /<\\/AGENT_PROMPT>/{if(flag){exit}}' Monster_12.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `black_slime_eyes.ts`, `slime_defs.ts`, `uv_spotlight.ts`, `eye.ts`, `sborka.ts`, and `events.ts`.
- Baseline `npm run typecheck`: exit 0. Output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Implementation:
- Added `src/gen/maintenance/chernaya_lichinka.ts`.
- Integrated it through `src/gen/maintenance/content_manifest.ts`.
- The encounter is room-local and uses existing `slime_sample_black`, `psi_dust`, `uv_spotlight`, `flamethrower`, `ammo_fuel`, `sealant_tube`, and `hermo_gasket`.
- Counterplay paths: UV suppression, fire cleanup, seal before harvest, avoid the residue cells, or remove the cult witness before a risky harvest.
- Failure path: stepping into the residue or harvesting raw sample awakens capped `SBORKA`/`EYE` threats named as Chernaya Lichinka.
- Events publish `chernaya_lichinka_*` facts with tags `monster`, `slime_black`, `uv`, and `cleanup`, plus the existing `slime_black_uv_sample` rumor id.

Validation:
- Post-implementation `npm run typecheck`: exit 0, no diagnostics.
- `npm run check`: exit 0. It ran `typecheck`, `test:unit` with 101 passing tests, and `build`.
