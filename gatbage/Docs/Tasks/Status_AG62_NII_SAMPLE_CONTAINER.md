# AG62 NII Sample Container Status

## Prompt

- Extracted `AGENT_62_NII_SAMPLE_CONTAINER` from `Docs/AgentPrompts/AGENT_62_NII_SAMPLE_CONTAINER.md`.

## Preflight

- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.1 and 17-19.
- [x] Read `src/gen/maintenance/content_manifest.ts`.
- [x] Read `src/gen/maintenance/content_helpers.ts`.
- [x] Read `src/systems/containers.ts`.
- [x] Read `src/data/container_defs.ts`.
- [x] Read `src/data/contracts.ts`.
- [x] Read `src/systems/contracts.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Baseline `npm run typecheck`: blocked, package has no `typecheck` script.

## Implementation

- [x] Added `src/gen/maintenance/slime_sample_post.ts`.
- [x] Registered the post in `src/gen/maintenance/content_manifest.ts`.
- [x] Added narrow item id `nii_sample_container`.
- [x] Added three Maintenance sample contracts for science, liquidators and black market.
- [x] Used stable slime sample item ids (`slime_sample_brown`, `slime_sample_green`, `slime_sample_silver`) without importing AG61 runtime data.
- [x] Published sample equipment events through existing container events and sample-return outcome events.

## Validation

- [x] `npm run check`: blocked, package has no `check` script.
- [x] `npx tsc --noEmit`: blocked by unrelated current worktree errors in `src/gen/maintenance/paritel_steam_bridge.ts`, `src/main.ts`, `src/render/map_ui.ts`, `src/systems/cell_hazards.ts`, `src/systems/containers.ts`, `src/systems/debug.ts`, `src/systems/faction_events.ts`, `src/systems/govnyak.ts`, `src/systems/inventory.ts`, `src/systems/lift_arachna.ts` and `src/systems/rpg.ts`.
- [x] Targeted TypeScript error scan for AG62-touched files: no matching diagnostics.
- [x] `npm run build`: passed.

## Notes

- The AG61 slime data rail is present in this worktree, but AG62 does not import it. The post uses stable item ids so the module has no compile-time dependency on another agent's module.
