# AG70 Seroburmaline Log

## 2026-05-18

- Extracted `AGENT_70_SEROBURMALINE_NO_LOOK` and completed the required source/doc preflight.
- Added `src/gen/maintenance/seroburmaline_no_look.ts`: a Maintenance NII Slime POI with a post room, a no-look chamber with two marked seroburmaline sources, a lower bypass, supplies, a scientist NPC, and reachable rewards.
- Added `src/systems/seroburmaline.ts`: bounded ray/proximity inspection, PSI drain while staring, safe look-down/away avoidance, source covering with tape/sealant/cloth/cleaning tool/vacuum, tagged event publication, and HUD snapshot state.
- Added restrained presentation: `MarkType.SEROBURMALINE`, HUD no-look veil/warning, and minimap source markers.
- Hooked the POI into `src/gen/maintenance/content_manifest.ts`, player interaction/tool use in `src/main.ts`, and HUD/map rendering.
- Validation: `npm run typecheck` and `npm run check` are missing scripts; `npx tsc --noEmit` still fails on unrelated dirty-tree errors with no AG70 filename matches; `npm run build` is blocked by duplicate exports in `src/systems/procedural_anomalies.ts`; AG70 touched-path `git diff --check` passed.
