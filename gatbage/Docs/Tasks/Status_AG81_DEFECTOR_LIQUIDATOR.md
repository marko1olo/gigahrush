# AG81 Defector Liquidator Status

## Prompt

- Extracted prompt id: `AGENT_81_DEFECTOR_LIQUIDATOR`
- Domain: NPC / Quest / Faction Choice
- Goal: add a wavering liquidator NPC whose quest can resolve through duty, exposure/protection, informant defection, cult handoff, or violence.

## Preflight

- Read `README.md`: done.
- Read `architecture.md`: done.
- Read `desdoc.md` section 16.2: done.
- Read `src/gen/maintenance/content_manifest.ts`: done.
- Read `src/gen/living/zone_content.ts`: done.
- Read `src/data/plot.ts`: done.
- Read `src/systems/quests.ts`: done.
- Read `src/systems/events.ts`: done.
- Read `src/systems/factions.ts`: done.
- Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script; available scripts are `dev`, `build`, and `preview`.

## Plan

- Add one Maintenance content module with a named compromised liquidator, a hidden supply/proof room, and nearby choice NPCs.
- Use side quest registration for route/proof objective and distinct branch offers.
- Use a narrow world-event observer in the module for outcome events, faction standing changes, rumors, delay failure, and violence fallback.
- Hook the module through `src/gen/maintenance/content_manifest.ts`.

## Progress

- Preflight complete.
- Added `src/gen/maintenance/defector_liquidator.ts`.
- Hooked the module through `src/gen/maintenance/content_manifest.ts`.
- Added side-quest gates for local side-quest prerequisites and branch blocking in `src/data/plot.ts`.
- Allowed authored side quests to opt into explicit deadlines through existing quest deadline fields.
- Updated `README.md` deadline wording for the new explicit authored-deadline behavior.

## Validation

- Baseline `npm run typecheck`: blocked, missing script.
- `npx tsc --noEmit`: failed on pre-existing unrelated diagnostics in `pneumomail_station.ts`, `main.ts`, `systems/ai/monster.ts`, `systems/govnyak.ts`, `systems/procedural_anomalies.ts`, and `systems/rpg.ts`; no AG81 file diagnostics were reported.
- `npm run build`: passed.
- `npm run check`: blocked, missing script.
