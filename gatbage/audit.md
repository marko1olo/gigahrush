# GIGAHRUSH Audit And 100% Development Plan

Date: 2026-05-17  
Latest audit update: 2026-05-17 after procedural quest deadline cleanup
Role: architecture + game design audit  
Scope: code, `README.md`, `desdoc.md`, `architecture.md`, `Docs/Tasks`, `Docs/AgentLogs`, `Docs/Expansions`

## 0. Verdict

Gigahrush is already a playable content-driven TypeScript/Vite raycaster. The next phase is not engine reinvention. The next phase is content production on top of existing systems, plus finishing half-integrated systems that already exist in the tree.

Current hard fact: the mandatory compile/build gates are green.

```txt
npx tsc --noEmit
PASS

npm run build
PASS: 204 modules, dist/index.html 1,016.72 kB, gzip 307.89 kB, built in 1.09 s

npm run test:unit
PASS: 30 tests

npm run smoke
PASS: hudLit=36864, webglLit=1024
```

## 16. Seventh Audit After Procedural Quest Deadline Cleanup

### What changed

- Removed the global active quest cap from `offerQuest`.
- Removed the old NPC fallback that called `spawnContract` after `offerQuest`; NPCs now use one player-facing route: `Задание`.
- Removed debug/system-assignment active-count caps from `spawnContract`.
- Added procedural quest deadlines: `timeLimitMinutes`, `expiresAtMinutes`, and `failed`.
- Plot-chain quests and hand-authored side quests stay unlimited because they carry `plotStepIndex` or `sideQuestId`.
- Procedural deadlines scale by urgency and complexity: rare urgent danger can be 1 in-game hour minimum, normal work is around a day, cross-floor/high-count/multi-kill/high-rank tasks can last several days.
- Expired procedural quests are marked failed, removed from active lists, shown as failed in the quest log, and publish `quest_failed` or compatibility `contract_failed` events.
- Quest UI and NPC quest tab now show remaining time for timed assignments.
- Added unit coverage for no global active cap, procedural deadlines, and timeout failure.

### Verification

```txt
npx tsc --noEmit
PASS

npm run build
PASS: 204 modules, dist/index.html 1,016.72 kB, gzip 307.89 kB, built in 1.09 s

npm run test:unit
PASS: 30 tests

npm run smoke
PASS: hudLit=36864, webglLit=1024
```

## 15. Sixth Audit After Multi-Agent Integration Cleanup

### What changed

- Removed the fake `targetRoomType: undefined as unknown as number` from the Hell VISIT story step; it now relies on the existing `visitFloor` path.
- Added `floor` ownership to `ProductionState`; production registration, resource spending, ticking, and summaries are now scoped to the current floor.
- Added regression coverage that production from one floor cannot write into another floor's container with the same numeric id.
- Added `production_output` metadata to factory containers and visible container UI status for last output or blocked production.
- Production events near the player now enter world log/HUD and feed the rumor/dialogue layer; remote production stays low-severity telemetry.
- Cross-floor VISIT quests now show floor/lift hints in the quest log, lift prompts, minimap, and full map.
- Generator placement `console.log` calls are gated behind `globalThis.GIGAHRUSH_GEN_LOGS`; tests and normal builds no longer spam placement logs.
- Cleaned trailing whitespace caught by `git diff --check`.

### Verification

```txt
npm run typecheck
PASS

npm run test:unit
PASS: 28 tests

node scripts/content-audit.mjs
PASS: Errors: none

npm run build
PASS: 203 modules, dist/index.html 1,014.12 kB, gzip 307.23 kB, built in 1.09 s

npm run smoke
PASS: hudLit=36864, webglLit=1024

npm run check
PASS
```

## 14. Fifth Audit After Contract Vocabulary Cleanup

### What changed

- Removed the stale `offerNpcContract` API and its NPC-only scoring path from `src/systems/contracts.ts`.
- Kept `spawnContract` only as a debug/system-assignment helper; player-facing NPC flow now goes through `offerQuest`.
- Updated player-facing text in `context_lines.ts`, `rumors.ts`, and `world_log.ts` from "contract" wording to "system assignment" wording.
- Changed Black Market 88 task descriptions from "Контракт 88" to "Задание 88".
- Added a unit test proving that ordinary NPC `Задание` can select former contract templates and produce a normal `quest_created` event with `contractId` metadata.
- README now explains contracts as a legacy/internal template bank, not a second task type.

### Verification

```txt
npx tsc --noEmit
PASS

npm run build
PASS: 202 modules, dist/index.html 1,008.73 kB, gzip 305.54 kB, built in 1.35 s

npm run test:unit
PASS: 26 tests

npm run smoke
PASS: hudLit=36864, webglLit=1024
```

First audit found a red strict TypeScript gate in `src/systems/production.ts`. That is now fixed. Additional must-fixes were applied: NPC dialogue now receives world/state/player/time context, monster variant definitions affect spawned monsters, containers have a normal player UI, former contracts are folded into ordinary contextual NPC assignments, and NPC trade uses economy scarcity prices.

Current code scale from CLI inspection:

| Metric | Current fact |
| --- | ---: |
| TypeScript files under `src` | 200 |
| TypeScript LOC under `src` | 46,002 |
| Floor levels in `FloorLevel` | 6 |
| Monster enum kinds | 22 |
| Item definitions | 188 |
| Physical weapon stat records | 32 |
| Resource defs | 14 |
| Factory defs | 8 factories / 15 recipes |
| Rumor defs | 148 |
| Monster variant defs | 20 |
| Floor/content generator files under `src/gen` | 88 |
| Expansion design docs | 10 |

The project has enough engine. It needs disciplined content lanes, visible player loops, and integration of the systems already present.

## 1. Sources Used

- `README.md`: current implementation fact sheet.
- `desdoc.md`: roadmap and tone.
- `architecture.md`: current engineering contract.
- `src/core/types.ts`, `src/core/world.ts`: runtime data model.
- `src/main.ts`: game loop, save/load, floor switching.
- `src/systems/*`: samosbor, AI, quests, economy, production, containers, events, rumors.
- `src/data/*`: items, weapons, plot, rumors, economy resources, factories, variants.
- `src/gen/*`: floor generation and content manifests.
- `Docs/Tasks/*`, `Docs/AgentLogs/*`: active/incomplete agent state.
- `Docs/Expansions/*/expansion.md`: expansion backlog.

Local `AGENTS.md`, `.agents-skills/`, `CURRENT_BATCH.md`, and `Docs/Actual Domains of Project.txt` are absent in this checkout. Mandates below are taken from the available project docs and logs.

## 2. Mandates For All Future Work

1. Working game first. No refactor loop before content delivery.
2. `README.md` is factual shipped behavior. `desdoc.md` is direction.
3. Add content through modules, manifests, registries, and ids. Do not hardcode one content feature into `main.ts`.
4. Use existing data-oriented world arrays and flat entity arrays. Do not introduce class trees or frameworks.
5. Toroidal coordinates are mandatory: use `world.wrap`, `world.idx`, `world.delta`, `world.dist`, `world.dist2`.
6. No hot-loop content scans. Use generation-time work, interaction-time checks, slow ticks, caps, and ring buffers.
7. Prefer cinematic fakes over simulation: fog tint, marks, room state, HUD, logs, spawn weights, not fluid/steam/market physics.
8. Every content module must be visible to the player and must touch at least one gameplay decision.

## 3. Code Audit Findings

### P0 closed: strict typecheck is green

First audit found `src/systems/production.ts:48` with an unused `world` parameter in `registerFactoryRoom`. With `noUnusedParameters: true`, that blocked `npx tsc --noEmit`.

Fix applied:

- Removed the dead parameter from `registerFactoryRoom`.
- Updated the call site in `ensureProductionRooms`.
- Re-ran strict TypeScript and Vite build.

Current verification:

```txt
npx tsc --noEmit
PASS

npm run build
PASS
```

No P0 compile blocker remains in this audit pass.

### P1 partially closed: AG10 economy/containers/production has player-facing routes

Evidence:

- `src/data/economy.ts`, `src/data/resources.ts`, `src/data/factories.ts` exist.
- `src/systems/economy.ts`, `src/systems/production.ts`, `src/systems/containers.ts` exist.
- `src/main.ts` now imports `ensureRoomContainers`, container transfer helpers, `economyForSave`, `normalizeGameEconomy`, `getAdjustedItemPrice`, `ensureProductionRooms`, and `tickProduction`.
- New game/init/load paths ensure containers and production rooms.
- Save/load includes economy, production, event state, and current-floor containers.
- Main loop calls `tickProduction(state, world)` every 60 ticks.
- Player can open a nearby/looked container with `E` and move items through a two-grid container UI.
- NPC menu keeps three actions only: talk, quest, trade.
- `src/systems/quests.ts` now raises contextual quest-giver probability and can turn former contract definitions into ordinary `Quest` rows from the normal `Задание` path.
- NPC trade buy/sell prices use `getAdjustedItemPrice`.
- Debug commands expose prices, nearby containers, taking one item, forced production tick, system assignments, and balance summary.

Impact: the economy spine is no longer dead code or debug-only. It has a minimal player loop: find container, steal/store supplies, trade at scarcity price, take contextual assignments, produce into containers.

Minimum next finish:

- Production consequences visible through events, logs, room containers, and quests.
- Better container discoverability/visual language in 3D view.
- Production-generated assignments should become more visible through room logs, rumors, and NPC lines.

### P1 closed: dialogue context is now fed

Evidence:

- `src/data/dialogue.ts` accepts `generateTalkText(npc, options)`.
- `src/systems/context.ts` can build room/zone/floor/player/samosbor context.
- `src/main.ts` now calls `generateTalkText(npc, { world, state, player, time: state.time })`.

Impact: NPC talk can now use room, zone, floor, player distance, current floor, and samosbor context through the existing optional API.

Remaining risk: memory is still module-level and transient unless deliberately persisted later. That is acceptable for now.

### P1 closed: monster variants now affect runtime spawns

Evidence:

- `src/data/monster_variants.ts` defines 20 `MonsterVariantDef` records.
- `src/entities/monster.ts` now exposes `applyMonsterVariant`.
- `src/systems/samosbor.ts` applies variants to samosbor corridor/random/fog spawns, extra eyes, and fog bosses.
- `src/systems/debug.ts` force-applies available variants in the monster debug spawn path.
- `src/systems/ai/monster.ts` uses cached `monsterDmgMult` for melee and ranged attacks.
- `entityDisplayName` now prefixes monster names by variant.

Impact: monster variants are now spawn-time modifiers, not new per-frame systems.

Remaining risk: several bespoke content spawns outside samosbor still create base monsters. That is acceptable; variants are now proven and can be expanded to content helpers later.

### P1: status files show unfinished system work

Incomplete or suspicious current state:

- `Status_AG09_RUMORS.md`: tasks 12-14 unchecked; no final `LOG_AG09_RUMORS.md`.
- `Status_AG10_ECON.md`: tasks 7-16 are still recorded unchecked, but the code has moved ahead and compile is now green. Treat the status as stale until AG10 is reconciled.
- `Status_DOC_EXPANSIONS.md`: tasks 16-18 unchecked.
- `Status_UNASSIGNED.md`: unrelated adult-art task remains incomplete and should not block this content plan, but it is noise.

Action: finish, block, or explicitly retire these statuses before relying on their features.

### P1: README has fact drift risk

Known drift candidates:

- README still contains older statements like 10 monsters / 32 textures in some sections, while code has 22 `MonsterKind` enum values and `Tex.COUNT = 197`.
- Debug menu documentation should reflect current command list, including event history.
- Economy/production/containers should not be documented as shipped gameplay until AG10 is finished and wired.

Action: after player-facing economy/container/contract routes are finished, do one factual README pass only. No roadmap prose in README.

### P1: `main.ts` is the integration bottleneck

`src/main.ts` is 2,117 lines and owns game loop, interaction, combat/projectiles, save/load, floor switching, menu state, and many cross-system calls. This is acceptable for a small browser game, but future agents must not add content-specific logic there.

Rule:

- Allowed: one integrator-owned generic hook.
- Forbidden: one-off NPC, POI, contract, item, or floor logic in `main.ts`.

Next extraction targets only after content pressure proves it:

- interaction dispatch;
- save/load adapters;
- slow tick scheduler;
- floor transition adapter.

### P2: generator `console.log` noise should be gated

Many content generators log room placement directly. That is useful during content authoring but noisy in production.

Action: later add a tiny debug-gated logger or leave logs only under debug builds. This is not P0.

### P2: container lookup can become O(n) at high counts

`World.containersAt()` gets ids by cell, then does `this.containers.find(v => v.id === id)` per id. It is interaction-time, not per-frame, so it is acceptable now. If container count grows past a few hundred, add `containerById`.

## 4. What Must Not Be Done

- Do not rewrite the renderer.
- Do not add React, ECS frameworks, physics engines, asset pipelines, or imported art packs.
- Do not add one `FloorLevel` enum value for every joke or pocket floor. Use floor instances/definitions for numbered floors.
- Do not simulate fluids, steam, market logistics, or every NPC memory fact per frame.
- Do not create a second event bus, economy, quest system, or dialogue system.
- Do not write generic "content.ts" dumps.
- Do not trust a feature just because a data file exists. It must be reachable in-game or debug.

## 5. The 100% Development Plan

### Phase 0: stabilization gate

Goal: restore confidence in the working base.

Required output:

- `npx tsc --noEmit` passes.
- `npm run build` passes.
- `README.md` reflects implemented facts only.
- Incomplete status files for AG09/AG10/DOC_EXPANSIONS are either completed or marked blocked.
- No new feature starts from a red compile state.

Tasks:

1. ~~Fix `src/systems/production.ts:48`.~~ Done.
2. ~~Run strict typecheck and Vite build.~~ Done.
3. Audit README for shipped facts: floors, monsters, textures, debug commands, economy state.
4. Close or update unfinished status/log files.

### Phase 1: finish existing rails before adding new rails

Goal: make already-written systems visible to the player.

Priority order:

1. Containers: player can inspect/open/take/put.
2. Production: slow-tick factory rooms create outputs into containers.
3. Economy: scarcity changes prices or debug-visible values.
4. Dialogue context: NPC talk receives world/state/player context.
5. ~~Monster variants: spawn pipeline applies variants.~~ Done for samosbor/debug spawns.
6. Contracts: wrap existing quest types; do not replace story quests.

Acceptance:

- Every system has a debug way to inspect it.
- Every system has at least one in-game route.
- Every persistent system has save/load tolerance.
- No per-frame full-world scans.

### Phase 2: content factory on existing floors

Goal: add more playable content without expanding the engine.

Target first wave:

| Floor | Content target | Gameplay purpose |
| --- | --- | --- |
| LIVING | school/OBZH, hospital pocket, new apartment dramas, hermodoor incidents | early survival choices and human stories |
| KVARTIRY | food queues, riot escalations, family rescue, illegal print jobs | crowd pressure and resource conflict |
| MINISTRY | documents, permits, archives, inspections, false paperwork | bureaucracy as gameplay |
| MAINTENANCE | heatline, steam valves, pressure rooms, pump failures | spatial hazards and repair routes |
| HELL | herald cult cells, meat rituals, late-game boss rooms | escalation and dread |
| VOID | protocol rooms, memory tests, black-box traces | final arc without explaining samosbor |

Per module minimum:

- 1 named location.
- 1 named NPC or hostile entity group.
- 1 player decision: trade, steal, repair, escort, kill, hide, forge, expose, reroute.
- 1 samosbor reaction.
- 1 loot/document/rumor hook.
- 1 debug or map/log verification route.

### Phase 3: survival economy and contracts

Goal: make item acquisition feel like life in the building, not random drops only.

Build from existing AG10 spine:

- room containers;
- factory recipes;
- abstract resource stock;
- production events;
- scarcity pricing;
- contract boards.

MVP loops:

1. Kitchen lacks water -> player repairs pump or steals water coupons -> kitchen produces food.
2. Armory lacks metal/ammo -> player brings scrap -> output container gains ammo.
3. Ministry requires stamped form -> player gets legal form, forged form, or bribes clerk.
4. Black market creates debt -> overdue debt triggers event or faction pressure.

Do not simulate full logistics. Room-level stock and event consequences are enough.

### Phase 4: samosbor as story generator

Goal: every samosbor leaves aftermath.

Add:

- pre-warning events from rumors, lights, doors, radio, NPC panic;
- aftermath events: missing resident, sealed room, wrong corridor, mutant survivor, inspection;
- post-samosbor loot windows and rescue windows;
- zone history visible through `systems/events.ts`;
- variant-specific content hooks.

Do not change fog into a heavy simulation. Use existing fog/tint/spawn mechanics plus events and POIs.

### Phase 5: A-Life stories

Goal: NPCs create stories the player can remember.

Minimum:

- pass context to talk;
- persist or at least stabilize important memory later;
- let NPCs react to theft, rescue, wounds, samosbor survival, and local scarcity;
- add family/neighbor quests through existing side quest patterns;
- add migration only as slow-tick zone relocation, not real crowd simulation.

Rule: A-Life must create decisions, not background CPU heat.

### Phase 6: pocket floors and expansions

Goal: grow verticality without enum bloat.

Expansion order:

1. Black Market 88: uses containers, contracts, economy.
2. Mushroom Shift: uses production, food scarcity, contamination.
3. OBZH School: uses hermodoor/samosbor training and evacuation choices.
4. Hospital Quarantine: uses statuses and documents.
5. Heatline Zero: uses maintenance pressure and steam fakes.
6. Raionsovet/Archive: uses documents/access and ministry.
7. Metro Error Line: uses travel routing and pocket hubs.
8. Concentrate Industry: uses mature economy/production.
9. Elevator Loop 404: uses floor instances.
10. Void Afterprotocol: late-game black-box/protocol layer.

Do not implement a full new floor before a vertical slice proves the loop on existing floors.

## 6. Immediate Work Packages

These are ready for follow-up agents.

### WP-00 Compile Gate

Scope: `src/systems/production.ts`, no design changes.  
Task: fix unused `world` parameter and run `npx tsc --noEmit`, then `npm run build`.  
DOD: done in second pass. `npx tsc --noEmit` PASS, `npm run build` PASS.

### WP-01 Economy Integration

Scope: `src/main.ts` generic slow tick hook, `src/systems/economy.ts`, `src/systems/production.ts`, debug only if needed.  
Task: run `tickProduction` on a slow cadence, expose scarcity/production in debug.  
DOD: no per-frame room scan; forced debug tick produces items into containers.

### WP-02 Container Interaction

Scope: `src/systems/containers.ts`, generic interaction path, existing inventory UI or debug fallback.  
Task: player can inspect/open/take/put nearby containers.  
DOD: theft/access event fires; public container works; locked/faction container gives feedback.

### WP-03 Dialogue Context Wiring

Scope: one call site in `src/main.ts` plus possible tiny type cleanup.  
Task: pass `world`, `state`, `player`, `time` into `generateTalkText`.  
DOD: done in second pass. Runtime line selection now receives the full optional context object.

### WP-04 Monster Variants Runtime

Scope: spawn helpers in samosbor/floor content; entity display if needed.  
Task: apply `MonsterVariantDef` at spawn.  
DOD: done in second pass. Debug spawn and samosbor spawns can create prefixed variants with adjusted HP/speed/damage.

### WP-05 Contract Board MVP

Scope: new `src/data/contracts.ts`, `src/systems/contracts.ts`, one debug/interact route.  
Task: create 12 short contracts wrapping existing quest types.  
DOD: contract can be accepted, completed, rewarded, and logged without replacing story quests.

### WP-06 Black Market 88 MVP

Scope: `src/gen/living` or pocket module, existing economy/contracts.  
Task: hidden market node, trader, debtor, contract broker, access condition.  
DOD: at least 3 contracts, 2 debts, 1 samosbor consequence.

### WP-07 Mushroom Shift MVP

Scope: existing floors only; no new `FloorLevel`.  
Task: grow/harvest/spoil loop via slow tick and containers.  
DOD: one food production route and one contamination event.

### WP-08 OBZH School MVP

Scope: LIVING content module.  
Task: school POI with evacuation drill, hermodoor lesson, teacher NPC, child/family quest.  
DOD: player learns or earns one practical survival advantage, not a tutorial page.

### WP-09 Hospital Quarantine MVP

Scope: pocket POI and bounded statuses.  
Task: bleeding/burn/infection/psi exhaustion treatment loop.  
DOD: one status can be acquired, treated, and documented.

### WP-10 Heatline Zero MVP

Scope: MAINTENANCE content modules.  
Task: steam-blocked route, valve state, pressure room, repair choice.  
DOD: steam is a cinematic fake; no temperature simulation.

### WP-11 README Fact Pass

Scope: `README.md` only.  
Task: align factual counts and implemented systems after P0/P1.  
DOD: no roadmap promises; code and README stop contradicting each other.

## 7. Content Module Definition Of Done

Every new content module must answer these before it is marked done:

- Where is it encountered?
- What does the player do there?
- What changes if the player ignores it?
- What does samosbor do to it?
- What NPC/faction/economy/quest/event system observes it?
- How is it verified in-game or debug?
- What cap/cooldown prevents frame-time growth?
- Did `npx tsc --noEmit` and `npm run build` pass after the module?

No answer means the module is decoration, not content.

## 8. Game Design Direction

Primary loop:

```txt
leave shelter -> gather need/resource/info -> negotiate/steal/fight/repair ->
siren/variant pressure -> hide or exploit window -> aftermath changes route ->
new rumor/contract/debt opens
```

Core fantasy:

- The building is bigger than the player.
- Victory is local and temporary.
- Bureaucracy is a gameplay surface.
- Food, water, doors, paperwork, rumors, and trust are as important as weapons.
- Weird content is allowed, but it must be playable and grounded in concrete domestic detail.

Horror source hierarchy:

1. Door during siren.
2. Empty kitchen.
3. Wrong document.
4. Neighbor who remembers too much.
5. Corridor that used to be safe.
6. Monster.

This order matters. Do not turn the project into a pure shooter.

## 9. Scalability Rules

Low device:

- static rooms;
- existing textures/sprites;
- small spawn counts;
- slow ticks;
- text/log/HUD feedback.

Middle:

- more room variants;
- more containers and loot;
- more rumors;
- more event consequences.

High:

- denser marks, decals, props, light variation;
- richer event history and A-Life reactions;
- more simultaneous encounters with caps.

Ultra:

- visual overkill through procedural variants, rare set pieces, dense documents, and aftermath traces;
- still no unbounded per-frame world scans.

Performance is currency for atmosphere, not permission to simulate nonsense.

## 10. Final Priority List

1. Fix strict typecheck.
2. Finish AG10 integration or mark it blocked.
3. Pass dialogue context into existing talk system.
4. Consume monster variant data at spawn.
5. Make containers/economy visible through player actions.
6. Add Black Market and Mushroom Shift as first content/economy vertical slices.
7. Add OBZH School and Hospital as human survival content.
8. Add Heatline and Archive as maintenance/ministry systemic content.
9. Add Metro and 404 only after floor-instance routing exists.
10. Keep README factual after every shipped slice.

That is the path. More content, less engine vanity.

## 11. Second Audit After Must-Fix Pass

### What was fixed

- `src/systems/production.ts`: removed the dead `_world` parameter from `registerFactoryRoom`.
- `src/main.ts`: NPC talk now calls `generateTalkText(npc, { world, state, player, time: state.time })`.
- `src/entities/monster.ts`, `src/data/monster_variants.ts`, `src/systems/samosbor.ts`, `src/systems/ai/monster.ts`, `src/systems/debug.ts`, `src/core/types.ts`: monster variants now apply as spawn-time modifiers.
- Verification:
  - `npx tsc --noEmit`: PASS.
  - `npm run build`: PASS, 169 modules, `dist/index.html` 720.70 kB, gzip 222.55 kB, 762 ms.

### Current system state

Economy/containers/production are no longer inert:

- containers are created on init/load and debug demand;
- production rooms are ensured on init/load;
- production ticks once per 60 game ticks;
- economy and production state are saved/loaded;
- debug exposes economy prices, nearby containers, forced production, contracts, and population/item balance.

This is enough for developer verification. It is not enough for final player-facing gameplay because container and contract interaction still largely route through debug commands.

### Remaining P1 work

1. Add normal container UI/interaction, not only debug take-first-item.
2. Add a real contract source: board, broker NPC, black market desk, or ministry terminal.
3. Wire scarcity prices into NPC trade.
4. Update README after those are player-visible.
5. Gate or remove generator `console.log` noise later.

### Revised next action order

1. Container interaction UI.
2. Contract board/broker.
3. NPC trade scarcity.
4. README factual correction.
5. Black Market 88 vertical slice.
6. Mushroom Shift vertical slice.

Do not start Metro/404/new floor work before the economy/contract/container loop is playable without debug.

## 12. Third Audit After Player-Facing AG10 Pass

### What was fixed

- `src/main.ts`, `src/core/types.ts`, `src/render/container_ui.ts`, `src/render/hud.ts`: added normal `E` interaction for nearby/looked containers, two-grid transfer UI, pause integration, HUD prompt support, and current-floor container save/load.
- `src/main.ts`, `src/render/npc_ui.ts`: briefly added `Контракт` to the NPC menu and routed it through existing `spawnContract`; this was superseded by the fourth audit below.
- `src/main.ts`, `src/render/npc_ui.ts`: NPC trade now uses `getAdjustedItemPrice`, so scarcity affects buy/sell numbers outside debug.
- `README.md`: corrected shipped facts for trade, save/load, contracts, containers, and HUD.

### Verification

```txt
npx tsc --noEmit
PASS

npm run build
PASS: 171 modules, dist/index.html 733.88 kB, gzip 226.98 kB, built in 707 ms

npm run test:unit
PASS: 15 tests

npm run smoke
PASS: hudLit=36864, webglLit=1024
```

### Remaining P1

1. Container objects need stronger in-world readability; current interaction works, but containers are not first-class 3D props.
2. Production needs player-readable consequences: room logs, shortages, assignment hooks, and event-driven rumors.
3. Generator `console.log` noise still needs a later production cleanup pass.

## 13. Fourth Audit After Contextual Quest Pass

### What changed

- Removed the separate `Контракт` action from the NPC menu.
- Increased ordinary quest-giver probability from a flat 10% to contextual 20-55%.
- Raised active assignment cap from 5 to 8 in that pass; this was superseded by the seventh audit, which removes the global active quest cap entirely.
- `offerQuest` now builds context from NPC profession, faction, room type, zone danger, samosbor state, and nearby monsters.
- Former `ContractDef` rows are now a contextual system-assignment pool inside ordinary `Задание`; `contractId` remains metadata only.
- README now states the shipped model: talk, assignment, trade. No separate contract tab.

### Verification

```txt
npx tsc --noEmit
PASS

npm run build
PASS: 179 modules, dist/index.html 817.63 kB, gzip 250.99 kB, built in 821 ms

npm run test:unit
PASS: 15 tests

npm run smoke
PASS: hudLit=36864, webglLit=1024
```
