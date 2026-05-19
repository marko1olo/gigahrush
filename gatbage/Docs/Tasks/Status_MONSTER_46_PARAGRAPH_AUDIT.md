# MONSTER_46_PARAGRAPH_AUDIT

Status: completed

Preflight:
- Extracted `MONSTER_46_PARAGRAPH_AUDIT` from `Monster_46.md`.
- Read required docs and source listed in the prompt.
- Baseline `npm run typecheck`: passed.

Scope:
- Keep shared ranged AI, monster registry, ecology, Ministry and Void encounters read only.
- Sharpen only local `src/entities/paragraph.ts` ranged identity, counterplay, loot hint and sprite cue.
- Add a narrow audit test if it can stay local to Paragraph.

Implementation:
- Preserved `isRanged: true`, `aiFlags: ['rangedClause']`, and `floors: [MINISTRY, VOID]`.
- Shifted local stats away from an Eye clone: slower movement, slower projectile, longer shot cooldown, stronger single hit.
- Counterplay now explicitly teaches line-of-sight breaks, rushing after the shot, and closing to point-blank range.
- Sprite now reads more like a stamped legal sheet: folded paper edge, paragraph ink bars, and a red seal/stamp cue.
- Added `tests/monster_46_paragraph_audit.test.ts` for local ranged identity and sprite readability.

Out Of Scope Notes:
- Generic ranged AI still fires through the shared monster path and hostile PSI projectile slot. A unique Paragraph projectile would require `monster.ts`/`render/sprites.ts`/`sprite_index.ts` integration and is outside this prompt's write scope.
- `src/data/monster_ecology.ts` already has Paragraph's Ministry/Void ecology, rare drops and line-of-sight counterplay; left read only.

Validation:
- Baseline `npm run typecheck`: passed before edits.
- `npx tsx --test tests/monster_46_paragraph_audit.test.ts`: passed.
- Final `npm run typecheck`: failed outside this audit scope on untracked `src/gen/void/perestanovshchik.ts` unused `Cell` and `TAGS`.
