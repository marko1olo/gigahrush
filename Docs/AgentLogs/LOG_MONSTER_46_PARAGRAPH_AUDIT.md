# MONSTER_46_PARAGRAPH_AUDIT

Final report:

- Read the assigned prompt block from `Monster_46.md`.
- Read required docs and sources: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, `src/entities/paragraph.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/ministry/document_gate.ts`, and `src/gen/void/protocol_chamber.ts`.
- Kept Paragraph in the existing ranged-monster path with `rangedClause`, Ministry/Void floors and hostile PSI projectile auto-assignment.
- Tuned only `src/entities/paragraph.ts`: Paragraph is now slower and more deliberate than Eye, with a slower projectile, longer cooldown window, and stronger single hit.
- Sharpened local counterplay text toward breaking line of sight and rushing after the shot.
- Reworked the local sprite into a stamped/folded legal sheet with paragraph ink marks and a red seal cue.
- Added `tests/monster_46_paragraph_audit.test.ts` to lock the local role and prevent the sprite collapsing into an Eye-like cue.

Validation:

- Baseline `npm run typecheck`: passed.
- `npx tsx --test tests/monster_46_paragraph_audit.test.ts`: passed.
- Final `npm run typecheck`: failed because untracked `src/gen/void/perestanovshchik.ts` has unused `Cell` and `TAGS`; that file is outside the Monster 46 write scope.
