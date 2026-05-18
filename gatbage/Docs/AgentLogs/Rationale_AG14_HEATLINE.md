# AG14 Heatline Zero Rationale

Updated: 2026-05-17 20:56 BST

## Main Decision

This slice keeps Heatline Zero static. The goal asks for local heat/steam hazard gameplay, but the polish mandate says to delete runtime helpers if they become more complex than the gameplay. A full heat-node tick would require a main-loop integration point, save state, custom event types, and balancing work. For this patch, static room state gives the player the required decisions with much lower risk.

## Implementation Shape

- New content is isolated in `src/gen/maintenance/heatline_zero.ts`.
- The manifest owns the one integration call.
- The helper `src/systems/heatline.ts` only summarizes static Heatline rooms for debug; it does not simulate heat.
- Debug output is appended to the existing balance/catalog command, avoiding a new menu slot or extra `main.ts` interaction logic.

## Player Decisions

- Risk shortcut: the obваренный corridor is short, visibly scorched, and guarded by local heat-themed monsters.
- Repair: Захар asks for asbestos cord and a manometer, using existing side quest and event flow.
- Steal/loot: the repair box places useful heatline items before the player commits to quests.
- Avoid: the safe shower bypass is a longer, wet route with a VISIT quest marker.
- Sabotage: Мира offers a fuel handoff that frames overheat as deliberate sabotage without adding an explosion sim.

## Event Choice

No new `WorldEventType` was added because `core/types.ts` is outside the AG14 write scope. Repair, sabotage, and visit outcomes publish through the existing side quest lifecycle as `quest_created` and `quest_completed` events, with `sideQuestId` in event data. This keeps the slice compatible with the current event store and world log.

## Why No Runtime Hazard System

A runtime heat helper would need a caller in the game loop and persistent state. That would push the task into `main.ts`/save integration and conflict with the prompt's narrow ownership. The current implementation uses cinematic fakes: room names, lamps, water, scorch marks, monsters, loot, quests, HUD/log quest messages, and debug inspection.

## Known Validation Blocker

Post-edit Vite build passes. `npm run check` fails before tests/build/smoke because current-tree TypeScript errors exist outside AG14 files, currently in `src/data/dialogue.ts`, `src/gen/void/index.ts`, `src/systems/containers.ts`, and `src/systems/rumor.ts`. The blocker is repository typecheck state rather than the Heatline Zero import graph.
