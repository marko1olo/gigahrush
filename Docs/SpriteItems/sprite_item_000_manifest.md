# Sprite Item Manifest

Status: active planning index, not shipped behavior.
Created: 2026-05-26.
Repacked: 2026-05-27.
Source: generated from current `ITEMS` runtime registry.
Total item plans: 431.
Parallel bundle tasks: 50.

## Bundle Counts

Current source has 431 item plans. To keep exactly 50 parallel tasks without dropping any item, bundles are balanced as 31 bundles with 9 items and 19 bundles with 8 items.

## Batch Counts

- `1_weapons_ammo`: 111
- `2_consumables_medicine`: 82
- `3_tools_repair_cleanup`: 49
- `4_documents_access`: 74
- `5_samples_anomalies`: 50
- `6_misc_story_trade`: 65

## Parallel Assignment Rules

- Assign one future worker to one `sprite_item_bundle_NNN.md` file.
- A bundle is a single non-overlapping task and owns every included item section until the orchestrator merges implementation changes.
- Workers must read `README.md`, `architecture.md`, this manifest, `sprite_item_orchestrator.md`, and their bundle file before editing.
- Use GPT-5.5 workers for visual implementation passes when available.
- Avoid multiple workers editing shared render files at once; bundle outputs should be merged by `sprite_item_orchestrator.md`.
- Do not touch PR/KPI campaign docs during this campaign.

## Shared Hotspots

- `src/render/item_sprites.ts`: procedural item visuals.
- `src/render/webgl.ts`: generic item drop texture hook.
- `src/render/stats_ui.ts`, `src/render/container_ui.ts`: icon placement in canvas UI.
- `tests/item-sprites.test.ts`: registry coverage and payload-derived visual id checks.

## Bundle Tasks

| Bundle | File | Source plan range | Items | Batches | item_ids |
| ---: | --- | --- | ---: | --- | --- |
| 1 | [sprite_item_bundle_001.md](sprite_item_bundle_001.md) | 001-009 | 9 | 6_misc_story_trade, 4_documents_access, 1_weapons_ammo, 5_samples_anomalies | `acid_bottle`, `aerosol_paint_maiden`, `agnia_a130`, `ak47`, `alcohol_bottle`, `alkali_powder`, `ammo_12g_chemical`, `ammo_12g_incendiary`, `ammo_12g_slug` |
| 2 | [sprite_item_bundle_002.md](sprite_item_bundle_002.md) | 010-018 | 9 | 1_weapons_ammo | `ammo_762`, `ammo_762tt`, `ammo_9mm`, `ammo_belt`, `ammo_coupon_9mm`, `ammo_coupon_shells`, `ammo_energy`, `ammo_fuel`, `ammo_harpoon` |
| 3 | [sprite_item_bundle_003.md](sprite_item_bundle_003.md) | 019-027 | 9 | 1_weapons_ammo, 2_consumables_medicine | `ammo_issue_order`, `ammo_nagant`, `ammo_nails`, `ammo_rifle_coupon`, `ammo_shells`, `anti_spore_inhaler`, `antibiotic`, `antidep`, `antiemetic` |
| 4 | [sprite_item_bundle_004.md](sprite_item_bundle_004.md) | 028-036 | 9 | 2_consumables_medicine, 4_documents_access, 3_tools_repair_cleanup, 1_weapons_ammo, 6_misc_story_trade | `antifungal_ointment`, `archive_access_permit`, `asbestos_cord`, `ato41_atomic_flamer`, `axe`, `ballot`, `bandage`, `bank_debt_paper`, `barrel_part` |
| 5 | [sprite_item_bundle_005.md](sprite_item_bundle_005.md) | 037-045 | 9 | 1_weapons_ammo, 6_misc_story_trade, 5_samples_anomalies, 3_tools_repair_cleanup, 4_documents_access | `bayonet`, `bfg`, `black_market_shells`, `blank_form`, `bleached_document`, `block_kit`, `blue_glow_sample_open`, `blue_glow_sample_sealed`, `blueprint_t1_folder` |
| 6 | [sprite_item_bundle_006.md](sprite_item_bundle_006.md) | 046-054 | 9 | 4_documents_access, 2_consumables_medicine, 5_samples_anomalies, 6_misc_story_trade | `blueprint_t2_folder`, `blueprint_t3_folder`, `body_bag_roll`, `boiled_slime_residue`, `boiler_water`, `book`, `borrowed_kitchen_key`, `bottle_empty`, `bottled_voice` |
| 7 | [sprite_item_bundle_007.md](sprite_item_bundle_007.md) | 055-063 | 9 | 2_consumables_medicine, 1_weapons_ammo, 6_misc_story_trade | `braga_bucket`, `breach_charge`, `bread`, `brown_slime_cleanup_act`, `brt2_foam_projector`, `burn_gel`, `calm_brew`, `canned`, `caravan_route` |
| 8 | [sprite_item_bundle_008.md](sprite_item_bundle_008.md) | 064-072 | 9 | 6_misc_story_trade, 3_tools_repair_cleanup, 1_weapons_ammo, 5_samples_anomalies | `card_deck`, `cardboard_stack`, `ceramic_shards_pack`, `chain`, `chainsaw`, `chalk`, `chernobog_cell_map`, `chernobog_confiscation_act`, `chernobog_external_cell_index` |
| 9 | [sprite_item_bundle_009.md](sprite_item_bundle_009.md) | 073-081 | 9 | 5_samples_anomalies, 1_weapons_ammo, 6_misc_story_trade, 4_documents_access | `chernobog_liquidator_memo`, `chernobog_redacted_central_note`, `chernobog_witness_correction`, `chest_failsafe_charge`, `child_map`, `chizh3_shotgun`, `cigs`, `circuit_board`, `clean_health_cert` |
| 10 | [sprite_item_bundle_010.md](sprite_item_bundle_010.md) | 082-090 | 9 | 3_tools_repair_cleanup, 4_documents_access, 2_consumables_medicine, 1_weapons_ammo | `cleaning_kit`, `cleanup_order_stub`, `cleanup_tongs`, `cloth_roll`, `concentrate_bonus_coupon`, `concentrate_coupon`, `concrete_breaker_grenade`, `confiscation_tag`, `confiscation_warrant` |
| 11 | [sprite_item_bundle_011.md](sprite_item_bundle_011.md) | 091-099 | 9 | 1_weapons_ammo, 6_misc_story_trade, 4_documents_access, 3_tools_repair_cleanup, 2_consumables_medicine | `conscripts_doublebarrel`, `container_key_label`, `contaminated_gloves`, `contaminated_sample_act`, `contaminated_swab`, `contraband_receipt_blank`, `contraband_shocker_parts`, `corpse_number_tag`, `cotton_wool` |
| 12 | [sprite_item_bundle_012.md](sprite_item_bundle_012.md) | 100-108 | 9 | 5_samples_anomalies, 1_weapons_ammo, 6_misc_story_trade, 4_documents_access | `cracked_sample_jar`, `crowbar`, `cult_supply_list`, `deactivated_residue`, `debt_settlement_receipt`, `decon_completion_stamp`, `decon_fluid`, `denunciation`, `dice_bone` |
| 13 | [sprite_item_bundle_013.md](sprite_item_bundle_013.md) | 109-117 | 9 | 6_misc_story_trade, 3_tools_repair_cleanup, 2_consumables_medicine, 4_documents_access | `diver_route_tag`, `door_kit`, `duct_tape`, `easter_egg`, `electrode_pack`, `elevator_access_order`, `elevator_override_form`, `emergency_roster`, `empty_roks_tank` |
| 14 | [sprite_item_bundle_014.md](sprite_item_bundle_014.md) | 118-126 | 9 | 5_samples_anomalies, 1_weapons_ammo, 2_consumables_medicine, 4_documents_access, 3_tools_repair_cleanup | `empty_sample_jar`, `entrenching_spade`, `eralashnikov_auto`, `experimental_concentrate`, `fake_pass`, `felt_door_pad`, `fibrous_capsule_cut`, `field_radio_battery`, `filter_canister` |
| 15 | [sprite_item_bundle_015.md](sprite_item_bundle_015.md) | 127-135 | 9 | 6_misc_story_trade, 2_consumables_medicine, 1_weapons_ammo, 3_tools_repair_cleanup, 4_documents_access | `filter_layer`, `filter_receipt`, `filtered_water`, `fire_hook`, `flamethrower`, `flashlight`, `foam_grenade_6p10`, `foam_grenade_act`, `fog_detector` |
| 16 | [sprite_item_bundle_016.md](sprite_item_bundle_016.md) | 136-144 | 9 | 4_documents_access, 2_consumables_medicine, 5_samples_anomalies | `forged_bank_debt_paper`, `forged_permit_slip`, `forged_quarantine_clearance`, `forged_raionsovet_pass`, `forged_ration_card`, `forged_shelter_tally`, `forged_stamp_sheet`, `frozen_item_shard`, `frozen_slime_core` |
| 17 | [sprite_item_bundle_017.md](sprite_item_bundle_017.md) | 145-153 | 9 | 4_documents_access, 6_misc_story_trade, 1_weapons_ammo, 5_samples_anomalies, 3_tools_repair_cleanup, 2_consumables_medicine | `fuel_issue_stamp`, `fuse`, `g41_grenade_launcher`, `gas_sample_ampoule`, `gasmask_filter`, `gauss`, `gear`, `glass_ampoule_empty`, `glass_shard` |
| 18 | [sprite_item_bundle_018.md](sprite_item_bundle_018.md) | 154-162 | 9 | 2_consumables_medicine, 6_misc_story_trade, 1_weapons_ammo | `govnyak_bad_batch`, `govnyak_brick`, `govnyak_courier_package`, `govnyak_roll`, `govnyak_sample`, `granit4u_belt_shotgun`, `gravity_beam_emitter`, `green_briquette`, `grenade` |
| 19 | [sprite_item_bundle_019.md](sprite_item_bundle_019.md) | 163-171 | 9 | 2_consumables_medicine, 1_weapons_ammo, 6_misc_story_trade, 4_documents_access | `grey_briquette`, `grn420_gravizhernov`, `gunstock`, `gusl_index_fragment`, `gusl_index_page`, `hammer`, `harpoon_gun`, `hazard_shift_extension`, `heating_element` |
| 20 | [sprite_item_bundle_020.md](sprite_item_bundle_020.md) | 172-180 | 9 | 3_tools_repair_cleanup, 4_documents_access, 2_consumables_medicine, 1_weapons_ammo, 6_misc_story_trade | `hermetic_tape`, `hermo_gasket`, `hermodoor_journal`, `holy_water`, `homemade_9mm`, `homemade_ammo_instruction`, `homemade_pistol`, `idol_chernobog`, `import_toiletpaper` |
| 21 | [sprite_item_bundle_021.md](sprite_item_bundle_021.md) | 181-189 | 9 | 2_consumables_medicine, 6_misc_story_trade, 3_tools_repair_cleanup | `infected_mushroom`, `ink_bottle`, `inspection_mirror`, `instant_coffee`, `iodine`, `ip4_gasmask`, `istotit_candle`, `jackhammer`, `junior_tech_case` |
| 22 | [sprite_item_bundle_022.md](sprite_item_bundle_022.md) | 190-198 | 9 | 1_weapons_ammo, 2_consumables_medicine, 4_documents_access, 3_tools_repair_cleanup | `karkarov_pistol`, `kasha`, `key`, `keyboard_unit`, `knife`, `kompot`, `krona_battery`, `kulich`, `labor_shift_card` |
| 23 | [sprite_item_bundle_023.md](sprite_item_bundle_023.md) | 199-207 | 9 | 6_misc_story_trade, 2_consumables_medicine, 5_samples_anomalies, 1_weapons_ammo, 4_documents_access, 3_tools_repair_cleanup | `lamp_bulb`, `lice_shampoo`, `lift_scheme`, `lime_bucket`, `liquidator_axe`, `liquidator_field_roster`, `liquidator_flashlamp`, `liquidator_issue_card`, `liquidator_rake` |
| 24 | [sprite_item_bundle_024.md](sprite_item_bundle_024.md) | 208-216 | 9 | 2_consumables_medicine, 6_misc_story_trade, 1_weapons_ammo, 3_tools_repair_cleanup, 4_documents_access | `liquidator_ration`, `liquidator_token`, `losyash_rifle`, `machinegun`, `magazine_part`, `mail_intercept_slip`, `makarov`, `manometer`, `market_weight_scale` |
| 25 | [sprite_item_bundle_025.md](sprite_item_bundle_025.md) | 217-225 | 9 | 5_samples_anomalies, 6_misc_story_trade, 1_weapons_ammo, 2_consumables_medicine, 4_documents_access | `maronary_shaving`, `meat_rune`, `metal_chair`, `metal_sheet`, `metal_water`, `metro_ticket`, `ministry_audit_forgery`, `ministry_clean_stamp`, `missing_record_file` |
| 26 | [sprite_item_bundle_026.md](sprite_item_bundle_026.md) | 226-234 | 9 | 2_consumables_medicine, 1_weapons_ammo, 5_samples_anomalies, 6_misc_story_trade | `moonshine_still_part`, `morphine_ampoule`, `moskvin_rifle`, `mushroom_mass`, `mutant_tissue_sample`, `nagant`, `nailgun`, `napalm_mix`, `neighbor_complaint` |
| 27 | [sprite_item_bundle_027.md](sprite_item_bundle_027.md) | 235-243 | 9 | 4_documents_access, 3_tools_repair_cleanup, 1_weapons_ammo | `nii_contraband_manifest`, `nii_forged_audit`, `nii_market_receipt`, `nii_sample_container`, `nii_sample_label`, `noise_can`, `nosin_rifle`, `note`, `o15_multijet_flamer` |
| 28 | [sprite_item_bundle_028.md](sprite_item_bundle_028.md) | 244-252 | 9 | 4_documents_access, 2_consumables_medicine, 5_samples_anomalies, 3_tools_repair_cleanup, 1_weapons_ammo | `official_permit_slip`, `official_quarantine_clearance`, `ovb_search_warrant`, `overexposed_photo`, `ozk_patch`, `p14_gasmask_receipt`, `p41_heavy_mg`, `painkiller_pack`, `part_ticket` |
| 29 | [sprite_item_bundle_029.md](sprite_item_bundle_029.md) | 253-261 | 9 | 1_weapons_ammo, 6_misc_story_trade, 4_documents_access, 2_consumables_medicine | `party_might_launcher`, `party_portrait_pin`, `passport_stub`, `pbrog1_foam_launcher`, `pearl_barley`, `permanent_pass`, `permanganate_vial`, `personal_file_copy`, `pills` |
| 30 | [sprite_item_bundle_030.md](sprite_item_bundle_030.md) | 262-270 | 9 | 1_weapons_ammo, 3_tools_repair_cleanup, 4_documents_access, 2_consumables_medicine | `pipe`, `pistol_grenade_launcher`, `plasma`, `plastic_sheet`, `pneumomail_capsule`, `portable_siren_key`, `post_samosbor_probe_kit`, `ppsh`, `pressed_sugar` |
| 31 | [sprite_item_bundle_031.md](sprite_item_bundle_031.md) | 271-279 | 9 | 6_misc_story_trade, 3_tools_repair_cleanup, 2_consumables_medicine, 1_weapons_ammo, 5_samples_anomalies | `pressure_logbook`, `protective_apron`, `protein_mold_cake`, `psi_beam`, `psi_brainburn`, `psi_concrete_splinter`, `psi_control`, `psi_dust`, `psi_madness` |
| 32 | [sprite_item_bundle_032.md](sprite_item_bundle_032.md) | 280-287 | 8 | 1_weapons_ammo | `psi_mark`, `psi_meat_hook`, `psi_order_seal`, `psi_phase`, `psi_recall`, `psi_rupture`, `psi_shadow_lance`, `psi_siren_pulse` |
| 33 | [sprite_item_bundle_033.md](sprite_item_bundle_033.md) | 288-295 | 8 | 2_consumables_medicine, 1_weapons_ammo, 6_misc_story_trade | `psi_stabilizer`, `psi_storm`, `psi_strike`, `psi_void_needle`, `psychiatrist_referral`, `ptrs_liquidator`, `pump_impeller`, `pump_passport` |
| 34 | [sprite_item_bundle_034.md](sprite_item_bundle_034.md) | 296-303 | 8 | 1_weapons_ammo, 4_documents_access, 2_consumables_medicine, 3_tools_repair_cleanup | `pushkin_shotgun`, `quarantine_breach_notice`, `quarantine_medcard`, `radio`, `radio_headset_liquidator`, `radio_jammer`, `rail_depot_pass`, `rail_signal_lamp` |
| 35 | [sprite_item_bundle_035.md](sprite_item_bundle_035.md) | 304-311 | 8 | 3_tools_repair_cleanup, 4_documents_access, 1_weapons_ammo, 2_consumables_medicine | `rail_spike_pack`, `rail_switch_handle`, `rail_switch_order`, `raionsovet_floor_pass`, `rake_bayonet`, `ration_registry_extract`, `ration_stamp_pad`, `rawmeat` |
| 36 | [sprite_item_bundle_036.md](sprite_item_bundle_036.md) | 312-319 | 8 | 1_weapons_ammo, 6_misc_story_trade, 2_consumables_medicine, 5_samples_anomalies, 4_documents_access | `rb91_auto_shotgun`, `rebar`, `record_exposure_notice`, `red_concentrate`, `red_mold_sample`, `relay_diagram`, `resident_identity_stub`, `resident_trinket_box` |
| 37 | [sprite_item_bundle_037.md](sprite_item_bundle_037.md) | 320-327 | 8 | 1_weapons_ammo, 5_samples_anomalies, 3_tools_repair_cleanup, 6_misc_story_trade | `rifle_bolt_pack`, `rock_salt`, `roks47_flamethrower`, `roller_brush`, `rpl23_lmg`, `rubber_club`, `rubber_door_wedge`, `rubber_strip` |
| 38 | [sprite_item_bundle_038.md](sprite_item_bundle_038.md) | 328-335 | 8 | 2_consumables_medicine, 1_weapons_ammo, 4_documents_access, 6_misc_story_trade, 5_samples_anomalies | `rubber_tube`, `rusty_rake`, `samosbor_alarm_schedule`, `samosbor_tally`, `sample_chain_form`, `sample_cork_seal`, `sand_spoiled_ration`, `sanitary_kit` |
| 39 | [sprite_item_bundle_039.md](sprite_item_bundle_039.md) | 336-343 | 8 | 3_tools_repair_cleanup, 1_weapons_ammo, 4_documents_access, 6_misc_story_trade, 5_samples_anomalies, 2_consumables_medicine | `screen_unit`, `scrubbed_serial_plate`, `scrubbed_weapon_tag`, `seal_wax`, `sealant_tube`, `sealed_complaint`, `sealed_veretar_sand`, `shark_scale` |
| 40 | [sprite_item_bundle_040.md](sprite_item_bundle_040.md) | 344-351 | 8 | 4_documents_access, 1_weapons_ammo, 2_consumables_medicine, 6_misc_story_trade | `shelter_seat_card`, `shelter_seat_forgery`, `shelter_tally`, `shmk_disposable`, `shock_baton`, `shotgun`, `siren_energy`, `siren_instruction` |
| 41 | [sprite_item_bundle_041.md](sprite_item_bundle_041.md) | 352-359 | 8 | 5_samples_anomalies, 1_weapons_ammo, 2_consumables_medicine, 4_documents_access | `siren_shard`, `sledgehammer`, `sleeping_pills`, `slime_age_label_brown`, `slime_age_label_orange`, `slime_age_label_violet`, `slime_calcified_chip`, `slime_motor_node` |
| 42 | [sprite_item_bundle_042.md](sprite_item_bundle_042.md) | 360-367 | 8 | 5_samples_anomalies | `slime_sample_black`, `slime_sample_blue`, `slime_sample_brown`, `slime_sample_contaminated`, `slime_sample_fake`, `slime_sample_green`, `slime_sample_red`, `slime_sample_seroburmaline` |
| 43 | [sprite_item_bundle_043.md](sprite_item_bundle_043.md) | 368-375 | 8 | 5_samples_anomalies, 1_weapons_ammo, 3_tools_repair_cleanup, 6_misc_story_trade | `slime_sample_silver`, `slime_sample_silver_open`, `slime_sample_white`, `slime_scraper`, `slime_sense_node`, `slyoznev_pps41`, `smoke_candle_check`, `soap_72` |
| 44 | [sprite_item_bundle_044.md](sprite_item_bundle_044.md) | 376-383 | 8 | 3_tools_repair_cleanup, 2_consumables_medicine, 6_misc_story_trade, 4_documents_access | `sound_emitter`, `soup_cube`, `spore_print`, `spring`, `sterile_bandage`, `sterile_swab`, `stolen_archive_card`, `stolen_filter_pack` |
| 45 | [sprite_item_bundle_045.md](sprite_item_bundle_045.md) | 384-391 | 8 | 4_documents_access, 6_misc_story_trade, 2_consumables_medicine, 1_weapons_ammo | `stolen_terminal_stamp`, `strange_clot`, `substrate_sack`, `sugar_pack`, `syringe_empty`, `tanev_svt40`, `tea`, `technical_spirit` |
| 46 | [sprite_item_bundle_046.md](sprite_item_bundle_046.md) | 392-399 | 8 | 4_documents_access, 6_misc_story_trade, 2_consumables_medicine, 1_weapons_ammo | `temp_pass`, `terminal_order_receipt`, `toiletpaper`, `tourniquet`, `toz_shotgun`, `track_diagram_scrap`, `tracked_zhernov`, `tt_pistol` |
| 47 | [sprite_item_bundle_047.md](sprite_item_bundle_047.md) | 400-407 | 8 | 3_tools_repair_cleanup, 6_misc_story_trade, 4_documents_access, 5_samples_anomalies | `unpeople_detector`, `unsigned_order`, `used_gasmask_filter`, `uv_spotlight`, `vacuum`, `valve_tag`, `vent_damper_plate`, `veretar_sand` |
| 48 | [sprite_item_bundle_048.md](sprite_item_bundle_048.md) | 408-415 | 8 | 4_documents_access, 5_samples_anomalies, 6_misc_story_trade, 2_consumables_medicine | `void_archive_warrant`, `void_spike`, `voluntary_receipt`, `water`, `water_coupon`, `water_filter_regulator`, `water_reservoir_quota`, `water_reservoir_sample` |
| 49 | [sprite_item_bundle_049.md](sprite_item_bundle_049.md) | 416-423 | 8 | 1_weapons_ammo, 4_documents_access, 3_tools_repair_cleanup, 2_consumables_medicine | `weapon_blueprint_t2`, `weapon_checkout_tag`, `weapon_permit_forged`, `weapon_permit_signed`, `wet_rag_bundle`, `wire_coil`, `wrench`, `yeast_bread` |
| 50 | [sprite_item_bundle_050.md](sprite_item_bundle_050.md) | 424-431 | 8 | 1_weapons_ammo, 6_misc_story_trade, 2_consumables_medicine, 5_samples_anomalies | `zatychkin_pistol`, `zhek_seal`, `zhelemish_boiled`, `zhelemish_dried`, `zhelemish_raw`, `zhelemish_sample_contaminated`, `zhelemish_sample_sealed`, `zinc_slime_bucket` |

## Item Coverage

Each row below is covered by exactly one bundle. The old one-file-per-item plan files were deleted after their content was moved into bundle sections.

| N | Bundle | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | [bundle 001](sprite_item_bundle_001.md) | `acid_bottle` | Кислота | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 2 | [bundle 001](sprite_item_bundle_001.md) | `aerosol_paint_maiden` | Аэрозольная краска «цвет девства» | `MISC` | document | 4_documents_access | src/data/items.ts |
| 3 | [bundle 001](sprite_item_bundle_001.md) | `agnia_a130` | А-130 «Агния» | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 4 | [bundle 001](sprite_item_bundle_001.md) | `ak47` | Калашников | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 5 | [bundle 001](sprite_item_bundle_001.md) | `alcohol_bottle` | Спирт | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 6 | [bundle 001](sprite_item_bundle_001.md) | `alkali_powder` | Щёлочная присыпка | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 7 | [bundle 001](sprite_item_bundle_001.md) | `ammo_12g_chemical` | Химический патрон 12 калибра | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 8 | [bundle 001](sprite_item_bundle_001.md) | `ammo_12g_incendiary` | Зажигательная дробь | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 9 | [bundle 001](sprite_item_bundle_001.md) | `ammo_12g_slug` | Пуля 12 калибра | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 10 | [bundle 002](sprite_item_bundle_002.md) | `ammo_762` | Патроны 7.62 | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 11 | [bundle 002](sprite_item_bundle_002.md) | `ammo_762tt` | Патроны 7.62 ТТ | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 12 | [bundle 002](sprite_item_bundle_002.md) | `ammo_9mm` | Патроны 9мм | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 13 | [bundle 002](sprite_item_bundle_002.md) | `ammo_belt` | Лента 7.62 | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 14 | [bundle 002](sprite_item_bundle_002.md) | `ammo_coupon_9mm` | Талон на 9мм | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 15 | [bundle 002](sprite_item_bundle_002.md) | `ammo_coupon_shells` | Талон на дробь | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 16 | [bundle 002](sprite_item_bundle_002.md) | `ammo_energy` | Энергоячейка | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 17 | [bundle 002](sprite_item_bundle_002.md) | `ammo_fuel` | Канистра бензина | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 18 | [bundle 002](sprite_item_bundle_002.md) | `ammo_harpoon` | Гарпуны | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 19 | [bundle 003](sprite_item_bundle_003.md) | `ammo_issue_order` | Ордер на выдачу патронов | `MISC` | ammo | 1_weapons_ammo | src/data/items.ts |
| 20 | [bundle 003](sprite_item_bundle_003.md) | `ammo_nagant` | Патроны Наган | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 21 | [bundle 003](sprite_item_bundle_003.md) | `ammo_nails` | Гвозди | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 22 | [bundle 003](sprite_item_bundle_003.md) | `ammo_rifle_coupon` | Талон на винтовочные патроны | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 23 | [bundle 003](sprite_item_bundle_003.md) | `ammo_shells` | Дробь | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 24 | [bundle 003](sprite_item_bundle_003.md) | `anti_spore_inhaler` | Противоспоровый ингалятор | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 25 | [bundle 003](sprite_item_bundle_003.md) | `antibiotic` | Антибиотик | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 26 | [bundle 003](sprite_item_bundle_003.md) | `antidep` | Антидепрессант | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 27 | [bundle 003](sprite_item_bundle_003.md) | `antiemetic` | Противорвотное | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 28 | [bundle 004](sprite_item_bundle_004.md) | `antifungal_ointment` | Противогрибковая мазь | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 29 | [bundle 004](sprite_item_bundle_004.md) | `archive_access_permit` | Допуск в архив | `MISC` | document | 4_documents_access | src/data/items.ts |
| 30 | [bundle 004](sprite_item_bundle_004.md) | `asbestos_cord` | Асбестовая верёвка | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 31 | [bundle 004](sprite_item_bundle_004.md) | `ato41_atomic_flamer` | АТО-41 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 32 | [bundle 004](sprite_item_bundle_004.md) | `axe` | Топор | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 33 | [bundle 004](sprite_item_bundle_004.md) | `ballot` | Бюллетень | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 34 | [bundle 004](sprite_item_bundle_004.md) | `bandage` | Бинт | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 35 | [bundle 004](sprite_item_bundle_004.md) | `bank_debt_paper` | Долговая бумага банка | `MISC` | document | 4_documents_access | src/data/items.ts |
| 36 | [bundle 004](sprite_item_bundle_004.md) | `barrel_part` | Заготовка ствола | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 37 | [bundle 005](sprite_item_bundle_005.md) | `bayonet` | Штык | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 38 | [bundle 005](sprite_item_bundle_005.md) | `bfg` | БФГ-9000 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 39 | [bundle 005](sprite_item_bundle_005.md) | `black_market_shells` | Чёрнорыночная дробь | `AMMO` | weapon | 1_weapons_ammo | src/data/items.ts |
| 40 | [bundle 005](sprite_item_bundle_005.md) | `blank_form` | Пустой бланк | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 41 | [bundle 005](sprite_item_bundle_005.md) | `bleached_document` | Выбеленная бумага | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 42 | [bundle 005](sprite_item_bundle_005.md) | `block_kit` | Комплект блока | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 43 | [bundle 005](sprite_item_bundle_005.md) | `blue_glow_sample_open` | Открытый синий образец | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 44 | [bundle 005](sprite_item_bundle_005.md) | `blue_glow_sample_sealed` | Герметичный синий образец | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 45 | [bundle 005](sprite_item_bundle_005.md) | `blueprint_t1_folder` | Папка чертежей Т1 | `MISC` | document | 4_documents_access | src/data/items.ts |
| 46 | [bundle 006](sprite_item_bundle_006.md) | `blueprint_t2_folder` | Папка чертежей Т2 | `MISC` | document | 4_documents_access | src/data/items.ts |
| 47 | [bundle 006](sprite_item_bundle_006.md) | `blueprint_t3_folder` | Папка чертежей Т3 | `MISC` | document | 4_documents_access | src/data/items.ts |
| 48 | [bundle 006](sprite_item_bundle_006.md) | `body_bag_roll` | Рулон мешков для тел | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 49 | [bundle 006](sprite_item_bundle_006.md) | `boiled_slime_residue` | Вываренный остаток слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 50 | [bundle 006](sprite_item_bundle_006.md) | `boiler_water` | Кипяток | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 51 | [bundle 006](sprite_item_bundle_006.md) | `book` | Книга | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 52 | [bundle 006](sprite_item_bundle_006.md) | `borrowed_kitchen_key` | Заёмный кухонный ключ | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 53 | [bundle 006](sprite_item_bundle_006.md) | `bottle_empty` | Бутылка | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 54 | [bundle 006](sprite_item_bundle_006.md) | `bottled_voice` | Голос в банке | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 55 | [bundle 007](sprite_item_bundle_007.md) | `braga_bucket` | Ведро браги | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 56 | [bundle 007](sprite_item_bundle_007.md) | `breach_charge` | Пробивной заряд | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 57 | [bundle 007](sprite_item_bundle_007.md) | `bread` | Хлеб | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 58 | [bundle 007](sprite_item_bundle_007.md) | `brown_slime_cleanup_act` | Акт зачистки коричневой слизи | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 59 | [bundle 007](sprite_item_bundle_007.md) | `brt2_foam_projector` | БРТ-2 бетономёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 60 | [bundle 007](sprite_item_bundle_007.md) | `burn_gel` | Противоожоговый гель | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 61 | [bundle 007](sprite_item_bundle_007.md) | `calm_brew` | Успокоительный отвар | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 62 | [bundle 007](sprite_item_bundle_007.md) | `canned` | Тушёнка | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 63 | [bundle 007](sprite_item_bundle_007.md) | `caravan_route` | Маршрут каравана | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 64 | [bundle 008](sprite_item_bundle_008.md) | `card_deck` | Колода карт | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 65 | [bundle 008](sprite_item_bundle_008.md) | `cardboard_stack` | Картон | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 66 | [bundle 008](sprite_item_bundle_008.md) | `ceramic_shards_pack` | Керамика | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 67 | [bundle 008](sprite_item_bundle_008.md) | `chain` | Цепь | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 68 | [bundle 008](sprite_item_bundle_008.md) | `chainsaw` | Бензопила | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 69 | [bundle 008](sprite_item_bundle_008.md) | `chalk` | Мелок | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 70 | [bundle 008](sprite_item_bundle_008.md) | `chernobog_cell_map` | Схема ячеек ЧБ-0 | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 71 | [bundle 008](sprite_item_bundle_008.md) | `chernobog_confiscation_act` | Акт изъятия черной ладони | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 72 | [bundle 008](sprite_item_bundle_008.md) | `chernobog_external_cell_index` | Индекс внешней ячейки | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 73 | [bundle 009](sprite_item_bundle_009.md) | `chernobog_liquidator_memo` | Памятка ликвидатора ЧБ | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 74 | [bundle 009](sprite_item_bundle_009.md) | `chernobog_redacted_central_note` | Редакция центральной записки | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 75 | [bundle 009](sprite_item_bundle_009.md) | `chernobog_witness_correction` | Правка показаний ЧБ | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 76 | [bundle 009](sprite_item_bundle_009.md) | `chest_failsafe_charge` | Фугасный нагрудный заряд | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 77 | [bundle 009](sprite_item_bundle_009.md) | `child_map` | Карта детей | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 78 | [bundle 009](sprite_item_bundle_009.md) | `chizh3_shotgun` | ЧИЖ-3 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 79 | [bundle 009](sprite_item_bundle_009.md) | `cigs` | Сигареты | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 80 | [bundle 009](sprite_item_bundle_009.md) | `circuit_board` | Микросхема | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 81 | [bundle 009](sprite_item_bundle_009.md) | `clean_health_cert` | Справка об отсутствии заражения | `MISC` | document | 4_documents_access | src/data/items.ts |
| 82 | [bundle 010](sprite_item_bundle_010.md) | `cleaning_kit` | Чистящий комплект | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 83 | [bundle 010](sprite_item_bundle_010.md) | `cleanup_order_stub` | Корешок приказа на зачистку | `MISC` | document | 4_documents_access | src/data/items.ts |
| 84 | [bundle 010](sprite_item_bundle_010.md) | `cleanup_tongs` | Санитарные щипцы | `TOOL` | medicine | 2_consumables_medicine | src/data/items.ts |
| 85 | [bundle 010](sprite_item_bundle_010.md) | `cloth_roll` | Ткань | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 86 | [bundle 010](sprite_item_bundle_010.md) | `concentrate_bonus_coupon` | Премиальный талон концентрата | `MISC` | food | 2_consumables_medicine | src/data/documents_access.ts |
| 87 | [bundle 010](sprite_item_bundle_010.md) | `concentrate_coupon` | Талон на концентрат | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 88 | [bundle 010](sprite_item_bundle_010.md) | `concrete_breaker_grenade` | Бетонобойная граната | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 89 | [bundle 010](sprite_item_bundle_010.md) | `confiscation_tag` | Бирка конфиската | `MISC` | document | 4_documents_access | src/data/items.ts |
| 90 | [bundle 010](sprite_item_bundle_010.md) | `confiscation_warrant` | Ордер на изъятие | `MISC` | document | 4_documents_access | src/data/items.ts |
| 91 | [bundle 011](sprite_item_bundle_011.md) | `conscripts_doublebarrel` | Двустволка срочника | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 92 | [bundle 011](sprite_item_bundle_011.md) | `container_key_label` | Бирка от ключа | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 93 | [bundle 011](sprite_item_bundle_011.md) | `contaminated_gloves` | Загрязнённые перчатки | `MISC` | document | 4_documents_access | src/data/items.ts |
| 94 | [bundle 011](sprite_item_bundle_011.md) | `contaminated_sample_act` | Акт испорченной пробы | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 95 | [bundle 011](sprite_item_bundle_011.md) | `contaminated_swab` | Загрязнённый мазок | `MISC` | document | 4_documents_access | src/data/items.ts |
| 96 | [bundle 011](sprite_item_bundle_011.md) | `contraband_receipt_blank` | Пустая расписка контрабанды | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 97 | [bundle 011](sprite_item_bundle_011.md) | `contraband_shocker_parts` | Детали шокера | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 98 | [bundle 011](sprite_item_bundle_011.md) | `corpse_number_tag` | Номерок трупа | `MISC` | document | 4_documents_access | src/data/items.ts |
| 99 | [bundle 011](sprite_item_bundle_011.md) | `cotton_wool` | Вата | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 100 | [bundle 012](sprite_item_bundle_012.md) | `cracked_sample_jar` | Треснувшая банка для пробы | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 101 | [bundle 012](sprite_item_bundle_012.md) | `crowbar` | Лом | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 102 | [bundle 012](sprite_item_bundle_012.md) | `cult_supply_list` | Кухонный список ячейки | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 103 | [bundle 012](sprite_item_bundle_012.md) | `deactivated_residue` | Гашёный остаток | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 104 | [bundle 012](sprite_item_bundle_012.md) | `debt_settlement_receipt` | Квитанция о погашении | `MISC` | document | 4_documents_access | src/data/items.ts |
| 105 | [bundle 012](sprite_item_bundle_012.md) | `decon_completion_stamp` | Штамп санобработки | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 106 | [bundle 012](sprite_item_bundle_012.md) | `decon_fluid` | Обеззараживающая жидкость | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 107 | [bundle 012](sprite_item_bundle_012.md) | `denunciation` | Донос | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 108 | [bundle 012](sprite_item_bundle_012.md) | `dice_bone` | Игральные кости | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 109 | [bundle 013](sprite_item_bundle_013.md) | `diver_route_tag` | Бирка водолазного маршрута | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 110 | [bundle 013](sprite_item_bundle_013.md) | `door_kit` | Комплект двери | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 111 | [bundle 013](sprite_item_bundle_013.md) | `duct_tape` | Изолента | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 112 | [bundle 013](sprite_item_bundle_013.md) | `easter_egg` | Пасхальное яйцо | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 113 | [bundle 013](sprite_item_bundle_013.md) | `electrode_pack` | Электроды | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 114 | [bundle 013](sprite_item_bundle_013.md) | `elevator_access_order` | Ордер доступа к лифту | `MISC` | document | 4_documents_access | src/data/items.ts |
| 115 | [bundle 013](sprite_item_bundle_013.md) | `elevator_override_form` | Бланк обхода лифта | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 116 | [bundle 013](sprite_item_bundle_013.md) | `emergency_roster` | Список укрытия | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 117 | [bundle 013](sprite_item_bundle_013.md) | `empty_roks_tank` | Пустой ранцевый бак | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 118 | [bundle 014](sprite_item_bundle_014.md) | `empty_sample_jar` | Пустая банка для пробы | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 119 | [bundle 014](sprite_item_bundle_014.md) | `entrenching_spade` | Саперная лопатка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 120 | [bundle 014](sprite_item_bundle_014.md) | `eralashnikov_auto` | Автомат Ералашникова | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 121 | [bundle 014](sprite_item_bundle_014.md) | `experimental_concentrate` | Несерийный концентрат | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 122 | [bundle 014](sprite_item_bundle_014.md) | `fake_pass` | Фальшивый пропуск | `MISC` | document | 4_documents_access | src/data/items.ts |
| 123 | [bundle 014](sprite_item_bundle_014.md) | `felt_door_pad` | Войлочная накладка | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 124 | [bundle 014](sprite_item_bundle_014.md) | `fibrous_capsule_cut` | Срез фиброзной капсулы | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 125 | [bundle 014](sprite_item_bundle_014.md) | `field_radio_battery` | Батарея рации | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 126 | [bundle 014](sprite_item_bundle_014.md) | `filter_canister` | Фильтр-канистра | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 127 | [bundle 015](sprite_item_bundle_015.md) | `filter_layer` | Фильтрующий слой | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 128 | [bundle 015](sprite_item_bundle_015.md) | `filter_receipt` | Квитанция на фильтр | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 129 | [bundle 015](sprite_item_bundle_015.md) | `filtered_water` | Вода фильтрованная | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 130 | [bundle 015](sprite_item_bundle_015.md) | `fire_hook` | Пожарный багор | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 131 | [bundle 015](sprite_item_bundle_015.md) | `flamethrower` | Огнемёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 132 | [bundle 015](sprite_item_bundle_015.md) | `flashlight` | Фонарик | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 133 | [bundle 015](sprite_item_bundle_015.md) | `foam_grenade_6p10` | Пенобетонная граната 6П10 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 134 | [bundle 015](sprite_item_bundle_015.md) | `foam_grenade_act` | Акт выдачи 6П10 | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 135 | [bundle 015](sprite_item_bundle_015.md) | `fog_detector` | Детектор тумана | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 136 | [bundle 016](sprite_item_bundle_016.md) | `forged_bank_debt_paper` | Липовая долговая бумага | `MISC` | document | 4_documents_access | src/data/items.ts |
| 137 | [bundle 016](sprite_item_bundle_016.md) | `forged_permit_slip` | Кованый корешок пропуска | `MISC` | document | 4_documents_access | src/data/items.ts |
| 138 | [bundle 016](sprite_item_bundle_016.md) | `forged_quarantine_clearance` | Липовая карантинная справка | `MISC` | document | 4_documents_access | src/data/items.ts |
| 139 | [bundle 016](sprite_item_bundle_016.md) | `forged_raionsovet_pass` | Липовый пропуск райсовета | `MISC` | document | 4_documents_access | src/data/items.ts |
| 140 | [bundle 016](sprite_item_bundle_016.md) | `forged_ration_card` | Поддельная пайковая карточка | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 141 | [bundle 016](sprite_item_bundle_016.md) | `forged_shelter_tally` | Липовая ведомость укрытых | `MISC` | document | 4_documents_access | src/data/items.ts |
| 142 | [bundle 016](sprite_item_bundle_016.md) | `forged_stamp_sheet` | Лист с поддельной печатью | `MISC` | document | 4_documents_access | src/data/items.ts |
| 143 | [bundle 016](sprite_item_bundle_016.md) | `frozen_item_shard` | Осколок замороженного предмета | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 144 | [bundle 016](sprite_item_bundle_016.md) | `frozen_slime_core` | Замороженное ядро слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 145 | [bundle 017](sprite_item_bundle_017.md) | `fuel_issue_stamp` | Штамп выдачи топлива | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 146 | [bundle 017](sprite_item_bundle_017.md) | `fuse` | Предохранитель | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 147 | [bundle 017](sprite_item_bundle_017.md) | `g41_grenade_launcher` | 5Г41 станковый гранатомёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 148 | [bundle 017](sprite_item_bundle_017.md) | `gas_sample_ampoule` | Ампула газовой пробы | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 149 | [bundle 017](sprite_item_bundle_017.md) | `gasmask_filter` | Фильтр противогаза | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 150 | [bundle 017](sprite_item_bundle_017.md) | `gauss` | Гаусс-винтовка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 151 | [bundle 017](sprite_item_bundle_017.md) | `gear` | Шестерня | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 152 | [bundle 017](sprite_item_bundle_017.md) | `glass_ampoule_empty` | Пустая ампула | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 153 | [bundle 017](sprite_item_bundle_017.md) | `glass_shard` | Стекло | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 154 | [bundle 018](sprite_item_bundle_018.md) | `govnyak_bad_batch` | Гремучая партия говняка | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 155 | [bundle 018](sprite_item_bundle_018.md) | `govnyak_brick` | Прессованный говняк | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 156 | [bundle 018](sprite_item_bundle_018.md) | `govnyak_courier_package` | Опечатанный пакет | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 157 | [bundle 018](sprite_item_bundle_018.md) | `govnyak_roll` | Говняк-самокрут | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 158 | [bundle 018](sprite_item_bundle_018.md) | `govnyak_sample` | Проба говняка НИИ | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 159 | [bundle 018](sprite_item_bundle_018.md) | `granit4u_belt_shotgun` | «Гранит»-4у | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 160 | [bundle 018](sprite_item_bundle_018.md) | `gravity_beam_emitter` | Гравитационный лучевой излучатель | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 161 | [bundle 018](sprite_item_bundle_018.md) | `green_briquette` | Спецпай зелёный | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 162 | [bundle 018](sprite_item_bundle_018.md) | `grenade` | Граната | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 163 | [bundle 019](sprite_item_bundle_019.md) | `grey_briquette` | Концентрат-беляк | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 164 | [bundle 019](sprite_item_bundle_019.md) | `grn420_gravizhernov` | Гравижернов ГРН-420 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 165 | [bundle 019](sprite_item_bundle_019.md) | `gunstock` | Приклад | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 166 | [bundle 019](sprite_item_bundle_019.md) | `gusl_index_fragment` | Обрывок ГУСЛ | `MISC` | weapon | 1_weapons_ammo | src/data/documents_access.ts |
| 167 | [bundle 019](sprite_item_bundle_019.md) | `gusl_index_page` | Страница индекса ГУСЛ | `NOTE` | document | 4_documents_access | src/data/documents_access.ts |
| 168 | [bundle 019](sprite_item_bundle_019.md) | `hammer` | Молоток | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 169 | [bundle 019](sprite_item_bundle_019.md) | `harpoon_gun` | Гарпун | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 170 | [bundle 019](sprite_item_bundle_019.md) | `hazard_shift_extension` | Допуск на сверхсмену | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 171 | [bundle 019](sprite_item_bundle_019.md) | `heating_element` | Нагревательный элемент | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 172 | [bundle 020](sprite_item_bundle_020.md) | `hermetic_tape` | Гермолента | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 173 | [bundle 020](sprite_item_bundle_020.md) | `hermo_gasket` | Гермопрокладка | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 174 | [bundle 020](sprite_item_bundle_020.md) | `hermodoor_journal` | Журнал обслуживания гермодверей | `MISC` | document | 4_documents_access | src/data/items.ts |
| 175 | [bundle 020](sprite_item_bundle_020.md) | `holy_water` | Святая вода | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 176 | [bundle 020](sprite_item_bundle_020.md) | `homemade_9mm` | Кустарные 9мм | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 177 | [bundle 020](sprite_item_bundle_020.md) | `homemade_ammo_instruction` | Инструкция кустарных патронов | `MISC` | ammo | 1_weapons_ammo | src/data/items.ts |
| 178 | [bundle 020](sprite_item_bundle_020.md) | `homemade_pistol` | Кустарный пистолет | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 179 | [bundle 020](sprite_item_bundle_020.md) | `idol_chernobog` | Идол Чернобога | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 180 | [bundle 020](sprite_item_bundle_020.md) | `import_toiletpaper` | Туалетная бумага «Импорт» | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 181 | [bundle 021](sprite_item_bundle_021.md) | `infected_mushroom` | Заражённый гриб | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 182 | [bundle 021](sprite_item_bundle_021.md) | `ink_bottle` | Чернила | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 183 | [bundle 021](sprite_item_bundle_021.md) | `inspection_mirror` | Смотровое зеркальце | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 184 | [bundle 021](sprite_item_bundle_021.md) | `instant_coffee` | Кофе растворимый | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 185 | [bundle 021](sprite_item_bundle_021.md) | `iodine` | Йод | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 186 | [bundle 021](sprite_item_bundle_021.md) | `ip4_gasmask` | Противогаз ИП-4 | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 187 | [bundle 021](sprite_item_bundle_021.md) | `istotit_candle` | Истотитная свеча | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 188 | [bundle 021](sprite_item_bundle_021.md) | `jackhammer` | Отбойный молоток | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 189 | [bundle 021](sprite_item_bundle_021.md) | `junior_tech_case` | Корпус «Юный техник» | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 190 | [bundle 022](sprite_item_bundle_022.md) | `karkarov_pistol` | Пистолет Каркарова | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 191 | [bundle 022](sprite_item_bundle_022.md) | `kasha` | Каша | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 192 | [bundle 022](sprite_item_bundle_022.md) | `key` | Ключ | `KEY` | key | 4_documents_access | src/data/items.ts |
| 193 | [bundle 022](sprite_item_bundle_022.md) | `keyboard_unit` | Клавиатура | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 194 | [bundle 022](sprite_item_bundle_022.md) | `knife` | Нож | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 195 | [bundle 022](sprite_item_bundle_022.md) | `kompot` | Компот | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 196 | [bundle 022](sprite_item_bundle_022.md) | `krona_battery` | Батарейка «Крона» | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 197 | [bundle 022](sprite_item_bundle_022.md) | `kulich` | Кулич | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 198 | [bundle 022](sprite_item_bundle_022.md) | `labor_shift_card` | Карта смены | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 199 | [bundle 023](sprite_item_bundle_023.md) | `lamp_bulb` | Лампа | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 200 | [bundle 023](sprite_item_bundle_023.md) | `lice_shampoo` | Шампунь от вшей | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 201 | [bundle 023](sprite_item_bundle_023.md) | `lift_scheme` | Схема лифтов | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 202 | [bundle 023](sprite_item_bundle_023.md) | `lime_bucket` | Ведро извести | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 203 | [bundle 023](sprite_item_bundle_023.md) | `liquidator_axe` | Топор ликвидатора | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 204 | [bundle 023](sprite_item_bundle_023.md) | `liquidator_field_roster` | Полевая ведомость ликвидаторов | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 205 | [bundle 023](sprite_item_bundle_023.md) | `liquidator_flashlamp` | Переносной прожектор | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 206 | [bundle 023](sprite_item_bundle_023.md) | `liquidator_issue_card` | Карточка выдачи ликвидатора | `MISC` | document | 4_documents_access | src/data/items.ts |
| 207 | [bundle 023](sprite_item_bundle_023.md) | `liquidator_rake` | Грабли ликвидатора 0Г15 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 208 | [bundle 024](sprite_item_bundle_024.md) | `liquidator_ration` | Черный сухпай ликвидатора | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 209 | [bundle 024](sprite_item_bundle_024.md) | `liquidator_token` | Жетон ликвидатора | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 210 | [bundle 024](sprite_item_bundle_024.md) | `losyash_rifle` | Винтовка Лосяша | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 211 | [bundle 024](sprite_item_bundle_024.md) | `machinegun` | Пулемёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 212 | [bundle 024](sprite_item_bundle_024.md) | `magazine_part` | Детали магазина | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 213 | [bundle 024](sprite_item_bundle_024.md) | `mail_intercept_slip` | Лист перехвата почты | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 214 | [bundle 024](sprite_item_bundle_024.md) | `makarov` | Макаров | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 215 | [bundle 024](sprite_item_bundle_024.md) | `manometer` | Манометр | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 216 | [bundle 024](sprite_item_bundle_024.md) | `market_weight_scale` | Рыночные весы | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 217 | [bundle 025](sprite_item_bundle_025.md) | `maronary_shaving` | Зелёная стружка | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 218 | [bundle 025](sprite_item_bundle_025.md) | `meat_rune` | Мясная руна | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 219 | [bundle 025](sprite_item_bundle_025.md) | `metal_chair` | Металлический стул | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 220 | [bundle 025](sprite_item_bundle_025.md) | `metal_sheet` | Лист металла | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 221 | [bundle 025](sprite_item_bundle_025.md) | `metal_water` | Вода с привкусом металла | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 222 | [bundle 025](sprite_item_bundle_025.md) | `metro_ticket` | Билет метро | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 223 | [bundle 025](sprite_item_bundle_025.md) | `ministry_audit_forgery` | Липовое аудиторское предписание | `MISC` | document | 4_documents_access | src/data/items.ts |
| 224 | [bundle 025](sprite_item_bundle_025.md) | `ministry_clean_stamp` | Чистая министерская печать | `MISC` | document | 4_documents_access | src/data/items.ts |
| 225 | [bundle 025](sprite_item_bundle_025.md) | `missing_record_file` | Пропавшее личное дело | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 226 | [bundle 026](sprite_item_bundle_026.md) | `moonshine_still_part` | Деталь самогонного аппарата | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 227 | [bundle 026](sprite_item_bundle_026.md) | `morphine_ampoule` | Ампула морфина | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 228 | [bundle 026](sprite_item_bundle_026.md) | `moskvin_rifle` | Винтовка Москвина | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 229 | [bundle 026](sprite_item_bundle_026.md) | `mushroom_mass` | Грибная масса | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 230 | [bundle 026](sprite_item_bundle_026.md) | `mutant_tissue_sample` | Образец ткани твари | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 231 | [bundle 026](sprite_item_bundle_026.md) | `nagant` | Револьвер Наган | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 232 | [bundle 026](sprite_item_bundle_026.md) | `nailgun` | Гвоздомёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 233 | [bundle 026](sprite_item_bundle_026.md) | `napalm_mix` | Напалмовая смесь | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 234 | [bundle 026](sprite_item_bundle_026.md) | `neighbor_complaint` | Жалоба соседа | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 235 | [bundle 027](sprite_item_bundle_027.md) | `nii_contraband_manifest` | Ведомость утечки НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 236 | [bundle 027](sprite_item_bundle_027.md) | `nii_forged_audit` | Подложный акт НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 237 | [bundle 027](sprite_item_bundle_027.md) | `nii_market_receipt` | Рыночная расписка НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 238 | [bundle 027](sprite_item_bundle_027.md) | `nii_sample_container` | Тара НИИ для пробы | `MISC` | document | 4_documents_access | src/data/items.ts |
| 239 | [bundle 027](sprite_item_bundle_027.md) | `nii_sample_label` | Наклейка НИИ для пробы | `MISC` | document | 4_documents_access | src/data/items.ts |
| 240 | [bundle 027](sprite_item_bundle_027.md) | `noise_can` | Шумовая банка | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 241 | [bundle 027](sprite_item_bundle_027.md) | `nosin_rifle` | Винтовка Носина | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 242 | [bundle 027](sprite_item_bundle_027.md) | `note` | Записка | `NOTE` | document | 4_documents_access | src/data/items.ts |
| 243 | [bundle 027](sprite_item_bundle_027.md) | `o15_multijet_flamer` | 6О15-УТТХ | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 244 | [bundle 028](sprite_item_bundle_028.md) | `official_permit_slip` | Официальный корешок пропуска | `MISC` | document | 4_documents_access | src/data/items.ts |
| 245 | [bundle 028](sprite_item_bundle_028.md) | `official_quarantine_clearance` | Чистая карантинная справка | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 246 | [bundle 028](sprite_item_bundle_028.md) | `ovb_search_warrant` | Ордер ОВБ на обыск | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 247 | [bundle 028](sprite_item_bundle_028.md) | `overexposed_photo` | Засвеченный кадр | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 248 | [bundle 028](sprite_item_bundle_028.md) | `ozk_patch` | Заплата ОЗК | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 249 | [bundle 028](sprite_item_bundle_028.md) | `p14_gasmask_receipt` | Квитанция 8П14 | `MISC` | document | 4_documents_access | src/data/items.ts |
| 250 | [bundle 028](sprite_item_bundle_028.md) | `p41_heavy_mg` | 6П41 пулемёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 251 | [bundle 028](sprite_item_bundle_028.md) | `painkiller_pack` | Болеутоляющее | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 252 | [bundle 028](sprite_item_bundle_028.md) | `part_ticket` | Партбилет | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 253 | [bundle 029](sprite_item_bundle_029.md) | `party_might_launcher` | Подствольник «Мощь партии» | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 254 | [bundle 029](sprite_item_bundle_029.md) | `party_portrait_pin` | Значок с портрета партии | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 255 | [bundle 029](sprite_item_bundle_029.md) | `passport_stub` | Паспортный корешок | `MISC` | document | 4_documents_access | src/data/items.ts |
| 256 | [bundle 029](sprite_item_bundle_029.md) | `pbrog1_foam_launcher` | ПБРОГ-1 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 257 | [bundle 029](sprite_item_bundle_029.md) | `pearl_barley` | Перловка в банке | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 258 | [bundle 029](sprite_item_bundle_029.md) | `permanent_pass` | Пропуск постоянный | `MISC` | document | 4_documents_access | src/data/items.ts |
| 259 | [bundle 029](sprite_item_bundle_029.md) | `permanganate_vial` | Марганцовка | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 260 | [bundle 029](sprite_item_bundle_029.md) | `personal_file_copy` | Копия личного дела | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 261 | [bundle 029](sprite_item_bundle_029.md) | `pills` | Таблетки | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 262 | [bundle 030](sprite_item_bundle_030.md) | `pipe` | Труба | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 263 | [bundle 030](sprite_item_bundle_030.md) | `pistol_grenade_launcher` | Пистолет-гранатомёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 264 | [bundle 030](sprite_item_bundle_030.md) | `plasma` | Плазмаган | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 265 | [bundle 030](sprite_item_bundle_030.md) | `plastic_sheet` | Пластик | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 266 | [bundle 030](sprite_item_bundle_030.md) | `pneumomail_capsule` | Опечатанная пневмокапсула | `MISC` | document | 4_documents_access | src/data/items.ts |
| 267 | [bundle 030](sprite_item_bundle_030.md) | `portable_siren_key` | Ключ переносной сирены | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 268 | [bundle 030](sprite_item_bundle_030.md) | `post_samosbor_probe_kit` | Набор замера после самосбора | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 269 | [bundle 030](sprite_item_bundle_030.md) | `ppsh` | ППШ | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 270 | [bundle 030](sprite_item_bundle_030.md) | `pressed_sugar` | Красняк прессованный | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 271 | [bundle 031](sprite_item_bundle_031.md) | `pressure_logbook` | Журнал давления | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 272 | [bundle 031](sprite_item_bundle_031.md) | `protective_apron` | Кислотный фартук | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 273 | [bundle 031](sprite_item_bundle_031.md) | `protein_mold_cake` | Плесневой белковый брикет | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 274 | [bundle 031](sprite_item_bundle_031.md) | `psi_beam` | Сгусток: ПСИ-луч | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 275 | [bundle 031](sprite_item_bundle_031.md) | `psi_brainburn` | Сгусток: Выжиг мозга | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 276 | [bundle 031](sprite_item_bundle_031.md) | `psi_concrete_splinter` | Сгусток: Бетонный осколок | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 277 | [bundle 031](sprite_item_bundle_031.md) | `psi_control` | Сгусток: Контроль | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 278 | [bundle 031](sprite_item_bundle_031.md) | `psi_dust` | ПСИ-пыль | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 279 | [bundle 031](sprite_item_bundle_031.md) | `psi_madness` | Сгусток: Безумие | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 280 | [bundle 032](sprite_item_bundle_032.md) | `psi_mark` | Сгусток: Метка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 281 | [bundle 032](sprite_item_bundle_032.md) | `psi_meat_hook` | Сгусток: Мясной крюк | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 282 | [bundle 032](sprite_item_bundle_032.md) | `psi_order_seal` | Сгусток: Печать порядка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 283 | [bundle 032](sprite_item_bundle_032.md) | `psi_phase` | Сгусток: Фазовый сдвиг | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 284 | [bundle 032](sprite_item_bundle_032.md) | `psi_recall` | Сгусток: Возврат | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 285 | [bundle 032](sprite_item_bundle_032.md) | `psi_rupture` | Сгусток: Разрыв | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 286 | [bundle 032](sprite_item_bundle_032.md) | `psi_shadow_lance` | Сгусток: Теневая пика | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 287 | [bundle 032](sprite_item_bundle_032.md) | `psi_siren_pulse` | Сгусток: Сиренный импульс | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 288 | [bundle 033](sprite_item_bundle_033.md) | `psi_stabilizer` | ПСИ-стабилизатор | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 289 | [bundle 033](sprite_item_bundle_033.md) | `psi_storm` | Сгусток: Пси буря | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 290 | [bundle 033](sprite_item_bundle_033.md) | `psi_strike` | Сгусток: Пси удар | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 291 | [bundle 033](sprite_item_bundle_033.md) | `psi_void_needle` | Сгусток: Пустотная игла | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 292 | [bundle 033](sprite_item_bundle_033.md) | `psychiatrist_referral` | Направление к психиатру | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 293 | [bundle 033](sprite_item_bundle_033.md) | `ptrs_liquidator` | ПТРС ликвидатора | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 294 | [bundle 033](sprite_item_bundle_033.md) | `pump_impeller` | Крыльчатка насоса | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 295 | [bundle 033](sprite_item_bundle_033.md) | `pump_passport` | Паспорт насоса | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 296 | [bundle 034](sprite_item_bundle_034.md) | `pushkin_shotgun` | Ружьё «Пушкин» | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 297 | [bundle 034](sprite_item_bundle_034.md) | `quarantine_breach_notice` | Извещение о нарушении карантина | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 298 | [bundle 034](sprite_item_bundle_034.md) | `quarantine_medcard` | Карантинная медкарта | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 299 | [bundle 034](sprite_item_bundle_034.md) | `radio` | Рация | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 300 | [bundle 034](sprite_item_bundle_034.md) | `radio_headset_liquidator` | Гарнитура ликвидатора | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 301 | [bundle 034](sprite_item_bundle_034.md) | `radio_jammer` | Карманная глушилка | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 302 | [bundle 034](sprite_item_bundle_034.md) | `rail_depot_pass` | Пропуск в депо | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 303 | [bundle 034](sprite_item_bundle_034.md) | `rail_signal_lamp` | Сигнальная лампа депо | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 304 | [bundle 035](sprite_item_bundle_035.md) | `rail_spike_pack` | Пакет костылей | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 305 | [bundle 035](sprite_item_bundle_035.md) | `rail_switch_handle` | Рукоять стрелочного перевода | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 306 | [bundle 035](sprite_item_bundle_035.md) | `rail_switch_order` | Ордер стрелочного перевода | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 307 | [bundle 035](sprite_item_bundle_035.md) | `raionsovet_floor_pass` | Пропуск райсовета | `MISC` | document | 4_documents_access | src/data/items.ts |
| 308 | [bundle 035](sprite_item_bundle_035.md) | `rake_bayonet` | Штык-грабли | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 309 | [bundle 035](sprite_item_bundle_035.md) | `ration_registry_extract` | Выписка из пайкового реестра | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 310 | [bundle 035](sprite_item_bundle_035.md) | `ration_stamp_pad` | Пайковая штемпельная подушка | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 311 | [bundle 035](sprite_item_bundle_035.md) | `rawmeat` | Сырое мясо | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 312 | [bundle 036](sprite_item_bundle_036.md) | `rb91_auto_shotgun` | РБ-91 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 313 | [bundle 036](sprite_item_bundle_036.md) | `rebar` | Арматура | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 314 | [bundle 036](sprite_item_bundle_036.md) | `record_exposure_notice` | Акт о пропавшей записи | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 315 | [bundle 036](sprite_item_bundle_036.md) | `red_concentrate` | Красный концентрат | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 316 | [bundle 036](sprite_item_bundle_036.md) | `red_mold_sample` | Проба красной плесени | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 317 | [bundle 036](sprite_item_bundle_036.md) | `relay_diagram` | Схема реле | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 318 | [bundle 036](sprite_item_bundle_036.md) | `resident_identity_stub` | Корешок удостоверения личности | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 319 | [bundle 036](sprite_item_bundle_036.md) | `resident_trinket_box` | Коробка жильцовых мелочей | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 320 | [bundle 037](sprite_item_bundle_037.md) | `rifle_bolt_pack` | Полимерные болты | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 321 | [bundle 037](sprite_item_bundle_037.md) | `rock_salt` | Каменная соль | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 322 | [bundle 037](sprite_item_bundle_037.md) | `roks47_flamethrower` | РОКС-47 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 323 | [bundle 037](sprite_item_bundle_037.md) | `roller_brush` | Валик | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 324 | [bundle 037](sprite_item_bundle_037.md) | `rpl23_lmg` | РПЛ-23 Лёшкинского | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 325 | [bundle 037](sprite_item_bundle_037.md) | `rubber_club` | Резиновая дубинка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 326 | [bundle 037](sprite_item_bundle_037.md) | `rubber_door_wedge` | Резиновый клин гермодвери | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 327 | [bundle 037](sprite_item_bundle_037.md) | `rubber_strip` | Резина | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 328 | [bundle 038](sprite_item_bundle_038.md) | `rubber_tube` | Резиновая трубка | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 329 | [bundle 038](sprite_item_bundle_038.md) | `rusty_rake` | Ржавые грабли | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 330 | [bundle 038](sprite_item_bundle_038.md) | `samosbor_alarm_schedule` | График тревог | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 331 | [bundle 038](sprite_item_bundle_038.md) | `samosbor_tally` | Ведомость самосборов | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 332 | [bundle 038](sprite_item_bundle_038.md) | `sample_chain_form` | Бланк цепочки пробы | `MISC` | document | 4_documents_access | src/data/items.ts |
| 333 | [bundle 038](sprite_item_bundle_038.md) | `sample_cork_seal` | Пробковая пломба | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 334 | [bundle 038](sprite_item_bundle_038.md) | `sand_spoiled_ration` | Пайка с белым песком | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 335 | [bundle 038](sprite_item_bundle_038.md) | `sanitary_kit` | Санитарный набор | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 336 | [bundle 039](sprite_item_bundle_039.md) | `screen_unit` | Экран | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 337 | [bundle 039](sprite_item_bundle_039.md) | `scrubbed_serial_plate` | Сбитая номерная планка | `MISC` | weapon | 1_weapons_ammo | src/data/items.ts |
| 338 | [bundle 039](sprite_item_bundle_039.md) | `scrubbed_weapon_tag` | Сбитая оружейная бирка | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 339 | [bundle 039](sprite_item_bundle_039.md) | `seal_wax` | Сургуч | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 340 | [bundle 039](sprite_item_bundle_039.md) | `sealant_tube` | Тюбик герметика | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 341 | [bundle 039](sprite_item_bundle_039.md) | `sealed_complaint` | Жалоба под сургучом | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 342 | [bundle 039](sprite_item_bundle_039.md) | `sealed_veretar_sand` | Белый песок в гермопакете | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 343 | [bundle 039](sprite_item_bundle_039.md) | `shark_scale` | Акулья чешуя | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 344 | [bundle 040](sprite_item_bundle_040.md) | `shelter_seat_card` | Карточка места в укрытии | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 345 | [bundle 040](sprite_item_bundle_040.md) | `shelter_seat_forgery` | Поддельная карточка укрытия | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 346 | [bundle 040](sprite_item_bundle_040.md) | `shelter_tally` | Ведомость укрытых | `MISC` | document | 4_documents_access | src/data/items.ts |
| 347 | [bundle 040](sprite_item_bundle_040.md) | `shmk_disposable` | ШМК | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 348 | [bundle 040](sprite_item_bundle_040.md) | `shock_baton` | Шоковая дубинка | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 349 | [bundle 040](sprite_item_bundle_040.md) | `shotgun` | Обрез | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 350 | [bundle 040](sprite_item_bundle_040.md) | `siren_energy` | Энергетик Сирена | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 351 | [bundle 040](sprite_item_bundle_040.md) | `siren_instruction` | Инструкция при сирене | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 352 | [bundle 041](sprite_item_bundle_041.md) | `siren_shard` | Осколок сирены | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 353 | [bundle 041](sprite_item_bundle_041.md) | `sledgehammer` | Кувалда | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 354 | [bundle 041](sprite_item_bundle_041.md) | `sleeping_pills` | Снотворное «Попобава» | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 355 | [bundle 041](sprite_item_bundle_041.md) | `slime_age_label_brown` | Бирка молодой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 356 | [bundle 041](sprite_item_bundle_041.md) | `slime_age_label_orange` | Бирка подростковой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 357 | [bundle 041](sprite_item_bundle_041.md) | `slime_age_label_violet` | Бирка взрослой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 358 | [bundle 041](sprite_item_bundle_041.md) | `slime_calcified_chip` | Окаменевший скол слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 359 | [bundle 041](sprite_item_bundle_041.md) | `slime_motor_node` | Моторный узел слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 360 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_black` | Проба чёрной слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 361 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_blue` | Проба голубой слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 362 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_brown` | Проба коричневой слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 363 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_contaminated` | Заражённая проба слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 364 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_fake` | Поддельная проба слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 365 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_green` | Проба зелёной слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 366 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_red` | Проба красной слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 367 | [bundle 042](sprite_item_bundle_042.md) | `slime_sample_seroburmaline` | Проба серобурмалиновой слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 368 | [bundle 043](sprite_item_bundle_043.md) | `slime_sample_silver` | Прозрачная слизь, пломба | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 369 | [bundle 043](sprite_item_bundle_043.md) | `slime_sample_silver_open` | Прозрачная слизь, вскрыта | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 370 | [bundle 043](sprite_item_bundle_043.md) | `slime_sample_white` | Проба белой слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 371 | [bundle 043](sprite_item_bundle_043.md) | `slime_scraper` | Скребок для слизи | `TOOL` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 372 | [bundle 043](sprite_item_bundle_043.md) | `slime_sense_node` | Чувствительный узел слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 373 | [bundle 043](sprite_item_bundle_043.md) | `slyoznev_pps41` | ППС-41 Слизнёва | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 374 | [bundle 043](sprite_item_bundle_043.md) | `smoke_candle_check` | Дымовая шашка проверки тяги | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 375 | [bundle 043](sprite_item_bundle_043.md) | `soap_72` | Мыло хозяйственное 72% | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 376 | [bundle 044](sprite_item_bundle_044.md) | `sound_emitter` | Звукоизлучатель | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 377 | [bundle 044](sprite_item_bundle_044.md) | `soup_cube` | Суповой кубик | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 378 | [bundle 044](sprite_item_bundle_044.md) | `spore_print` | Споровый отпечаток | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 379 | [bundle 044](sprite_item_bundle_044.md) | `spring` | Пружина | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 380 | [bundle 044](sprite_item_bundle_044.md) | `sterile_bandage` | Стерильный бинт | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 381 | [bundle 044](sprite_item_bundle_044.md) | `sterile_swab` | Стерильный мазок | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 382 | [bundle 044](sprite_item_bundle_044.md) | `stolen_archive_card` | Краденая архивная карточка | `MISC` | document | 4_documents_access | src/data/items.ts |
| 383 | [bundle 044](sprite_item_bundle_044.md) | `stolen_filter_pack` | Краденая пачка фильтров | `MISC` | document | 4_documents_access | src/data/items.ts |
| 384 | [bundle 045](sprite_item_bundle_045.md) | `stolen_terminal_stamp` | Украденная печать терминала | `MISC` | document | 4_documents_access | src/data/items.ts |
| 385 | [bundle 045](sprite_item_bundle_045.md) | `strange_clot` | Странный сгусток | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 386 | [bundle 045](sprite_item_bundle_045.md) | `substrate_sack` | Мешок субстрата | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 387 | [bundle 045](sprite_item_bundle_045.md) | `sugar_pack` | Сахар | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 388 | [bundle 045](sprite_item_bundle_045.md) | `syringe_empty` | Пустой шприц | `MISC` | medicine | 2_consumables_medicine | src/data/items.ts |
| 389 | [bundle 045](sprite_item_bundle_045.md) | `tanev_svt40` | СВТ-40 Танева | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 390 | [bundle 045](sprite_item_bundle_045.md) | `tea` | Чай | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 391 | [bundle 045](sprite_item_bundle_045.md) | `technical_spirit` | Технический спирт | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 392 | [bundle 046](sprite_item_bundle_046.md) | `temp_pass` | Пропуск временный | `MISC` | document | 4_documents_access | src/data/items.ts |
| 393 | [bundle 046](sprite_item_bundle_046.md) | `terminal_order_receipt` | Квитанция терминального заказа | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 394 | [bundle 046](sprite_item_bundle_046.md) | `toiletpaper` | Туалетная бумага | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 395 | [bundle 046](sprite_item_bundle_046.md) | `tourniquet` | Жгут | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 396 | [bundle 046](sprite_item_bundle_046.md) | `toz_shotgun` | ТОЗ | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 397 | [bundle 046](sprite_item_bundle_046.md) | `track_diagram_scrap` | Обрывок схемы путей | `MISC` | document | 4_documents_access | src/data/items.ts |
| 398 | [bundle 046](sprite_item_bundle_046.md) | `tracked_zhernov` | Гусеничный жернов | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 399 | [bundle 046](sprite_item_bundle_046.md) | `tt_pistol` | ТТ | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 400 | [bundle 047](sprite_item_bundle_047.md) | `unpeople_detector` | Детектор нелюдей | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 401 | [bundle 047](sprite_item_bundle_047.md) | `unsigned_order` | Приказ без подписи | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 402 | [bundle 047](sprite_item_bundle_047.md) | `used_gasmask_filter` | Отработанный фильтр | `MISC` | document | 4_documents_access | src/data/items.ts |
| 403 | [bundle 047](sprite_item_bundle_047.md) | `uv_spotlight` | УФ-прожектор ликвидатора | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 404 | [bundle 047](sprite_item_bundle_047.md) | `vacuum` | Пылесос | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 405 | [bundle 047](sprite_item_bundle_047.md) | `valve_tag` | Бирка вентиля | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 406 | [bundle 047](sprite_item_bundle_047.md) | `vent_damper_plate` | Заслонка вентиляции | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 407 | [bundle 047](sprite_item_bundle_047.md) | `veretar_sand` | Белый песок | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 408 | [bundle 048](sprite_item_bundle_048.md) | `void_archive_warrant` | Пустотный архивный ордер | `MISC` | document | 4_documents_access | src/data/items.ts |
| 409 | [bundle 048](sprite_item_bundle_048.md) | `void_spike` | Пустотный шип | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 410 | [bundle 048](sprite_item_bundle_048.md) | `voluntary_receipt` | Расписка о добровольном участии | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 411 | [bundle 048](sprite_item_bundle_048.md) | `water` | Вода | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 412 | [bundle 048](sprite_item_bundle_048.md) | `water_coupon` | Талон на воду | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 413 | [bundle 048](sprite_item_bundle_048.md) | `water_filter_regulator` | Регулятор фильтра воды | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 414 | [bundle 048](sprite_item_bundle_048.md) | `water_reservoir_quota` | Квота резервуара воды | `MISC` | food | 2_consumables_medicine | src/data/documents_access.ts |
| 415 | [bundle 048](sprite_item_bundle_048.md) | `water_reservoir_sample` | Проба воды из резервуара | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 416 | [bundle 049](sprite_item_bundle_049.md) | `weapon_blueprint_t2` | Чертёж оружия Т2 | `MISC` | weapon | 1_weapons_ammo | src/data/items.ts |
| 417 | [bundle 049](sprite_item_bundle_049.md) | `weapon_checkout_tag` | Оружейная бирка | `MISC` | weapon | 1_weapons_ammo | src/data/items.ts |
| 418 | [bundle 049](sprite_item_bundle_049.md) | `weapon_permit_forged` | Липовое оружейное разрешение | `MISC` | document | 4_documents_access | src/data/items.ts |
| 419 | [bundle 049](sprite_item_bundle_049.md) | `weapon_permit_signed` | Разрешение на короткоствол | `MISC` | document | 4_documents_access | src/data/items.ts |
| 420 | [bundle 049](sprite_item_bundle_049.md) | `wet_rag_bundle` | Мокрые тряпки | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 421 | [bundle 049](sprite_item_bundle_049.md) | `wire_coil` | Моток провода | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 422 | [bundle 049](sprite_item_bundle_049.md) | `wrench` | Ключ гаечный | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 423 | [bundle 049](sprite_item_bundle_049.md) | `yeast_bread` | Дрожжевой хлеб | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 424 | [bundle 050](sprite_item_bundle_050.md) | `zatychkin_pistol` | Пистолет Затычкина | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 425 | [bundle 050](sprite_item_bundle_050.md) | `zhek_seal` | Печать ЖЭК | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 426 | [bundle 050](sprite_item_bundle_050.md) | `zhelemish_boiled` | Варёный желемыш | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 427 | [bundle 050](sprite_item_bundle_050.md) | `zhelemish_dried` | Сушёный желемыш | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 428 | [bundle 050](sprite_item_bundle_050.md) | `zhelemish_raw` | Сырой желемыш | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 429 | [bundle 050](sprite_item_bundle_050.md) | `zhelemish_sample_contaminated` | Загрязнённый образец желемыша | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 430 | [bundle 050](sprite_item_bundle_050.md) | `zhelemish_sample_sealed` | Запечатанный образец желемыша | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 431 | [bundle 050](sprite_item_bundle_050.md) | `zinc_slime_bucket` | Цинковое ведро для слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
