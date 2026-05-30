# Geometry Program Modular Work Queue

Status: technical task packet index, 2026-05-29. These files are implementation briefs for future GPT-5.5 coding agents. They are not shipped behavior.

This folder is intentionally modular. Each floor, procedural profile, majority profile, anomaly and candidate has its own `.md`, so one agent can take one file without owning a broad category.

Integration audit, 2026-05-30: the parallel Geometry Program pass has been reconciled against source. Unique packet coverage now matches shipped registries: 6 story anchors, 8 shared packets, 41 routed authored design floors, 10 procedural geometry profiles, 5 majority profiles and 20 procedural anomalies. The `sandpile_perekrytie` candidate is implemented as a procedural anomaly, not a routed design floor. The current route has 54 procedural/fallback floors. Validation passed with `npm run typecheck`, `npm run test:unit`, `npm run test:generation`, `npm run content:audit`, `npm run check` and `npm run smoke`.

Source basis:

- `../../floors.md`
- `README.md`
- `architecture.md`
- `Docs/DesignFloors/floor_contract.md`
- `Docs/ProceduralFloors/geometry.md`
- `Docs/ProceduralFloors/anomaly.md`
- current `src/data/design_floors.ts`
- current `src/data/procedural_floors.ts`
- current `src/gen/` generator layout

Global rules:

- Do not add a new `FloorLevel`.
- Do not put content-specific logic in `main.ts`, `core/world.ts`, broad AI or `render/webgl.ts`.
- Existing floors must be improved only when the change is an obvious net improvement: reachability, route clarity, stronger identity, safer placement, better debug/test coverage or reduced duplication.
- Geometry is generation-time unless a bounded runtime anomaly explicitly owns sparse state, cadence, radius, dirty flags and save behavior.
- Protect lifts, route anchors, hermetic walls, `aptMask`, containers, controls and room ownership.
- No ordinary NPC refill.
- Russian player-facing text remains canonical.

## Required Shared Reads

- [floor_001_shared_agent_contract.md](shared/floor_001_shared_agent_contract.md)
- [floor_002_shared_route_registration.md](shared/floor_002_shared_route_registration.md)
- [floor_003_shared_validation_matrix.md](shared/floor_003_shared_validation_matrix.md)

Use these as needed:

- [floor_004_shared_geometry_metrics.md](shared/floor_004_shared_geometry_metrics.md)
- [floor_005_shared_proxy_grid.md](shared/floor_005_shared_proxy_grid.md)
- [floor_006_shared_maze_graph.md](shared/floor_006_shared_maze_graph.md)
- [floor_007_shared_decision_triangles.md](shared/floor_007_shared_decision_triangles.md)
- [floor_008_shared_runtime_topology.md](shared/floor_008_shared_runtime_topology.md)

## Story Floors

- [floor_009_story_living.md](floors/floor_009_story_living.md)
- [floor_010_story_kvartiry.md](floors/floor_010_story_kvartiry.md)
- [floor_011_story_ministry.md](floors/floor_011_story_ministry.md)
- [floor_012_story_maintenance.md](floors/floor_012_story_maintenance.md)
- [floor_013_story_hell.md](floors/floor_013_story_hell.md)
- [floor_014_story_void.md](floors/floor_014_story_void.md)

## Shipped Design Floors

- [floor_015_design_roof.md](floors/floor_015_design_roof.md)
- [floor_016_design_chthonic_attic.md](floors/floor_016_design_chthonic_attic.md)
- [floor_017_design_antenna_court.md](floors/floor_017_design_antenna_court.md)
- [floor_018_design_pioneer_camp.md](floors/floor_018_design_pioneer_camp.md)
- [floor_019_design_upper_bureau.md](floors/floor_019_design_upper_bureau.md)
- [floor_020_design_bank_floor.md](floors/floor_020_design_bank_floor.md)
- [floor_021_design_raionsovet_archive.md](floors/floor_021_design_raionsovet_archive.md)
- [floor_022_design_registry_morgue.md](floors/floor_022_design_registry_morgue.md)
- [floor_023_design_slime_nii.md](floors/floor_023_design_slime_nii.md)
- [floor_024_design_manhattan_crossroads.md](floors/floor_024_design_manhattan_crossroads.md)
- [floor_025_design_communal_ring.md](floors/floor_025_design_communal_ring.md)
- [floor_026_design_floor_69.md](floors/floor_026_design_floor_69.md)
- [floor_027_design_black_market_88.md](floors/floor_027_design_black_market_88.md)
- [floor_028_design_production_belt.md](floors/floor_028_design_production_belt.md)
- [floor_029_design_service_floor.md](floors/floor_029_design_service_floor.md)
- [floor_030_design_silicon_net_well.md](floors/floor_030_design_silicon_net_well.md)
- [floor_031_design_dark_metro.md](floors/floor_031_design_dark_metro.md)
- [floor_032_design_underhell.md](floors/floor_032_design_underhell.md)
- [floor_033_design_podad.md](floors/floor_033_design_podad.md)
- [floor_034_design_darkness.md](floors/floor_034_design_darkness.md)

## Procedural Geometry Profiles

- [floor_035_geometry_living_blocks.md](procedural_geometry/floor_035_geometry_living_blocks.md)
- [floor_036_geometry_apartment_pressure.md](procedural_geometry/floor_036_geometry_apartment_pressure.md)
- [floor_037_geometry_communal_knots.md](procedural_geometry/floor_037_geometry_communal_knots.md)
- [floor_038_geometry_attic_weatherworks.md](procedural_geometry/floor_038_geometry_attic_weatherworks.md)
- [floor_039_geometry_archive_warrens.md](procedural_geometry/floor_039_geometry_archive_warrens.md)
- [floor_040_geometry_collectors.md](procedural_geometry/floor_040_geometry_collectors.md)
- [floor_041_geometry_workshops.md](procedural_geometry/floor_041_geometry_workshops.md)
- [floor_042_geometry_sump_causeways.md](procedural_geometry/floor_042_geometry_sump_causeways.md)
- [floor_043_geometry_admin_pockets.md](procedural_geometry/floor_043_geometry_admin_pockets.md)
- [floor_044_geometry_service_spines.md](procedural_geometry/floor_044_geometry_service_spines.md)

## Majority Profiles

- [floor_045_majority_citizens.md](majorities/floor_045_majority_citizens.md)
- [floor_046_majority_liquidators.md](majorities/floor_046_majority_liquidators.md)
- [floor_047_majority_wild.md](majorities/floor_047_majority_wild.md)
- [floor_048_majority_scientists.md](majorities/floor_048_majority_scientists.md)
- [floor_049_majority_cultists.md](majorities/floor_049_majority_cultists.md)

## Anomalies

- [floor_050_anomaly_none.md](anomalies/floor_050_anomaly_none.md)
- [floor_051_anomaly_smog.md](anomalies/floor_051_anomaly_smog.md)
- [floor_052_anomaly_teleport_cells.md](anomalies/floor_052_anomaly_teleport_cells.md)
- [floor_053_anomaly_mushroom_mycelium.md](anomalies/floor_053_anomaly_mushroom_mycelium.md)
- [floor_054_anomaly_hladon.md](anomalies/floor_054_anomaly_hladon.md)
- [floor_055_anomaly_false_safe_block.md](anomalies/floor_055_anomaly_false_safe_block.md)
- [floor_056_anomaly_mirror_run.md](anomalies/floor_056_anomaly_mirror_run.md)
- [floor_057_anomaly_radio_chess.md](anomalies/floor_057_anomaly_radio_chess.md)
- [floor_058_anomaly_conveyor_sorter.md](anomalies/floor_058_anomaly_conveyor_sorter.md)
- [floor_059_anomaly_fractal_floor.md](anomalies/floor_059_anomaly_fractal_floor.md)
- [floor_060_anomaly_cement_memory.md](anomalies/floor_060_anomaly_cement_memory.md)
- [floor_061_anomaly_wall_snake.md](anomalies/floor_061_anomaly_wall_snake.md)
- [floor_062_anomaly_living_tunnels.md](anomalies/floor_062_anomaly_living_tunnels.md)
- [floor_063_anomaly_rail_trains.md](anomalies/floor_063_anomaly_rail_trains.md)
- [floor_064_anomaly_bad_apple_world.md](anomalies/floor_064_anomaly_bad_apple_world.md)
- [floor_065_anomaly_zombie_apocalypse.md](anomalies/floor_065_anomaly_zombie_apocalypse.md)
- [floor_066_anomaly_section_shift.md](anomalies/floor_066_anomaly_section_shift.md)
- [floor_067_anomaly_conway_life.md](anomalies/floor_067_anomaly_conway_life.md)
- [floor_068_anomaly_samosbor_seed.md](anomalies/floor_068_anomaly_samosbor_seed.md)

## New Candidates

Required first-wave candidates:

- [floor_069_candidate_istinniy_labirint.md](candidates/floor_069_candidate_istinniy_labirint.md)
- [floor_070_candidate_bolnichny_korpus.md](candidates/floor_070_candidate_bolnichny_korpus.md)
- [floor_071_candidate_shahta_atrium.md](candidates/floor_071_candidate_shahta_atrium.md)
- [floor_072_candidate_moebius_podezd.md](candidates/floor_072_candidate_moebius_podezd.md)
- [floor_073_candidate_sandpile_perekrytie.md](candidates/floor_073_candidate_sandpile_perekrytie.md)

Other candidates:

- [floor_074_candidate_radon_exchange.md](candidates/floor_074_candidate_radon_exchange.md)
- [floor_075_candidate_voronoi_quarantine.md](candidates/floor_075_candidate_voronoi_quarantine.md)
- [floor_076_candidate_hilbert_depot.md](candidates/floor_076_candidate_hilbert_depot.md)
- [floor_077_candidate_harmonic_bathhouse.md](candidates/floor_077_candidate_harmonic_bathhouse.md)
- [floor_078_candidate_turing_nursery.md](candidates/floor_078_candidate_turing_nursery.md)
- [floor_079_candidate_hyperbolic_switchyard.md](candidates/floor_079_candidate_hyperbolic_switchyard.md)
- [floor_080_candidate_critical_leak_archive.md](candidates/floor_080_candidate_critical_leak_archive.md)
- [floor_081_candidate_penrose_laundry.md](candidates/floor_081_candidate_penrose_laundry.md)
- [floor_082_candidate_markov_stairwell.md](candidates/floor_082_candidate_markov_stairwell.md)
- [floor_083_candidate_number_registry.md](candidates/floor_083_candidate_number_registry.md)
- [floor_084_candidate_spetspriemnik.md](candidates/floor_084_candidate_spetspriemnik.md)
- [floor_085_candidate_oranzhereya_betona.md](candidates/floor_085_candidate_oranzhereya_betona.md)
- [floor_086_candidate_obschezhitie_smeny.md](candidates/floor_086_candidate_obschezhitie_smeny.md)
- [floor_087_candidate_cantor_pustoty.md](candidates/floor_087_candidate_cantor_pustoty.md)
- [floor_088_candidate_attractor_dvor.md](candidates/floor_088_candidate_attractor_dvor.md)
- [floor_089_candidate_spectral_chasovnya.md](candidates/floor_089_candidate_spectral_chasovnya.md)
- [floor_090_candidate_cayley_byuro.md](candidates/floor_090_candidate_cayley_byuro.md)

## Orchestration

Use [floor_091_orchestrator.md](floor_091_orchestrator.md) after parallel agents finish. It owns merge order, cross-file consistency checks and validation gates.
