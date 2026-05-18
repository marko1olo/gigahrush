# AG30 Content QA Rationale

Date: 2026-05-17

## Boundaries

This pass is QA/integration, not new gameplay. The worktree already contains many uncommitted and untracked files from prior agents, so AG30 will not revert or reshape existing content. Code edits are limited to deterministic checks and obvious local registry/manifest reference fixes.

## Method

- Treat `README.md`, `architecture.md`, and `audit.md` as source-of-truth context.
- Use generated counts and reference checks instead of hand-counting expanded registries.
- Prefer a small Node-side audit script over invasive runtime changes.
- Report ambiguous or design-level problems as blocked/risky rather than rewriting content.

## Decisions

- Added `scripts/content-audit.mjs` to parse TypeScript source directly. This avoids importing generated worlds just to count registries, while still line-reporting duplicate ids, missing item/NPC refs, LIVING zone collisions, and unimported content modules.
- Added `tests/content-registry.test.ts` to keep item, NPC, contract, rumor, room, and monster references checked in the normal unit gate.
- Treated `money` as a quest pseudo-item in tests because `checkQuests()` handles `targetItem === 'money'` explicitly in `src/systems/quests.ts`.
- Fixed only obvious local id drift in `src/data/rumors.ts`: old reveal ids `idol` and `psi_shard` were replaced with shipped item ids `idol_chernobog` and `psi_strike`.
- Updated `package.json` test discovery because shell expansion of `.test-build/tests/*.test.js` happened before the test build existed, making `npm run check` nondeterministic from a clean tree.
