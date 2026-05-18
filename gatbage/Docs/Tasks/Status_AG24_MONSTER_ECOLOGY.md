# AG24 Monster Ecology / Loot / Floor Tables Status

Agent: AGENT_24_MONSTER_ECOLOGY_LOOT
Domain: Monster Ecology / Loot Hints / Floor Identity
Task count: 8

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_24_MONSTER_ECOLOGY_LOOT">` from `Docs/AgentPrompts/AGENT_24_MONSTER_ECOLOGY_LOOT.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read required files: `src/entities/monster.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/systems/inventory.ts`, `src/systems/events.ts`, and floor `content_manifest.ts` files.
- [x] Baseline `npm run build` passed before AG24 edits.
- [x] Checked worktree state; repo was already heavily dirty/untracked before AG24 edits.

## Checklist

- [x] 1. Define ecology defs with monster kind, floors, rooms, variants, loot hints, counterplay, rumor ids, and rare existing-item drops.
- [x] 2. Add defs for all current 22 monster kinds.
- [x] 3. Add cheap helpers for floor-appropriate monster selection and optional rare-drop selection.
- [x] 4. Wire ecology selection into samosbor corridor, random-map, and fog spawn paths.
- [x] 5. Enrich monster kill events with ecology tags/data; rare monster kills become severity 4.
- [x] 6. Add 22 ecology/counterplay rumors.
- [x] 7. Update README with shipped ecology/spawn/event behavior.
- [x] 8. Run build + typecheck.

## Validation

- Baseline `npm run build`: passed before AG24 edits.
- Post-edit `npm run typecheck`: passed.
- Post-edit `npm run build`: passed.
- Post-edit `npm run test:unit`: passed, 25 tests.
- Post-edit `npm run check`: passed, including smoke playability.

## Notes

- No monster AI rewrite was made.
- No new inventory system was added.
- No per-kill heavy loot generation was added; AG24 stores rare existing-item drop hints and exposes a cheap helper.
- Runtime gameplay consumption is samosbor spawn selection plus event enrichment on existing kill publication.
- Validation required one narrow non-AG24 compatibility fix: `src/systems/contracts.ts` now exports `offerNpcContract()` expected by the existing unit test.
