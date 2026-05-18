# AG65 White Compulsion Room Status

## Prompt

- Extracted `AGENT_65_WHITE_COMPULSION_ROOM` from `Docs/AgentPrompts/AGENT_65_WHITE_COMPULSION_ROOM.md`.

## Preflight

- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.1 and 17-19.
- [x] Read `src/gen/living/zone_content.ts`.
- [x] Read `src/gen/kvartiry/content_manifest.ts`.
- [x] Read `src/data/plot.ts`.
- [x] Read `src/systems/quests.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Read `src/systems/rumor.ts`.
- [x] Baseline `npm run typecheck` recorded: failed because `package.json` has no `typecheck` script.

## Implementation

- Added `src/gen/living/white_compulsion_room.ts`.
- Registered the module from `src/gen/living/content_manifest.ts`.
- Added four outcome rumors in `src/data/rumors.ts`.

## Playable Slice

- Living-zone room: `Комната белого остатка`, registered in zone HUD `46`.
- Room is protected with `aptMask`, carved as a real room, and connected through a hermetic door/corridor.
- White residue is visualized with bounded floor/wall marks.
- Тоня Белая is placed at the residue, held locally by spawn posture/dialogue rather than a global mind-control system.
- Player choices:
  - rescue: Даша У Порога gives `ag65_pull_tonya_away`, a TALK action to pull Тоня away;
  - containment: Клим Пломба gives `ag65_seal_white_room`, a sealant fetch for room closure;
  - sampling: Марк Пробник gives `ag65_deliver_white_sample`, using the public glass sample tray with `psi_dust`;
  - abandonment: Ефим Актовый gives `ag65_write_room_off`, a signed-room write-off choice.
- Outcome facts are published by the module's event observer with `slime`, `white_slime`, and `ag65_white_outcome` tags.
- Later NPC lines and event-linked rumors reflect rescued, sealed, sampled, and lost outcomes.

## Validation

- `npm run typecheck`: failed, missing npm script.
- `npm run check`: failed, missing npm script.
- `npx tsc --noEmit`: failed on pre-existing unrelated unused-symbol errors in:
  - `src/gen/maintenance/slime_sample_post.ts`
  - `src/render/hud.ts`
  - `src/systems/inventory.ts`
  - `src/systems/quests.ts`
  - `src/systems/samosbor.ts`
- Filtered TypeScript output had no `white_compulsion_room`, `content_manifest`, `rumors.ts`, or `AG65` diagnostics.
- `npm run build`: passed.
