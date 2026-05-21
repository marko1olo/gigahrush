# Design Floor: Антенный двор

Status: implemented authored route floor. Route id: `antenna_court`. Anchor: `z=+42`. Base floor: `MINISTRY`. Shipped HUD name: `Антенный двор`.

Owned file: `src/gen/design_floors/antenna_court.ts`. Route integration: `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/design_floors/full_floor.ts`.

## Role

An indoor courtyard of antennas, cables, radio booths and false horizon murals. This floor listens to other floors and broadcasts route clues back as rumors, quest rewards and lootable papers.

Primary decisions: tune, repair, jam, record, expose, steal batteries, hide from patrols.

## Generation

- Central `Антенный двор` POI with antenna masts, radio club, relay booth, monitoring archive, battery closet, operator dorm, jammer cabin, inspection post and up/down route lifts.
- Full-floor expansion carves eight repeater sectors, fenced cable rings, maintenance cabins, weather screens and bypass cable paths around the authored POI.
- Signal screens use existing procedural screen textures; there is no DOM UI or live radio simulation.

## NPCs

- `antenna_pasha_grown`: radio operator; gives tune and signal repair tasks.
- `antenna_mirra_jammer`: jammer contact; trades a bounded Market 88 jam for fuses.
- `antenna_captain_krug`: Ministry signal inspector; pays for battery handoff or signal exposure paperwork.
- `antenna_echo_zhenya`: echo NPC; points toward impossible recordings.

## Route Decisions

- `antenna_repair_signal`: bring `circuit_board` from the relay repair stock and receive `radio` plus `relay_diagram`; repair improves the signal path through `repairAntennaCourtSignal()`.
- `antenna_expose_signal_log`: bring `record_exposure_notice` to Captain Krug and receive `official_permit_slip`; `exposeAntennaCourtSignal()` marks the Ministry-noticed/exposed flags and `publishAntennaCourtSignalEvent(..., 'expose')` emits a witnessed `rumor_observed`.
- `antenna_jam_raid`: bring two `fuse` to Mirra; `jamAntennaCourtSignal()` lowers signal quality by one, sets `jamUntilHour` and marks Market 88 jam plus Ministry notice.
- `antenna_record_void`: recover `bottled_voice` from the locked archive and decide whether the impossible signal becomes science loot, market value or a Ministry exposure.
- `antenna_battery_theft`: take `ammo_energy` from the owner-guarded battery cabinet or deliver it through Krug's quest for a legal permit.

## Containers And Events

- `Батарейный шкаф антенн`: owner container with `ammo_energy`, `fuse`, `wire_coil`; theft uses existing `item_stolen` container events and witness/audit caps.
- `Шкаф ремонта верхней мачты`: room container with `circuit_board`, `fuse`, `wire_coil` for the repair route.
- `Сейф экспозиции сигнала`: faction safe with `record_exposure_notice`, `official_permit_slip`, `denunciation` for the expose route.
- `Архив записанных частот`: locked filing cabinet with `bottled_voice` and exposure paperwork.
- Signal helper events use `rumor_observed` tags: `antenna_tune`, `antenna_repair`, `antenna_jam`, `antenna_record`, `antenna_expose`, route id tags and compact signal state.

## Samosbor

The floor does not add a separate samosbor system. Its authored rooms, doors, containers and route expansion survive normal floor generation/rebuild because all state is generated from `generateAntennaCourtDesignFloor()` and then expanded by `full_floor.ts`. Container theft and signal publication already enter the shared event/rumor/log systems, so aftermath can reference them without a floor-specific event bus.

## Debug Path

Use the normal lift route to `z=+42` or debug route teleport to `antenna_court`. Spawn starts in `Входной лифтовый тамбур`; walk into `Релейная будка` for repair materials, `Пост сигнал-инспекции` for exposure paperwork, `Кабина глушения` for the Market 88 jam, and `Архив мониторинга` for the void recording.
