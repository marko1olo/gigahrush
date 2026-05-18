# AG85 Cult Procession Status

## Prompt

- Extracted prompt id: `AGENT_85_CULT_PROCESSION_EVENT`.
- Domain: Faction Events / Zone Control / Avoid-Disrupt Choice.
- Goal: rare cult procession event that temporarily affects zone fear/control and can be avoided, disrupted, followed, reported, or used as cover.

## Preflight

- Read `README.md`: done.
- Read `architecture.md`: done.
- Read `desdoc.md` section 16.2: done.
- Read `src/data/faction_events.ts`: done.
- Read `src/systems/faction_events.ts`: done.
- Read `src/systems/factions.ts`: done.
- Read `src/systems/events.ts`: done.
- Read `src/render/map_ui.ts`: done.
- Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script; available scripts are `dev`, `build`, and `preview`.

## Implementation Status

- Event trigger/radius/cooldown definition: done. `cult_procession` is rarer (`weight: 7`, `cooldownSec: 560`) and owns `activeSec`, `actionRadius`, `fearRadius`, `controlRadius`, and `coverSec`.
- Capped NPC/mark/log representation: done. Runtime keeps capped spawned pilgrim ids and residue; no route simulation was added.
- Player actions: done.
  - `E` at the outer radius: avoid/hide at the edge.
  - `E` near the procession: follow at ПСИ/HP risk.
  - `E` near the procession with equipped `radio`: report to liquidators.
  - `E` near the procession with `meat_rune`: use the sign as cover.
  - Killing enough procession NPCs disrupts the event.
- Start/action/aftermath events: done through existing `faction_relation_changed` events tagged `faction_event`, `cult_procession`, and `procession_action`.
- Bounded temporary zone effects: done. Up to `MAX_PRESSURE_CELLS` local control cells are changed for the active window and restored on aftermath.
- Debug force and QA notes: done. Debug menu has `Форсировать культовую процессию`; faction debug summaries list active procession ids, time, NPC survival, and chosen actions.

## Feedback

- HUD interaction prompt names the current procession action.
- Map draws a pulsing cult procession radius and action ring during the active window.
- World log formats procession start, avoid, follow, report, cover, disrupt, and aftermath lines.

## Validation

- Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script.
- `npm run check`: blocked. `package.json` has no `check` script.
- `npm run build`: blocked before AG85 code could be validated by existing duplicate exports in `src/systems/procedural_anomalies.ts` (`proceduralAnomalyEventTags`, `proceduralAnomalyEventData`).
- `npx tsc --noEmit --pretty false`: blocked by existing dirty-tree TypeScript errors in `main.ts`, `render/hud.ts`, and other in-progress modules. A filtered rerun showed no new `src/systems/faction_events.ts`, `src/render/map_ui.ts`, `src/systems/debug.ts`, `src/systems/world_log.ts`, or `src/data/faction_events.ts` diagnostics.
