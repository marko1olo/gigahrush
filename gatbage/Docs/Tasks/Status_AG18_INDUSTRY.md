# Status_AG18_INDUSTRY

Agent: AGENT_18_CONCENTRATE_INDUSTRY  
Domain: Industry / Factory Lines / Abstract Supply  
Prompt source: `Docs/AgentPrompts/AGENT_18_CONCENTRATE_INDUSTRY.md`  
Started: 2026-05-17

## Source Context Read

| Source | Status | Notes |
| --- | --- | --- |
| XML block `AGENT_18_CONCENTRATE_INDUSTRY` | Done | Extracted from the prompt file and used as the task scope. |
| `README.md` | Done | Used as shipped fact map before content and README edits. |
| `architecture.md` | Done | Followed layer contract and manifest-based floor content pattern. |
| `Docs/Expansions/08_concentrate_industry/expansion.md` | Done | Used MVP: one брикетный цех, abstract supply, no conveyor/worker sim. |
| `src/data/factories.ts` | Done | Added one factory profile before generic metal shop matching. |
| `src/systems/production.ts` | Done | Reused slow tick, output containers, and production/block events. |
| `src/data/resources.ts` | Done | Added one narrow abstract resource for press inputs. |
| `src/gen/maintenance/content_manifest.ts` | Done | Registered the new maintenance POI without touching the floor orchestrator. |
| `src/gen/kvartiry/content_manifest.ts` | Done | Read; not used because the MVP fits maintenance better. |
| `src/systems/containers.ts` | Done | Reused generated room containers; no container system change. |

## Checklist

| Task | Status | Evidence |
| --- | --- | --- |
| Baseline build | Done | `npm run build` passed before edits. |
| Factory POI | Done | `src/gen/maintenance/concentrate_press.ts` adds сырьевой склад, line room, and bounded waste quarantine. |
| Recipes/resources | Done | `concentrate_press` recipes output existing `grey_briquette`, `green_briquette`, `gasmask_filter`; `industrial_slurry` is abstract input stock. |
| NPCs and quests | Done | Four named NPCs and four side quests: repair, input delivery, defend line, steal output. |
| Contracts | Done | Four factory-themed system contracts in `src/data/contracts.ts`. |
| Production registration | Done | Room name/type matches `FACTORIES`; existing `ensureProductionRooms()` routes output to generated room containers. |
| Events | Done | Production uses existing `room_produced_items` / `room_blocked_production`; theft uses existing container `item_stolen`; contract/quest events remain existing paths. |
| Samosbor aftermath | Done | Local fog/water contamination is confined to a separate waste room behind a door. |
| README facts | Done | Side quest table, maintenance section, contracts, resources and production counts updated. |

## Verification Record

- Baseline `npm run build`: passed.
- Post-code `npm run build`: passed.
- Intermediate `npm run check`: exposed a test-runner path issue in the shared harness; package script now resolves emitted test files to absolute paths.
- Final `npm run check`: passed.
- Final build output in check: `dist/index.html` 1,008.73 kB, gzip 305.54 kB.
- Smoke result: passed at Vite preview with `hudLit=36864`, `webglLit=1024`.
