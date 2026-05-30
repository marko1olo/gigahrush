# Design Floors Index

Status: historical planning artifact that seeded the authored-floor wave. Current shipped route facts live in `README.md`, `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts` and `src/data/procedural_floors.ts`.

## Purpose

This folder turns the requested large floor wave into implementable slices for separate GPT-5.5 agents. Many `.md` files are historical floor briefs with intended TS ownership, gameplay role, NPC/quest surface, cross-floor hooks and Definition of Done. Shipped route ids and z anchors are listed below and remain subordinate to source.

The current game has 6 coded base floors, 41 routed authored design floors from `src/data/design_floors.ts` and 54 procedural/fallback route floors. This folder preserves original agent briefs; treat planning sections below each doc as historical when they conflict with `README.md` or shipped route data.

## Current Shipped Vertical Route

Down decreases `z`; up increases `z`. Design-floor rows mirror `src/data/design_floors.ts`. Story-anchor rows mirror `src/data/procedural_floors.ts` and are not design-floor route ids. Procedural floors fill every unlisted z in `-50..+50`, including empty even slots reserved for future authored/story floors.

| z | Kind | Route/anchor id | Display name | Base floor | Doc |
| ---: | --- | --- | --- | --- | --- |
| 50 | design | `roof` | Крыша | `MINISTRY` | [roof.md](roof.md) |
| 46 | design | `chthonic_attic` | Чердак техслужб | `MINISTRY` | [chthonic_attic.md](chthonic_attic.md) |
| 44 | design | `radon_exchange` | Радоновый обменник | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_074_candidate_radon_exchange.md) |
| 42 | design | `antenna_court` | Антенный двор | `MINISTRY` | [antenna_court.md](antenna_court.md) |
| 40 | design | `spetspriemnik` | Спецприёмник | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_084_candidate_spetspriemnik.md) |
| 38 | design | `pioneer_camp` | Пионерлагерь | `LIVING` | [pioneer_camp.md](pioneer_camp.md) |
| 36 | design | `cayley_byuro` | Бюро Кэли | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_090_candidate_cayley_byuro.md) |
| 34 | design | `upper_bureau` | Верхнее бюро | `MINISTRY` | [upper_bureau.md](upper_bureau.md) |
| 32 | design | `number_registry` | Числовой реестр | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_083_candidate_number_registry.md) |
| 30 | story | `FloorLevel.MINISTRY` | Министерство | `MINISTRY` | [ministry.md](ministry.md) |
| 28 | design | `istinniy_labirint` | Истинный лабиринт | `MINISTRY` | - |
| 26 | design | `bank_floor` | Банковский этаж | `MINISTRY` | [bank_floor.md](bank_floor.md) |
| 24 | design | `critical_leak_archive` | Архив критической протечки | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_080_candidate_critical_leak_archive.md) |
| 22 | design | `raionsovet_archive` | Райсовет и архив картотек | `MINISTRY` | [raionsovet_archive.md](raionsovet_archive.md) |
| 20 | design | `markov_stairwell` | Марковская лестница | `MINISTRY` | [candidate](../GeometryProgram/candidates/floor_082_candidate_markov_stairwell.md) |
| 18 | design | `registry_morgue` | Морг регистраций | `MINISTRY` | [registry_morgue.md](registry_morgue.md) |
| 16 | design | `bolnichny_korpus` | Больничный корпус | `KVARTIRY` | [candidate](../GeometryProgram/candidates/floor_070_candidate_bolnichny_korpus.md) |
| 14 | story | `FloorLevel.KVARTIRY` | Квартиры | `KVARTIRY` | [kvartiry.md](kvartiry.md) |
| 12 | design | `slime_nii` | НИИ слизи | `KVARTIRY` | [rework_floor_20_slime_nii.md](rework_floor_20_slime_nii.md) |
| 10 | design | `turing_nursery` | Ясли Тьюринга | `KVARTIRY` | [candidate](../GeometryProgram/candidates/floor_078_candidate_turing_nursery.md) |
| 8 | design | `manhattan_crossroads` | Перекрестки | `KVARTIRY` | [manhattan_crossroads.md](manhattan_crossroads.md) |
| 6 | design | `voronoi_quarantine` | Вороной-карантин | `KVARTIRY` | [candidate](../GeometryProgram/candidates/floor_075_candidate_voronoi_quarantine.md) |
| 4 | design | `communal_ring` | Коммунальное кольцо | `KVARTIRY` | [communal_ring.md](communal_ring.md) |
| 2 | design | `moebius_podezd` | Мёбиус-подъезд | `KVARTIRY` | [moebius_podezd.md](moebius_podezd.md) |
| 0 | story | `FloorLevel.LIVING` | Жилая зона | `LIVING` | [living.md](living.md) |
| -2 | design | `oranzhereya_betona` | Оранжерея бетона | `LIVING` | [candidate](../GeometryProgram/candidates/floor_085_candidate_oranzhereya_betona.md) |
| -4 | design | `floor_69` | Этаж 69 | `MAINTENANCE` | [floor_026_design_floor_69.md](../GeometryProgram/floors/floor_026_design_floor_69.md) |
| -6 | design | `obschezhitie_smeny` | Общежитие смены | `LIVING` | [candidate](../GeometryProgram/candidates/floor_086_candidate_obschezhitie_smeny.md) |
| -10 | design | `black_market_88` | Черный рынок 88 | `LIVING` | [floor_027_design_black_market_88.md](../GeometryProgram/floors/floor_027_design_black_market_88.md) |
| -14 | design | `production_belt` | Производственный пояс | `MAINTENANCE` | [production_belt.md](production_belt.md) |
| -18 | design | `service_floor` | Служебный этаж | `MAINTENANCE` | [service_floor.md](service_floor.md) |
| -20 | design | `hyperbolic_switchyard` | Гиперболическая стрелочная | `MAINTENANCE` | [candidate](../GeometryProgram/candidates/floor_079_candidate_hyperbolic_switchyard.md) |
| -22 | design | `silicon_net_well` | Кремниевый НЕТ-колодец | `MAINTENANCE` | [silicon_net_well.md](silicon_net_well.md) |
| -24 | design | `shahta_atrium` | Шахта-атриум | `MAINTENANCE` | [candidate](../GeometryProgram/candidates/floor_071_candidate_shahta_atrium.md) |
| -26 | story | `FloorLevel.MAINTENANCE` | Коллекторы | `MAINTENANCE` | [collectors.md](collectors.md) |
| -28 | design | `harmonic_bathhouse` | Гармоническая баня | `MAINTENANCE` | [candidate](../GeometryProgram/candidates/floor_077_candidate_harmonic_bathhouse.md) |
| -30 | design | `hilbert_depot` | Склад Гильберта | `MAINTENANCE` | [candidate](../GeometryProgram/candidates/floor_076_candidate_hilbert_depot.md) |
| -32 | design | `dark_metro` | Темная пересадка | `MAINTENANCE` | [dark_metro.md](dark_metro.md) |
| -34 | design | `attractor_dvor` | Аттракторный двор | `MAINTENANCE` | [candidate](../GeometryProgram/candidates/floor_088_candidate_attractor_dvor.md) |
| -36 | story | `FloorLevel.HELL` | Мясной низ | `HELL` | [hell.md](hell.md) |
| -38 | design | `underhell` | Нижний пропускник | `HELL` | [underhell.md](underhell.md) |
| -40 | design | `podad` | Подад | `HELL` | [podad.md](podad.md) |
| -42 | design | `spectral_chasovnya` | Спектральная часовня | `HELL` | [spectral_chasovnya.md](spectral_chasovnya.md) |
| -44 | design | `cantor_pustoty` | Кантор пустоты | `VOID` | [candidate](../GeometryProgram/candidates/floor_087_candidate_cantor_pustoty.md) |
| -48 | design | `darkness` | Темный отсек | `VOID` | [darkness.md](darkness.md) |
| -50 | story | `FloorLevel.VOID` | Пустота | `VOID` | [void.md](void.md) |

Historical differences now called out explicitly: the original plan assumed a shorter `z=-44..40` route with authored stops every four z-levels. Shipped route data now spans `z=-50..+50`, keeps `LIVING` at `z=0`, reserves even z-slots for future authored/story floors, and uses procedural fallback for every unoccupied slot.

## Historical Proposed Authored Floor

The population rework batch proposed one manual floor brief that is now shipped in the route:

| z | Route id | Display name | Role | Doc |
| ---: | --- | --- | --- | --- |
| 12 | `slime_nii` | НИИ слизи | Biological lab/quarantine bridge between `KVARTIRY` and `manhattan_crossroads` | [rework_floor_20_slime_nii.md](rework_floor_20_slime_nii.md) |

Keep this note only to explain why the shipped route table links to a `rework_floor_*` brief instead of a non-rework `slime_nii.md` file.

## Cross-Floor Spine

- Ministry and Raionsovet own documents that open roads, markets, factories and medical/morgue records.
- Manhattan Crossroads is the physical route fantasy: block grid, roads, crossings, ambushes, traffic-like flow, contracts that cross several entrances.
- Floor 69 and Market 88 share vice/debt/blackmail state, but Floor 69 must stay non-graphic and adult-only.
- Production feeds Market 88, Living scarcity, Ministry quotas and Collector repair parts.
- Service Floor and Collectors control lifts, pressure and water consequences for all lower floors.
- Hell, Underhell, Podad, Darkness and Void form the late descent: combat, lower threshold, moving meat topology, light failure and protocol. `hell` and `void` are story anchors, not design-floor route ids.
- Roof, Antenna Court and Chthonic Attic make the upward route useful: sky, signal, weather, dangerous shortcuts and false safety.

## Agent Use

Each agent touching shipped floor code should read:

1. `README.md`
2. `architecture.md`
3. `Docs/DesignFloors/floor_contract.md`
4. its own floor doc
5. nearest existing source reference under `src/gen/`

Parallel implementation prompts from the completed floor waves are now historical context in `../../appendix.md`; original prompt files are archived under `../../gatbage/Docs/DesignFloors/AgentPrompts/`. Do not recreate this prompt folder unless a new explicit orchestration batch needs it. New floor work should start from this index, the relevant floor doc, `floor_contract.md`, README, architecture and current source.

Do not update `README.md` until a floor is actually implemented and validated.

## 2026 Population Rework Batch

This completed rework batch exists as shipped-floor context and as source material for future audits. It fixed sparse routed design floors while preserving each floor's identity. Start future work with [floor_contract.md](floor_contract.md), then use these files as the historical brief for the matching route id:

| Task | Route id | Doc |
| ---: | --- | --- |
| 01 | `roof` | [rework_floor_01_roof.md](rework_floor_01_roof.md) |
| 02 | `chthonic_attic` | [rework_floor_02_chthonic_attic.md](rework_floor_02_chthonic_attic.md) |
| 03 | `antenna_court` | [rework_floor_03_antenna_court.md](rework_floor_03_antenna_court.md) |
| 04 | `pioneer_camp` | [rework_floor_04_pioneer_camp.md](rework_floor_04_pioneer_camp.md) |
| 05 | `upper_bureau` | [rework_floor_05_upper_bureau.md](rework_floor_05_upper_bureau.md) |
| 06 | `bank_floor` | [rework_floor_06_bank_floor.md](rework_floor_06_bank_floor.md) |
| 07 | `raionsovet_archive` | [rework_floor_07_raionsovet_archive.md](rework_floor_07_raionsovet_archive.md) |
| 08 | `registry_morgue` | [rework_floor_08_registry_morgue.md](rework_floor_08_registry_morgue.md) |
| 09 | `manhattan_crossroads` | [rework_floor_09_manhattan_crossroads.md](rework_floor_09_manhattan_crossroads.md) |
| 10 | `communal_ring` | [rework_floor_10_communal_ring.md](rework_floor_10_communal_ring.md) |
| 11 | `floor_69` | [floor_026_design_floor_69.md](../GeometryProgram/floors/floor_026_design_floor_69.md) |
| 12 | `black_market_88` | [floor_027_design_black_market_88.md](../GeometryProgram/floors/floor_027_design_black_market_88.md) |
| 13 | `production_belt` | [rework_floor_13_production_belt.md](rework_floor_13_production_belt.md) |
| 14 | `service_floor` | [rework_floor_14_service_floor.md](rework_floor_14_service_floor.md) |
| 15 | `silicon_net_well` | [rework_floor_15_silicon_net_well.md](rework_floor_15_silicon_net_well.md) |
| 16 | `dark_metro` | [rework_floor_16_dark_metro.md](rework_floor_16_dark_metro.md) |
| 17 | `underhell` | [rework_floor_17_underhell.md](rework_floor_17_underhell.md) |
| 18 | `podad` | [rework_floor_18_podad.md](rework_floor_18_podad.md) |
| 19 | `darkness` | [rework_floor_19_darkness.md](rework_floor_19_darkness.md) |
| 20 | `slime_nii` | [rework_floor_20_slime_nii.md](rework_floor_20_slime_nii.md) |

The parallel implementation pass has landed; use [rework_orchectrator.md](rework_orchectrator.md) only as historical integration context unless a new audit explicitly reopens it.
