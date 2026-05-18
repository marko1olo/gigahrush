# LOG AG43 Cartographer

## 2026-05-17

Implemented `AGENT_43_LIVING_CARTOGRAPHER_ZONE_MAP`.

Files changed:

- `src/gen/living/cartographer_zone_map.ts`
- `src/gen/living/content_manifest.ts`
- `src/data/rumors.ts`
- `src/systems/rumor.ts`
- `Docs/Tasks/Status_AG43_CARTOGRAPHER.md`
- `Docs/AgentLogs/LOG_AG43_CARTOGRAPHER.md`

Summary:

- Added `Комната живой карты`, a protected reachable LIVING POI with `Сева Картограф`.
- Added route-lead gameplay through help, trade, and theft paths.
- Reused existing quest and container event publication.
- Added multi-part rumor `reveals` support for readable expedition clues.
- Added cartographer rumors for Maintenance, Ministry, Kvartiry, and Living route planning.

Validation:

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run check`: blocked by one unit assertion in contract-template assignment.
- `npm run smoke`: blocked by WebGL blank-canvas / HUD pixel checks in the smoke environment.
