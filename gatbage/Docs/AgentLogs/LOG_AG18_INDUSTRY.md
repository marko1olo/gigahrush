# LOG_AG18_INDUSTRY

## 2026-05-17 - Concentrate Industry MVP

What was wrong: abstract production existed, but there was no tactile factory-room loop for concentrate: no visible line with input stock, output consequence, risky repair/defense/theft decisions, or bounded samosbor spoilage.

What was done: Added `src/gen/maintenance/concentrate_press.ts` and registered it through `src/gen/maintenance/content_manifest.ts`. The POI creates a сырьевой склад, `RoomType.PRODUCTION` брикетный цех, and a quarantined waste room. It spawns Инна Прессова, Роман Дозатор, Старшина Клин, and Лёва Бракованный with four side quests covering line repair, filter input delivery, defense from арматура, and stolen output. It adds 21 explicit drops and 3 local monsters.

Production integration: Added `industrial_slurry` in `src/data/resources.ts`, `concentrate_press` in `src/data/factories.ts`, and four factory contracts in `src/data/contracts.ts`. Recipes output existing usable item ids: `grey_briquette`, `green_briquette`, and `gasmask_filter`. The line uses existing slow production and room containers, so output appears through existing container/debug paths.

Cinematic cheats used: The line is static room state, machinery features, drops, NPC dialogue, and slow abstract supply. Samosbor aftermath is bounded water/fog contamination in a separate waste room, not a new aftermath simulation. No worker loop, conveyor physics, or new floor enum was added.

Verification: Baseline `npm run build` passed before edits. Post-code `npm run build` passed. Final `npm run check` passed: typecheck, 25 unit tests, Vite singlefile build, and smoke playability. Smoke reported `hudLit=36864`, `webglLit=1024`.
