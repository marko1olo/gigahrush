# MONSTER_40_SPIRIT_AUDIT Final Report

Date: 2026-05-18

Audited `SPIRIT` / Дух as the existing phasing threat. The shipped AI already supports the intended rule: a phasing monster ignores wall/door pathing while hunting, so the counterplay is distance and repositioning rather than closing doors.

Implemented in `src/entities/spirit.ts`:

- Added local floor identity for Ministry, Hell, and Void.
- Added local counterplay text explaining that doors and walls do not hold a spirit; the player must keep distance and break tempo before contact.
- Added a local loot hint for empty memory, cold draft, and rare PSI dust.
- Revised sprite readability with a pale phase veil and stronger skull-edge alpha, keeping it visibly ghostlike without making it invisible or shadow-like.

No shared files were edited. Broad phasing AI concerns were reviewed and recorded: the behavior is already generic and bounded, and current spawn paths set `phasing` for `MonsterKind.SPIRIT`.

Validation:

- Baseline `npm run typecheck`: pass.
- Post-change `npm run typecheck`: pass.
- `npm run smoke`: pass.
