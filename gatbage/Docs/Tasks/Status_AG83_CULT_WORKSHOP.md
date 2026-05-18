# Status AG83 Cult Workshop

Prompt: `AGENT_83_CULT_HELD_WORKSHOP`

## Preflight

- Extracted XML block by id from `Docs/AgentPrompts/AGENT_83_CULT_HELD_WORKSHOP.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` sections 16.2 and 17.
- Read `src/gen/maintenance/content_manifest.ts`, `src/systems/production.ts`, `src/data/factories.ts`, `src/systems/factions.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: blocked. `package.json` currently defines only `dev`, `build`, and `preview`; npm reports `Missing script: "typecheck"`.

## Plan

- Add `src/gen/maintenance/cult_held_workshop.ts`.
- Register it from the Maintenance content manifest.
- Keep outcomes data-driven through side quests and `systems/events.ts`.
- Validate with available npm scripts after implementation.

## Implementation

- Added a Maintenance POI: `Культовая мастерская: станок дверных комплектов`.
- Added capped occupants: one cult foreman, two cult guards, two non-cult quest NPCs, one nearby robot guard.
- Added choices:
  - repair the machine for workers with `gear`;
  - clear the room by killing the cult foreman;
  - negotiate tribute with `grey_briquette`;
  - sabotage the drive belt with `fuse`;
  - sneak/steal from cult faction production containers.
- Added cult-controlled room cells, cult signs, machinery, output containers, and a `metal_shop` production-output container.
- Added event observer outcomes for repaired, captured, sabotaged, tribute, and looted paths using existing event types and tags.

## Validation

- `npm run typecheck`: blocked before edits; script is missing from `package.json`.
- `npm run check`: blocked; script is missing from `package.json`.
- `npx tsc --noEmit`: blocked by existing unrelated errors outside AG83 files, including `src/entities/monster.ts`, `src/gen/procedural_floor.ts`, `src/systems/faction_events.ts`, `src/systems/lift_arachna.ts`, and others.
- `npm run build`: blocked by existing duplicate `roomCenter` declaration in `src/gen/procedural_floor.ts`.
- `npx esbuild src/gen/maintenance/cult_held_workshop.ts --bundle --format=esm --platform=browser --outfile=/tmp/ag83_cult_workshop.js --log-level=warning`: passed.
