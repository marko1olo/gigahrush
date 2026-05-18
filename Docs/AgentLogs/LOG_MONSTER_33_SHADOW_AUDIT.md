# MONSTER_33_SHADOW_AUDIT Final Report

Date: 2026-05-18

Audited `SHADOW` / Теневик as the existing darkness and ambush enemy. The shipped ecology already describes the right counterplay: move after contact, keep light/open space, and do not trust dark corners. The local monster definition did not expose that same information through its own `MonsterDef`, and the sprite leaned too far toward unreadable black.

Implemented in `src/entities/shadow.ts`:

- Added local floor identity matching the ecology floors.
- Added local counterplay text: move after the first hit, retreat into lit or wide passages, keep distance.
- Added local loot hint for dark traces and the rare strange clot.
- Revised the sprite so the silhouette remains a shadow but has fair warning cues: violet rim/afterimage, brighter eyes, shoulder breaks, and readable arm wisps.

No shared files were edited. A real light-aware ambush mechanic would require an assigned broad hook in AI/render/light state, so this audit keeps behavior unchanged and records that as deferred.

Validation:

- Baseline `npm run typecheck`: pass.
- Post-change `npm run typecheck`: pass.
