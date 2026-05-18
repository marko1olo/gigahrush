# AG07 Items / Weapons / PSI / Documents Status

Agent: AGENT_07_ITEMS_WEAPONS_DOCUMENTS
Domain: Items / Weapons / PSI / Documents
Task Count: 14

## Preflight

- [x] Read `README.md` by CLI. DOD: direct `sed` read before implementation. Rejected: memory-only summary. Estimate: 1000 us.
- [x] Extracted AG07 XML block cover-to-cover by CLI. DOD: `awk` range extraction by exact id. Rejected: MCP/basic reader. Estimate: 1000 us.
- [x] Read mandatory design/code files. DOD: `desdoc.md` sections 14/15/16/20/35/37 plus item/weapon/psi/note/inventory/main/sprite files. Rejected: editing from assumptions. Estimate: 8000 us.
- [x] Identified mandates. DOD: AG07 selected mandates applied; `.agents-skills` registry absent in this checkout. Rejected: inventing missing registry filenames. Estimate: 1000 us.

## Implementation Checklist

- [x] 1. Inventory current item ids, weapon ids, ammo ids, PSI ids. Record collision risks. DOD: scanned existing `ITEMS` and supported PSI hooks before choosing ids. Rejected: guessing unused ids. Estimate: 3000 us.
- [x] 2. Add at least 40 ordinary/economic/lore items using existing `ItemType`s and spawn rooms. DOD: added 50+ MISC/TOOL/economic/document/component/lore items with role, value, and spawn rooms or deliberate `spawnW:0`. Rejected: new item type. Estimate: 12000 us.
- [x] 3. Add at least 10 medical/food/drink items with sensible synchronous `use` effects. DOD: added 20 food/drink/medicine entries using existing `feed`, `drink`, `medicine`, and `psiMedicine` closures. Rejected: async/status systems outside scope. Estimate: 7000 us.
- [x] 4. Add at least 8 physical weapons using existing mechanics and projectile sprites. DOD: added 13 physical weapons to `ITEMS` and `PHYS_WEAPON_STATS`. Rejected: renderer sprite changes. Estimate: 8000 us.
- [x] 5. Add at least 3 ammo/component items if needed by new weapons. DOD: added `ammo_762tt`, `ammo_nagant`, `ammo_harpoon` plus many component MISC ids. Rejected: overloading all new guns onto wrong existing ammo. Estimate: 3000 us.
- [x] 6. Add at least 6 PSI weapons/spells with supported projectile or instant hooks. DOD: added 5 projectile PSI spells plus one supported `storm` instant alias. Rejected: unsupported instant ids. Estimate: 4000 us.
- [x] 7. Add at least 60 new `NOTES` entries. DOD: added 80 original short note strings; total `NOTES` count is 95. Rejected: long UI-clogging prose. Estimate: 9000 us.
- [x] 8. Balance values: food 1-15, medicine 20-150, weapons 25-5000, PSI rare/expensive. DOD: AG07 food/drink 2-15, medicine 20-150, physical weapons 25-700, PSI 450-2600. Rejected: common ultra-tier kitchen loot. Estimate: 3000 us.
- [x] 9. Keep spawn weights sane. DOD: ordinary items spawn in matching room types at weight 1; legendary lore items use `spawnW:0`; no AG07 ultra weapon in kitchens. Estimate: 3000 us.
- [x] 10. Ensure `getStack` and `spawnCount` behavior remains correct. DOD: new weapons default to stack 1, tools/keys spawn count 1, ammo stacks and spawns by existing ammo multiplier. Rejected: per-item stack overrides except existing grenade behavior. Estimate: 2000 us.
- [x] 11. Confirm debug spawn-all coverage. DOD: `debug.ts` case 3 uses `Object.keys(ITEMS)` and `getStack(def)`, so AG07 data is exposed without debug edits. Rejected: editing hardcoded "all weapons" debug command outside requirement. Estimate: 1000 us.
- [x] 12. README factual update with counts/categories. DOD: updated item/weapon/PSI/note category facts and debug wording without full id dump. Estimate: 2000 us.
- [x] 13. Run build and fix own type/key errors. DOD: final `npm run build` passed, Vite built `dist/index.html` in 698 ms. Estimate: 1000 us.
- [x] 14. Append final IDs added here for other agents. DOD: final id categories listed below. Estimate: 3000 us.

## Baseline

- [x] Baseline `npm run build` recorded: passed, Vite built `dist/index.html` in 612 ms.
- [x] Loop 1 build after tasks 1-5/early 6: passed, Vite built `dist/index.html` in 691 ms.
- [x] Loop 2 build after tasks 7-10: passed, Vite built `dist/index.html` in 691 ms.
- [x] Loop 3 build after README/debug verification: passed, Vite built `dist/index.html` in 698 ms.
- [x] Loop 4 POLISH_MANDATE: no duplicate item ids, no weapon item missing stats, all new weapon ids have matching stats, final build passed in 674 ms.

## Round 2

- [x] Extracted `<AGENT_PROMPT id="AGENT_07_ITEMS_WEAPONS_DOCUMENTS">` by exact `awk` range.
- [x] Read required files: `README.md`, `architecture.md`, `src/data/items.ts`, `src/data/weapons.ts`, `src/data/psi.ts`, `src/data/notes.ts`, `src/data/resources.ts`, `src/data/container_defs.ts`, `src/systems/inventory.ts`, `src/systems/containers.ts`.
- [x] Baseline `npm run build` before Round 2 edits: passed, Vite built in 751 ms.
- [x] Audit: first AG07 catalogue had 156 item ids, 16 PSI stats, 95 notes. Near-dead categories were not missing stats; they were weak reachability/economy hooks for tools/documents. `radio`, `fog_detector`, `unpeople_detector`, many documents, and repair components spawned as room loot but were not represented in resource categories or container pools. `shark_scale` and `void_spike` remain deliberate debug-only lore trophies; high-tier weapons remain quest/hell/debug reachable rather than common spawn.
- [x] Added 12 new item ids, under the 20-item cap. No new `ItemType`.
- [x] Added 14 short notes tied to containers, Ministry paperwork, Kvartiry ration forms, and Maintenance pressure/valve documents.
- [x] Added zero weapons and zero PSI runes in Round 2. Existing mechanics did not need another supported projectile clone.
- [x] Updated `RESOURCES` so expanded food, medicine, ammo, tools, electronics, PSI scraps, and documents participate in economy pricing.
- [x] Updated `CONTAINER_DEFS` so new documents/components appear in filing cabinets, safes, cashboxes, medical cabinets, metal cabinets, emergency boxes, and tool lockers.
- [x] Data-count check after shared-worktree updates: `items=187`, `notes=137`, `psiStats=16`, duplicate item ids `[]`, missing resource refs `[]`, missing container refs `[]`. AG07 Round 2 itself added 12 item ids and 14 note strings; the higher current totals include other unowned rows already present in the shared worktree.
- [x] README counts updated: 187 catalogue items and 137 lore notes.
- [x] Post-AG07 data `npm run build`: passed, Vite built in 800 ms before later shared `samosbor.ts` edits landed.
- [ ] Latest `npm run build`: blocked by out-of-scope `src/systems/samosbor.ts` duplicate declarations (`findPlayer`, `applyPendingSamosborAftermath`, `findWalkableNear`). AG07 write scope forbids fixing that shared system here.
- [ ] `npm run typecheck`: blocked by out-of-scope `src/systems/samosbor.ts` errors. Initial run reported unused aftermath variables and missing `findPlayer` / `applyPendingSamosborAftermath`; latest build reports duplicate declarations in the same file.

Round 2 IDs added:
`samosbor_tally`, `sealed_complaint`, `elevator_override_form`, `pressure_logbook`, `ration_stamp_pad`, `container_key_label`, `valve_tag`, `relay_diagram`, `seal_wax`, `emergency_roster`, `filter_receipt`, `inspection_mirror`.

Round 2 reachability:
`samosbor_tally` — `OFFICE`/`HQ`/`COMMON` spawn, filing cabinet, paper/documents resources.
`sealed_complaint` — `LIVING`/`OFFICE` spawn, filing cabinet, paper/documents resources.
`elevator_override_form` — `OFFICE`/`CORRIDOR`/`HQ` spawn, safe, documents resource.
`pressure_logbook` — `PRODUCTION`/`OFFICE`/`STORAGE` spawn, filing cabinet, documents resource.
`ration_stamp_pad` — `OFFICE`/`KITCHEN`/`COMMON` spawn, safe/cashbox, documents resource.
`container_key_label` — `STORAGE`/`OFFICE` spawn, filing cabinet/cashbox, documents resource.
`valve_tag` — `PRODUCTION`/`STORAGE` spawn, metal cabinet/tool locker, metal/tools resources.
`relay_diagram` — `PRODUCTION`/`OFFICE`/`STORAGE` spawn, metal cabinet/tool locker, electronics resource.
`seal_wax` — `OFFICE`/`STORAGE` spawn, safe, documents resource.
`emergency_roster` — `COMMON`/`HQ`/`OFFICE` spawn, filing cabinet/emergency box, documents resource.
`filter_receipt` — `MEDICAL`/`STORAGE`/`OFFICE` spawn, medical cabinet/filing cabinet, documents resource.
`inspection_mirror` — `BATHROOM`/`MEDICAL`/`OFFICE` spawn, medical cabinet/tool locker, tools resource.

## Iterative Review Loops

- [x] Loop 1: inventory/items/weapons/ammo, build.
- [x] Loop 2: PSI/notes/balance/spawn/stack review, build.
- [x] Loop 3: debug coverage/README review, build.
- [x] Loop 4: POLISH_MANDATE weapon-stat and duplicate-id audit, build.
- [x] Loop 5: final report/log/status audit before response.

## Collision Risks

- Existing item ids: `bread`, `canned`, `kasha`, `rawmeat`, `water`, `tea`, `kompot`, `bandage`, `pills`, `antidep`, `holy_water`, `kulich`, `easter_egg`, `pipe`, `wrench`, `knife`, `rebar`, `axe`, `chainsaw`, `makarov`, `ppsh`, `shotgun`, `nailgun`, `ak47`, `machinegun`, `grenade`, `gauss`, `plasma`, `bfg`, `flamethrower`, `ammo_9mm`, `ammo_shells`, `ammo_nails`, `ammo_762`, `ammo_belt`, `ammo_energy`, `ammo_fuel`, `psi_strike`, `psi_rupture`, `psi_storm`, `psi_brainburn`, `psi_madness`, `psi_control`, `psi_phase`, `psi_mark`, `psi_recall`, `psi_beam`, `flashlight`, `jackhammer`, `door_kit`, `block_kit`, `cleaning_kit`, `vacuum`, `toiletpaper`, `cigs`, `book`, `note`, `key`, `idol_chernobog`, `strange_clot`, `ballot`.
- Collision risk: new ids must avoid existing 61 ids; no new `ItemType`; new projectile weapons must reuse `Spr.BULLET`, `Spr.PELLET`, `Spr.NAIL`, or `Spr.PSI_BOLT`.

## Final IDs Added

Food/drink/medicine:
`grey_briquette`, `green_briquette`, `liquidator_ration`, `pearl_barley`, `soup_cube`, `pressed_sugar`, `yeast_bread`, `filtered_water`, `boiler_water`, `metal_water`, `instant_coffee`, `siren_energy`, `calm_brew`, `tourniquet`, `iodine`, `antibiotic`, `morphine_ampoule`, `psi_stabilizer`, `sanitary_kit`, `antifungal_ointment`.

Physical weapons:
`hammer`, `crowbar`, `sledgehammer`, `fire_hook`, `entrenching_spade`, `bayonet`, `chain`, `metal_chair`, `tt_pistol`, `nagant`, `homemade_pistol`, `toz_shotgun`, `harpoon_gun`.

Ammo:
`ammo_762tt`, `ammo_nagant`, `ammo_harpoon`.

PSI weapons:
`psi_concrete_splinter`, `psi_shadow_lance`, `psi_order_seal`, `psi_void_needle`, `psi_meat_hook`, `psi_siren_pulse`.

Economy/doc/tool/component/lore:
`water_coupon`, `concentrate_coupon`, `liquidator_token`, `fake_pass`, `zhek_seal`, `hermo_gasket`, `fuse`, `gasmask_filter`, `manometer`, `radio`, `fog_detector`, `unpeople_detector`, `acid_bottle`, `duct_tape`, `wire_coil`, `shark_scale`, `bottled_voice`, `siren_shard`, `void_spike`, `meat_rune`, `child_map`, `metro_ticket`, `clean_health_cert`, `psychiatrist_referral`, `hermodoor_journal`, `pump_passport`, `temp_pass`, `permanent_pass`, `caravan_route`, `lift_scheme`, `blank_form`, `neighbor_complaint`, `denunciation`, `unsigned_order`, `siren_instruction`, `voluntary_receipt`, `gear`, `spring`, `circuit_board`, `lamp_bulb`, `barrel_part`, `gunstock`, `magazine_part`, `metal_sheet`, `cloth_roll`, `alcohol_bottle`, `rubber_strip`, `glass_shard`, `filter_layer`, `ink_bottle`, `asbestos_cord`, `sealant_tube`, `psi_dust`.

Notes:
80 new strings appended to `NOTES`; total note strings: 95.
