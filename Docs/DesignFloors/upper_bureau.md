# Design Floor: Верхнее бюро

Status: implemented authored route floor. Route id: `upper_bureau`. Anchor: `z=+34`. Base floor: `MINISTRY`. Shipped HUD name: `Верхнее бюро`.

Owned file: `src/gen/design_floors/upper_bureau.ts`. Route integration: `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/design_floors/full_floor.ts`.

## Role

The floor above the Ministry proper: cleaner, richer, quieter and more dangerous socially. It is where approvals are pre-decided before the official queue sees them. Combat is possible but costly; stealth, forged documents, tolls and blackmail are stronger.

Primary decisions: bribe, forge, expose, steal access, pass inspection, erase a name, pay or rob the archive toll.

## Generation

- Central POI: salon, executive office, zero file room, audit office, cleaner closet, staff desk, political shelter, archive toll office, permit ambush room and up/down route lifts.
- Full-floor expansion adds public queue tiers, private office tiers, archive balconies and service routes around the authored POI.
- Administrative zones are generated and retuned to `MINISTRY` base floor; no new `FloorLevel` value is added.

## NPCs

- `bureau_madam_iskra`: senior secretary and appointment gatekeeper.
- `bureau_auditor_lev`: audits false papers and Market 88 licenses.
- `bureau_cleaner_tolik`: service worker with real keys and staff route papers.
- `bureau_visitor_anna`: citizen trying to erase or expose a death record.
- `bureau_archive_toll_keeper`: sells archive access for money or accepts an exposure act.
- `bureau_permit_ambush_guard`: handles the forged-permit ambush and rewards clean exposure.

## Route Decisions

- Legal preapproval: give `official_permit_slip` to Iskra or recover it from the route to pass the appointment gate quietly.
- Staff route: help Tolik with `cleaning_kit` or steal his owner container for `key` and `elevator_access_order`.
- Permit ambush: `Засада поддельных корешков` contains a LIQUIDATOR guard, a second armed NPC, a `forged_permit_slip` drop and a faction filing cabinet tagged `permit_ambush`, `exposure`, `audit`, `theft`.
- Archive toll: `Платный архивный проход` gives `bureau_archive_toll_pay`, a `money`-based quest for `archive_access_permit` plus `elevator_access_order`; its owner cashbox can also be robbed.
- Record route: Anna still offers `bureau_erase_name_file` and `bureau_expose_erased_record`, using `missing_record_file`, `record_exposure_notice`, `passport_stub` and `archive_access_permit`.

## Containers And Events

- `Сейф предварительных назначений`: locked appointment safe with permit/pass/order papers.
- `Нулевая картотека`: faction filing cabinet with missing record and exposure papers.
- `Связка служебных ключей Толика`: owner tool locker for staff route theft.
- `Папка аудита рынка 88`: owner audit cabinet for Market 88 papers.
- `Касса архивной пошлины`: owner cashbox with `archive_access_permit`, `elevator_access_order`, `blank_form`, tagged `archive_toll` and `route_clue`.
- `Папка подставных корешков`: faction filing cabinet with forged permit, exposure notice and denunciation, tagged for ambush/audit/theft.
- `applyUpperBureauFlagChange()` publishes bounded `faction_relation_changed` events with `auditHeat` clamped to `0..3`; container theft/opening uses the existing container event path.

## Samosbor

Upper Bureau still uses the shared samosbor and hermodoor behavior. The political shelter is a hermetic room in the central POI; the new toll and ambush rooms are ordinary authored rooms, so a rebuild regenerates them from the route floor generator rather than persisting ad hoc state.

## Debug Path

Use the normal lift route from `MINISTRY z=+30` upward through procedural `z=+31..+33` to `upper_bureau z=+34`, or debug route teleport to `upper_bureau`. Spawn starts in `Салон ожидания верхнего бюро`; the archive toll is east of the staff corridor and the permit ambush is south of the cleaner/staff route.
