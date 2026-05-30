# Samosbor System Contract

> Центральный документ самосбора.
>
> Роль: фиксирует shipped-контракт warning, shelter, active pressure, local rebuild, variants, aftermath and events. Для реализации проверяй `src/systems/samosbor.ts`, `src/systems/samosbor_wave.ts`, `src/data/samosbor_variants.ts`, `src/data/samosbor_director.ts` и `src/systems/samosbor_hooks.ts`.

## Current Shape

Самосбор - не перезагрузка этажа. Это локальное событие на текущем `World`:

1. Система выбирает вариант и предупреждает игрока.
2. HUD/log получают короткую строку expected variant/action.
3. Укрытия, гермы и локальные shelter hooks могут подготовить safe rooms.
4. Active phase давит туманом/светом, seal logic, вариантными эффектами, монстрами и перемещением сущностей.
5. `systems/samosbor_wave.ts` мутирует bounded local field around a random mutable source.
6. После активной фазы свежая локальная геометрия stitched back into the same active floor through the heavy transition gate.
7. Aftermath beats leave events, loot, shortages, rumors, marks or local hazards.
8. The stitched active world becomes the persistent state for that floor key when floor memory captures it.

Current runtime counts:

- variants: 7;
- modifiers: 19;
- aftermath beats: 44;
- director beats: 33.

## Ownership

- `src/data/samosbor_variants.ts`: variant ids, modifier ids, warning lines, durations, shelters, aftermath beat data.
- `src/data/samosbor_director.ts`: bounded warning/active/aftermath director beats.
- `src/systems/samosbor.ts`: timer, warning snapshot, shelter checks, active effects, spawn pressure, aftermath application and debug lines.
- `src/systems/samosbor_wave.ts`: bounded local cell mutation and rebuild field.
- `src/systems/samosbor_hooks.ts`: local shelter extension points.
- `src/gen/*`: generators must preserve protected anchors and provide enough structure for local rebuild stitching.
- `src/systems/events.ts`: public facts for warnings, starts, shelter outcomes, aftermath and rumors.

`main.ts` may orchestrate the system order, but floor-specific samosbor behavior belongs in data, hooks, generators or local content modules.

## Variant Semantics

Player-facing philosophy:

- classic samosbor brings purple fog and monsters;
- Maronary changes identity, actors, items, containers and cell details;
- Veretar removes and leaves white residue/leakage;
- Istotit creates, heals, marks limited shelters and creates social debt.

New variants must not be just a color or damage multiplier. They need at least one readable cue, one tactical decision, one aftermath possibility and one event/rumor/debug path.

## Shelter Contract

Shelter is an actual route decision, not a text-only warning.

Valid shelter sources:

- hermetic/protected rooms already owned by a floor;
- variant-created local shelters;
- hook-provided shelters from `registerSamosborLocalShelter()`;
- route/floor content that marks and preserves protected room ids.

Shelter hooks must be bounded. They may prepare a few rooms, publish facts, and clean up after the event. They must not scan the whole world every frame, allocate per-entity closures or create permanent global state without save/runtime ownership.

## Local Rebuild Contract

The intended shipped path is local splice:

- choose a mutable source point on the current map;
- spread bounded fog/light through reachable volume;
- preserve lifts, apartments, hermowalls, explicitly protected shelter rooms and required anchors;
- record the affected local field;
- regenerate compatible current-route geometry for that field;
- stitch boundary floors/rooms so the player is not sealed by a rebuild;
- prune route cues whose source/target cells were inside the final local rebuild field.

If local wave start fails, the runtime may use a heavier fallback. Docs and tests should treat local splice as the primary contract, not as the only possible implementation path.

Runtime geometry mutations must bump relevant dirty versions through existing helpers or local precedent so render, AI path fields, fog and map caches do not keep stale state.

## A-Life, Floor Memory And Save

Before floor transitions, samosbor rebuilds and saves, live A-Life state is folded back. Killed A-Life NPCs and killed plot NPCs remain dead.

Floor memory treats samosbor as an update to the same floor key:

- active `World` is mutated/stiched in place from the memory system's perspective;
- stale parked copy for the same key is dropped if it exists;
- the post-samosbor active world is what gets captured when the player leaves;
- packed save floor memory can restore the rebuilt geometry/entities when it fits the budget.

Samosbor persistent state must use the current save payload/runtime patterns. If a persistent shape changes incompatibly, bump `SAVE_SHAPE_VERSION` and reject stale saves explicitly.

## Events And Player Feedback

Every major public fact should use `publishEvent()`:

- warning/prewarning;
- active start;
- shelter success/failure;
- monster or hazard pressure;
- local rebuild/end;
- aftermath.

The HUD should stay short. Detailed variant lore belongs in logs, rumors, NPC barks, documents or aftermath traces, not in a large blocking prewarning panel.

## Adding New Samosbor Content

Preferred addition shape:

1. Add a data definition or hook with a lowercase snake_case id.
2. Keep runtime cadence/radius/cap explicit.
3. Provide player-facing cue and counterplay.
4. Publish compact events.
5. Preserve route/floor protected content.
6. Add or update a focused test when registry count, save shape, local rebuild or hook behavior changes.
7. Update `README.md` only after the behavior is shipped and verified.

Do not add content-specific branches in `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI just to support one samosbor idea.
