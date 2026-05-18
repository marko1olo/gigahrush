# AG53 Hell Altar Arena Log

## 2026-05-17

- Added a self-contained Hell POI in `src/gen/hell/altar_arena.ts`: `Пепельный алтарь готовности`.
- Registered it through `runHellContent()` in `src/gen/hell/content_manifest.ts`; no main plot chain or Hell topology rewrite.
- Encounter structure: one closed entry door bounds the fight. Ignoring the door is safe; opening it commits to the room, and the same route remains the flee path.
- Spawn cap: 9 monsters exactly (`2 TVAR`, `1 POLZUN`, `2 EYE`, `1 NIGHTMARE`, `2 SHADOW`, `1 REBAR`) and 4 cultists. No Matka and no runtime wave spawner, so monster count cannot grow from this encounter.
- Reward cap: one visible altar drop with `psi_meat_hook`, `meat_rune`, and 2 `ammo_energy`.
- Added contract `hell_altar_nightmare` and rumors `floor_hell_altar_arena`, `contract_hell_altar_nightmare`.
- Baseline `npm run build` passed before edits.
- `npm run typecheck` passed after edits.
- `npm run check` passed typecheck, unit tests and build, then failed smoke on the living-floor startup canvas: WebGL sampled blank (`0 lit samples`) and inventory panel center delta did not reach threshold. A direct `npm run smoke` rerun reproduced the same smoke failure.
