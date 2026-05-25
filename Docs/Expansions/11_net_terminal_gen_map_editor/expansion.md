# НЕТ-ТЕРМИНАЛ ГЕН: редактор карты

Статус: MVP implemented, документ остается technical design + интеграционная карта  
Тип фичи: редкая debug/diegetic extra feature, не обязательная основная петля  
Текущий код: `src/data/net_terminal_gen.ts`, `src/systems/net_terminal_gen.ts`, `src/systems/map_editor.ts`, `src/render/net_terminal_gen_ui.ts`, `src/render/map_editor_ui.ts`

## Назначение

`НЕТ-ТЕРМИНАЛ ГЕН` открывает редактор текущего этажа. Игрок получает почти debug-право менять живую карту: убирать и ставить стены, двери, воду, лифты, менять текстуры, features, спавнить NPC, монстров, предметы и контейнеры. После выхода из интерфейса карта уже изменена, потому что редактор мутирует текущий `World`.

Доступ есть двумя путями:

- debug menu: открыть редактор напрямую;
- редкие игровые `НЕТ-ТЕРМИНАЛЫ`, с которыми игрок взаимодействует на `E`.

Без найденного `НЕТ-ТЕРМИНАЛ ГЕН` терминал открывает экран-отказ: `НЕТ-ТЕРМИНАЛ ГЕН НЕ ОБНАРУЖЕН`. После находки того самого странного куска плоти тот же терминал открывает редактор карты.

Важно: существующая `НЕТ-СФЕРА` на `N` остается cloud/chat/profile UI из `src/systems/net_sphere.ts` и `src/render/net_sphere_ui.ts`. Новые `НЕТ-ТЕРМИНАЛЫ` - это world object terminals, не Cloudflare API и не замена `НЕТ-СФЕРЫ`.

## Основа по текущему коду

Факты, которые реализация обязана учитывать:

| Область | Текущий код | Вывод для фичи |
| --- | --- | --- |
| World storage | `src/core/world.ts`: `cells`, `roomMap`, `wallTex`, `floorTex`, `features`, `doors`, `containers`, sparse maps and version counters | Редактор должен менять typed arrays и sparse maps напрямую, затем помечать dirty/update renderer |
| Cell enums | `src/core/types.ts`: `Cell`, `Tex`, `Feature`, `DoorState`, `EntityType`, `MonsterKind`, `ItemDef` | MVP лучше использовать существующие enums; новый `Feature.NET_TERMINAL` не нужен на первом проходе |
| Floor route | `src/systems/procedural_floors.ts`: per-run `runSeed`, `currentZ`, story/design/procedural entries | Плоть должна быть seed-fixed по run seed и route z, а не случайным обычным item spawn |
| Floor rebuild | `src/main.ts`: floor transition regenerates `World`; player inventory/state preserved; save does not serialize full cells | Map edits need compact patch replay if they must survive save/reentry/rebuild |
| Samosbor | `src/systems/samosbor.ts`: самосбор rebuilds volatile world and uses warning/director hooks | Editor patches should be replayable after rebuild or explicitly documented as temporary |
| Director pattern | `src/systems/samosbor_director.ts`: state lives as optional extension on `GameState`, bounded trace, debug summaries | Use the same optional-state pattern: no broad `GameState` refactor unless integrator accepts it |
| Interaction | `src/main.ts` `playerActions()` and `canInteractAhead()` use look cell + `E` chain | Terminal interaction is one more bounded `tryUse...` call before doors/containers |
| HUD/UI | `src/render/hud.ts` draws canvas overlays; `map_ui.ts` already draws map from `World` | Editor is canvas HUD overlay, not DOM UI |
| Debug | `src/systems/debug.ts` returns command actions for floor teleports and executes many local commands | Add debug actions for open editor, reveal/give gen, clear patches |
| Existing Net Sphere | `src/systems/net_sphere.ts` is module-local runtime with `openNetSphere()` and `isNetSphereOpen()` | Map editor can copy this runtime-open pattern instead of storing every UI field in `GameState` |

Blame/context note: recent core orchestration (`architecture.md`, `samosbor_director.ts`, `net_sphere.ts`) was added in the current 2026-05-18 content wave. Treat these as the freshest local patterns: additive systems, bounded state, debug visibility, no per-frame full-world scans.

## Player Flow

1. New run starts and `floorRun.runSeed` exists.
2. `netTerminalGen` state derives one hidden target: route z plus raw x/y from the run seed.
3. When the matching floor is generated, the system resolves raw x/y to a valid walkable cell and spawns one visible pickup: `Странный кусок плоти`.
4. On pickup:
   - show message: `Кажется, это что-то очень важное.`;
   - set `state.netTerminalGen.found = true`;
   - optionally mirror it as a non-droppable key item in inventory.
5. Rare `НЕТ-ТЕРМИНАЛЫ` can appear on any current floor. Pressing `E` opens a terminal overlay.
6. If the gen was not found, the overlay only says `НЕТ-ТЕРМИНАЛ ГЕН НЕ ОБНАРУЖЕН`.
7. If the gen was found, the overlay opens the map editor.
8. Player edits the current floor, exits the terminal, and continues in the changed world.

## Странный Кусок Плоти

This is not a normal loot table item. It may be displayed in inventory, but the source of truth is run state.

Suggested ids:

```ts
export const NET_TERMINAL_GEN_ITEM_ID = 'net_terminal_gen_flesh';
export const NET_TERMINAL_GEN_STATE_KEY = 'netTerminalGen';
```

State shape:

```ts
export interface NetTerminalGenState {
  runSeed: number;
  targetZ: number;
  targetKey: string;
  rawX: number;
  rawY: number;
  resolvedX?: number;
  resolvedY?: number;
  found: boolean;
  pickupClaimed: boolean;
  firstTerminalDenied: boolean;
}
```

Rules:

- Derive target from `ensureFloorRunState(state).runSeed`, not `Math.random()` during floor generation.
- Target can be any reachable route z: story floor, design floor or procedural floor.
- Store `targetKey` as route identity, for example `story:LIVING`, `design:black_market_88`, `procedural:z13`.
- Resolve `rawX/rawY` to the nearest valid `Cell.FLOOR`/`Cell.WATER` only when that floor is generated.
- If samosbor or floor transition rebuilds the target floor before pickup, the pickup reappears at the same resolved coordinate or is re-resolved from the same raw coordinate.
- Once `found = true`, samosbor, floor transitions, item table rebuilds and container generation must not clear access.
- If an inventory mirror is used, terminal checks `hasNetTerminalGen(state, player)`, where state flag wins over inventory slot.
- The item should have `spawnRooms: []`, `spawnW: 0`, `stack: 1`, value `0`, and a key-item tag. Future code should block dropping/trading/destroying it or normalize it back from state.

## НЕТ-ТЕРМИНАЛЫ

Terminals are rare world fixtures. They should use existing world primitives first:

- `Feature.SCREEN` or `Feature.APPARATUS` for the cell marker;
- `Tex.SCREEN_BASE` variants or existing screen wall/floor visuals;
- a sparse terminal registry keyed by `world.idx(x, y)` inside `systems/net_terminal_gen.ts`;
- optional surface mark/static effect for readability.

MVP terminal placement should be cheap and post-generation:

```txt
src/data/net_terminal_gen.ts       terminal weights, labels, palette defs
src/systems/net_terminal_gen.ts    state, target derivation, access, interaction, terminal registry
src/render/net_terminal_gen_ui.ts  denied terminal screen
```

Placement constraints:

- No per-frame full-world terminal scan.
- During floor generation or post-generation setup, sample bounded candidate cells from rooms/screens/corridors.
- Max terminals per floor: 0-2 in normal play, higher only by debug.
- A terminal must be reachable from a floor cell and discoverable through map/screen visual.
- It should not overwrite hermetic shelter walls, `aptMask`, critical lift cells, locked quest doors or portal cells.

Interaction integration:

- Add `isNetTerminalGenTarget(world, state, lookX, lookY)` to `canInteractAhead()`.
- Add `tryUseNetTerminalGen(world, player, state, lookX, lookY)` in `playerActions()` before generic door/container handling.
- On use without gen: open denial overlay and pause.
- On use with gen: open editor overlay and pause.
- Debug path bypasses the terminal and opens editor directly.

## Editor Scope

MVP is a current-floor map editor, not a full campaign construction kit. It edits the live `World` and can optionally save/replay compact patches.

Tools:

| Tool | MVP behavior |
| --- | --- |
| Cell brush | Paint `FLOOR`, `WALL`, `DOOR`, `WATER`, `ABYSS`, `LIFT` |
| Door brush | Create/delete door, choose `OPEN`, `CLOSED`, `LOCKED`, `HERMETIC_*`, optional key id |
| Texture brush | Change `wallTex` or `floorTex` from existing `Tex` enum |
| Feature brush | Set `Feature.NONE`, lamp, table, chair, bed, shelf, machine, apparatus, screen |
| Entity brush | Spawn/delete NPC, monster, item drop; list is generated from factions, `MONSTERS` and `ITEMS` |
| Container brush | Spawn/delete containers from `CONTAINER_DEFS` |
| Inspect | Show cell index, x/y, cell, room id, zone id, texture ids, feature, door/container/entity count |

Later, not MVP:

- room painting and room splitting;
- zone ownership painting;
- quest marker editing;
- terminal script editor;
- exporting/importing full maps.

## UI Design

The UI must stay in canvas/WebGL style. No DOM panels, no framework.

Files:

```txt
src/systems/map_editor.ts      open/close state, cursor, tools, edit operations
src/render/map_editor_ui.ts    fullscreen canvas overlay and tool palette
```

Overlay layout:

- Fullscreen dark terminal overlay.
- Center: 2D grid of the current 1024x1024 toroidal floor.
- Top/left compact tool strip: cell, door, texture, feature, entity, item, inspect.
- Bottom status line: `z/key`, x/y, selected brush, dirty op count, hints.
- Right compact palette for current tool.
- Enter closes without undoing applied changes. Escape is not a game-window key in the browser build.
- Optional confirmation only for destructive bulk clear/fill.

Controls:

| Input | Behavior |
| --- | --- |
| Mouse/touch drag | paint with current brush |
| Wheel / +/- | zoom |
| WASD/arrows | pan editor viewport |
| Right click / hold sample | sample current cell into brush |
| Tab | cycle tool category |
| E | apply current single-cell action |
| Enter | close terminal/editor |

Performance rule for the "whole floor" view:

- Do not redraw `1024 * 1024` semantic analysis every frame.
- Build an offscreen 1024x1024 `ImageData` or canvas thumbnail from `world.cells` and texture/features once on open.
- On edit, update only dirty pixels or rebuild at a throttled cadence.
- Draw the offscreen map scaled/panned each frame.
- Entity dots can be drawn live from the flat `entities` array with a cap or viewport filter.

Existing `drawFullMap()` in `src/render/map_ui.ts` uses a radius-200 view around the player, so it is not enough for this feature. Reuse color logic if helpful, but make a dedicated editor renderer.

## Map Mutation Rules

All map edits must go through one small API instead of being scattered through UI code:

```ts
export type MapEditorOp =
  | { kind: 'set_cell'; x: number; y: number; cell: Cell }
  | { kind: 'set_wall_tex'; x: number; y: number; tex: Tex }
  | { kind: 'set_floor_tex'; x: number; y: number; tex: Tex }
  | { kind: 'set_feature'; x: number; y: number; feature: Feature }
  | { kind: 'set_door'; x: number; y: number; state: DoorState; keyId: string }
  | { kind: 'delete_door'; x: number; y: number }
  | { kind: 'spawn_entity'; x: number; y: number; entityDef: MapEditorEntityDef }
  | { kind: 'delete_entity'; entityId: number }
  | { kind: 'spawn_container'; x: number; y: number; def: MapEditorContainerDef }
  | { kind: 'delete_container'; containerId: number };
```

Mutation invariants:

- Use `world.idx`, `world.wrap`, `world.delta` and `world.dist2` for coordinates.
- Never allow editing the player's current cell into a solid/abyss without moving player first.
- Never delete or overwrite the active terminal cell while its editor is open.
- Do not edit `aptMask` or `hermoWall` in MVP. If a cell is protected, show `ЗАЩИЩЕНО`.
- When changing `Cell.DOOR`, keep `world.doors` in sync.
- When changing away from `Cell.DOOR`, delete matching `world.doors` entry.
- When setting `Cell.WALL`, clear unsafe feature/container/entity placement on that cell.
- When setting `Cell.FLOOR`, preserve or infer `roomMap` from nearest adjacent room; if none, use `-1`.
- Room topology is not authoritative in MVP. Heavy room editing waits for a later phase.
- When placing a lift, set `world.liftDir[idx]` and make sure at least one adjacent passable cell exists.
- When placing lamps/candles, queue `world.bakeLights()` after a short debounce or on editor close, not on every dragged cell.
- Mark `wallTex`, `floorTex`, `surface`, `fog` versions as appropriate.
- Call the renderer world-data update hook after batched edits or editor close.

Entity/container placement:

- Use `nextEntityId.v++` for new entities.
- Use existing `MONSTERS`, `applyMonsterVariant`, `freshNeeds`, `randomRPG`, `randomName`, `ITEMS` helpers.
- Item brush creates `EntityType.ITEM_DROP` with `inventory: [{ defId, count }]`.
- Container brush must call `world.addContainer()` or rebuild maps after deletion.
- Delete entity should only target editor-selected entity ids, not broad radius wipes.

## Patch Replay

Because floors are regenerated on route transitions and save/load currently does not store full world cells, the editor needs a compact patch model if edits should persist.

MVP recommendation: persist edit ops per floor key with a hard cap.

```ts
export interface MapEditorPatch {
  floorKey: string;
  baseFloor: FloorLevel;
  z?: number;
  createdAt: number;
  opCount: number;
  ops: MapEditorOp[];
}

export interface MapEditorPatchState {
  patches: Record<string, MapEditorPatch>;
}
```

Rules:

- Apply patch after every `generateFloor`, `generateDesignFloor` or `generateProceduralFloor` for the current route key.
- Apply patch after samosbor/regrow if the current floor key matches.
- Save/load stores patch state, not full `World`.
- Cap ops per floor for MVP, for example 4096. If exceeded, show `ПАМЯТЬ ТЕРМИНАЛА ПЕРЕПОЛНЕНА` and keep runtime edits but stop persisting more.
- Store ids by string/enum numbers only. Do not serialize live `Entity` objects.
- If an op cannot be replayed after generation, skip it and write a bounded debug trace reason.

This makes the feature feel universal while respecting the existing generated-world architecture.

## Samosbor Integration

The editor should not rewrite `samosbor.ts`. It needs two integration points:

1. Before/after samosbor rebuild, remember the current `floorKey`.
2. After rebuild produces a new `World`, call `applyMapEditorPatchForCurrentFloor()`.

Design behavior:

- The strange flesh unlock is unaffected by samosbor.
- Editor-made geometry persists through samosbor only if patch replay is enabled.
- Samosbor may still add fog, marks, monsters, doors, and aftermath on top of edited geometry.
- If replay would seal the player, move player to nearest passable cell and log/debug it.
- If replay deletes all lifts, do not crash; debug should warn `no_lift_after_editor_patch`.

## Events And Debug Trace

Important actions should publish through `systems/events.ts`.

Suggested event tags:

```txt
net_terminal_gen
map_editor
terminal_denied
terminal_opened
flesh_found
map_patch_applied
map_patch_replay_skipped
```

Use existing event types where possible:

- `player_pick_item` for flesh pickup if mirrored as item;
- `samosbor_warning` or `floor_transition` is not appropriate for editor actions;
- if a new event type is needed, make it small and generic, for example `world_edited`.

Debug commands:

| Command label | Behavior |
| --- | --- |
| `НЕТ-ГЕН: открыть редактор` | Opens editor directly |
| `НЕТ-ГЕН: выдать плоть` | Sets `found = true` and mirrors inventory token |
| `НЕТ-ГЕН: показать цель` | Logs target z/key/x/y and whether resolved/found |
| `НЕТ-ГЕН: поставить терминал` | Places terminal near player |
| `НЕТ-ГЕН: очистить patch этажа` | Clears current floor editor patch |
| `НЕТ-ГЕН: replay patch` | Forces patch replay for QA |

Debug summaries must include:

- run seed;
- target key/z/raw/resolved coordinates;
- found/pickup state;
- terminals registered on current floor;
- current floor patch op count;
- last skipped replay reasons.

## Agent Ownership Plan

Split implementation so only one integrator touches red files.

Green files for workers:

```txt
src/data/net_terminal_gen.ts
src/systems/net_terminal_gen.ts
src/systems/map_editor.ts
src/render/net_terminal_gen_ui.ts
src/render/map_editor_ui.ts
```

Yellow files, one narrow owner:

```txt
src/data/items.ts              add optional key item def only
src/systems/inventory.ts       special pickup/drop normalization only if inventory mirror is used
src/systems/debug.ts           add debug commands/actions
src/render/hud.ts              draw terminal/editor overlays
```

Red/integrator files:

```txt
src/main.ts                    interaction hook, save/load hook, generation patch replay hook
src/core/types.ts              avoid unless adding a new event type or state field is truly necessary
src/core/world.ts              avoid; use existing arrays/maps
src/render/webgl.ts            avoid; editor is HUD canvas overlay
```

Recommended integration style:

- Keep UI open state module-local like `net_sphere.ts`: `openMapEditor()`, `closeMapEditor()`, `isMapEditorOpen()`.
- Store durable unlock/patch state as optional extensions on `GameState`, normalized by system helpers.
- Let `main.ts` call small helper hooks instead of owning feature logic.

## Implementation Phases

### Phase 0: Preflight

Read `README.md`, `architecture.md`, this document, then inspect:

```txt
src/core/world.ts
src/core/types.ts
src/main.ts
src/systems/procedural_floors.ts
src/systems/samosbor.ts
src/systems/debug.ts
src/systems/inventory.ts
src/render/hud.ts
src/render/map_ui.ts
src/systems/net_sphere.ts
```

Output before coding: exact owner map and whether MVP uses inventory mirror item or state-only unlock.

### Phase 1: Unlock State And Flesh

Implement `netTerminalGen` optional state, deterministic target derivation, target resolution on matching generated floor, flesh spawn, pickup message and debug summary.

Acceptance:

- New game has a deterministic target for the same run seed.
- Flesh appears only on target floor and only before pickup.
- Pickup sets `found = true` and logs `Кажется, это что-то очень важное.`.
- Save/load preserves found state.

### Phase 2: Terminals And Denial UI

Place rare terminal fixtures and wire `E` interaction. Without gen, show denial overlay.

Acceptance:

- Debug can place terminal near player.
- `canInteractAhead()` lights mobile `E`.
- Terminal without gen pauses and displays `НЕТ-ТЕРМИНАЛ ГЕН НЕ ОБНАРУЖЕН`.
- Existing `N` Net Sphere behavior is unchanged.

### Phase 3: Read-Only Editor

Open map editor from debug or unlocked terminal. Display current floor as 2D grid with pan/zoom/inspect.

Acceptance:

- No cell mutation yet.
- Works on a 1024x1024 world without visible frame hitch after initial thumbnail build.
- Shows x/y/cell/room/zone/tex/feature under cursor.

### Phase 4: Cell, Door, Texture, Feature Editing

Add edit operations and live world mutation. Batch renderer updates.

Acceptance:

- Can paint wall/floor/door/water/lift and immediately walk into/around changed geometry after close.
- Doors open/close normally after creation.
- Lamps update lighting after close.
- Protected cells reject edits with a message.

### Phase 5: Patch Replay And Save

Persist compact ops per floor key. Replay after floor generation, load and samosbor rebuild.

Acceptance:

- Edit floor, save/load, edit remains.
- Edit floor, leave and return by lift, edit remains for same route key.
- Forced samosbor does not erase persisted editor patch.
- Patch cap and skipped replay reasons are visible in debug.

### Phase 6: Entities, Items, Containers

Add spawn/delete brushes for NPCs, monsters, item drops and containers.

Acceptance:

- Editor entity palette is generated from current game registries, not a hand-written short list.
- NPC brushes include selectable faction variants; the spawned NPC itself can stay random inside that faction.
- Spawned item can be picked up.
- Spawned monster uses existing AI and can fight.
- Spawned NPC can be interacted with if friendly.
- Spawned container opens through existing container UI.

### Phase 7: Validation And Polish Stop

Run:

```bash
npm run check
```

If environment blocks full check, run at least:

```bash
npm run typecheck
npm run build
```

Manual smoke:

- open denied terminal;
- debug grant gen;
- open editor;
- paint wall/floor/door;
- spawn monster and item;
- save/load;
- force samosbor;
- verify Net Sphere `N` still opens the old cloud terminal.

Stop after this. Do not turn the editor into a campaign creator in the same pass.

## Risks

| Risk | Countermeasure |
| --- | --- |
| Full-world draw becomes hot-loop expensive | offscreen thumbnail, dirty cells, viewport entity cap |
| Room/quest metadata becomes inconsistent | MVP edits geometry; room editing is later |
| Save explodes by serializing full world | store capped op patches only |
| Samosbor erases edits | replay patches after rebuild |
| Player softlocks by painting self in | reject current-cell solid edits or relocate to nearest passable cell |
| Existing `НЕТ-СФЕРА` breaks | keep world terminals separate from `net_sphere.ts` cloud runtime |
| Agents fight over `main.ts` | one integrator adds tiny hooks; workers own new modules |

## Definition Of Done

MVP is done when a player can find the seed-fixed flesh, use a rare terminal, open the map editor, change the current floor geometry, close the editor, and play in the changed floor. Debug can reproduce every step without random waiting. The feature does not add a dependency, does not serialize full world cells, does not scan the full world every frame, and does not change the existing Net Sphere terminal on `N`.
