# Status_MONSTER_10_NASOSNAYA_MATKA

Date: 2026-05-18
Agent prompt: `MONSTER_10_NASOSNAYA_MATKA`

## Preflight

- Extracted the XML prompt block from `Monster_10.md` with:
  `perl -0ne 'print "$1\n" if /(<AGENT_PROMPT id="MONSTER_10_NASOSNAYA_MATKA">.*?<\/AGENT_PROMPT>)/s' Monster_10.md`
- Read: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source:
  - `src/gen/maintenance/pressure_station.ts`
  - `src/gen/maintenance/water_bridge.ts`
  - `src/gen/maintenance/overflow_sluice.ts`
  - `src/entities/matka.ts`
  - `src/entities/tube_eel.ts`
  - `src/systems/events.ts`

## Baseline Check

`npm run typecheck` before edits exited 0.

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Implementation

- Added `src/gen/maintenance/nasosnaya_matka.ts`.
- Integrated it from `src/gen/maintenance/content_manifest.ts`.
- Added focused coverage in `tests/monster_10_nasosnaya_matka.test.ts`.

## Encounter

- New maintenance boss room id/tag: `nasosnaya_matka`.
- Room name: `Насосная Матка: давление 3/3 клапаны открыты`.
- Layout is local only: dry perimeter, central dry service route, and three readable water lanes.
- Boss core is a named `MonsterKind.MATKA` entity, `Насосная Матка`, with `matkaTimer = Number.POSITIVE_INFINITY` so generic Matka reproduction is not used.
- Active local adds are capped at five: four `TUBE_EEL` and one `POLZUN`.
- Three valve controls are interactable public containers holding `valve_tag`; taking tags publishes valve pressure events.
- Reward locker contains `manometer`, `valve_tag`, `pipe`, `filtered_water`, `ammo_harpoon`, and `ammo_energy`.
- Kira Manometr gives valve and core-kill side quests, with the core kill gated behind the valve quest.
- Runtime events:
  - valve tags publish `player_use_item` with `nasosnaya_matka` valve tags and pressure data;
  - killing the named core after draining publishes `room_produced_items` and adds `drink_water`;
  - killing the named core before draining publishes `room_lacked_resources` pressure-failure context.

## Validation

- `npm run typecheck`: exit 0.
- `npx tsx --test tests/monster_10_nasosnaya_matka.test.ts`: exit 0, 1 test passed.
- `npm run check`: exit 0.
  - `npm run typecheck`: passed.
  - `npm run test:unit`: 102 tests passed.
  - `npm run build`: passed; `dist/index.html` built.

## Notes

- No fluid simulation was added.
- Generic `MATKA` reproduction code was not modified.
- Adds are generated locally and capped.
