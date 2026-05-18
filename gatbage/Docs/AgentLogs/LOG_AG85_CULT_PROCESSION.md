# LOG_AG85_CULT_PROCESSION

2026-05-18

- Read AG85 prompt, `README.md`, `architecture.md`, `desdoc.md` section 16.2, faction event data/runtime, faction system, event store, and map UI.
- Baseline `npm run typecheck` was blocked because `package.json` has no `typecheck` script.
- Extended the existing `cult_procession` definition instead of creating a parallel event path: rarer trigger, longer cooldown, explicit active/action/fear/control radii, and cover duration.
- Added transient active procession runtime state with capped NPC ids, temporary local faction-control pressure, fear ticks near the route, and cleanup/aftermath restoration.
- Added player responses through the existing interaction key: avoid at the edge, follow at risk, report with equipped radio, use `meat_rune` as cover, and disrupt by killing enough procession NPCs.
- Published procession start/action/aftermath through existing structured events with `faction_event` / `cult_procession` / `procession_action` tags.
- Added minimal HUD prompt text, map radius overlay, world-log text, debug force command, and README shipped-behavior note.

Validation:
- `npm run typecheck`: blocked; missing npm script.
- `npm run check`: blocked; missing npm script.
- `npm run build`: blocked by existing duplicate exports in `src/systems/procedural_anomalies.ts`.
- `npx tsc --noEmit --pretty false`: blocked by existing dirty-tree errors. A filtered rerun did not report AG85-specific diagnostics in faction event data/runtime, map UI, debug, or world log files.
