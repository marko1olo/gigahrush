# Batch 4 Parallel Contract

Date: 2026-05-18

This contract is shared by AGENT_121 through AGENT_220. The queue is designed for GPT-5.5 workers running in parallel without touching the same source files.

## Current Queue State

- Completed active prompts from AGENT_31 through AGENT_120 were removed from `Docs/AgentPrompts` after local verification.
- Left active from the prior batch: `AGENT_111_KRYSNOZHKA_SWARM.md` and `AGENT_119_README_FACT_PASS.md` because they lack required status/log evidence.
- New batch: `AGENT_121` through `AGENT_220`.
- Current verification before queue refresh: `npm run typecheck` passed, `npm run test:unit` passed, `node scripts/content-audit.mjs` passed.

## Parallel Rules

- Own exactly the files listed in your prompt plus your status/log and one optional unique test file named `tests/agNNN_<slug>.test.ts`.
- Do not edit `README.md`; old `AGENT_119` owns the README fact pass.
- Do not edit `Docs/AgentPrompts` from worker prompts.
- Do not edit shared manifests, `main.ts`, `core/world.ts`, `core/types.ts`, `render/webgl.ts`, broad AI, or broad quest/inventory/economy systems unless your prompt explicitly lists that file as owned.
- Prefer existing ids, items, resources, events, marks, containers, and helper functions. If a missing shared hook blocks the work, record the blocker instead of widening scope.
- No per-frame full-world scans. Use generation-time work, bounded local checks, cooldowns, dirty state, or existing event buffers.
- Keep player-facing Russian text if the local module already uses it. Do not translate existing content by accident.
- Run baseline `npm run typecheck`; for generator/system changes run `npm run check` unless the real environment blocks it. Record exact command results.

## Batch Index

| Agent | Owned source | Role |
| --- | --- | --- |
| AGENT_121 | `src/gen/design_floors/roof.ts` | roof route-floor pressure owner |
| AGENT_122 | `src/gen/design_floors/chthonic_attic.ts` | attic route-floor owner |
| AGENT_123 | `src/gen/design_floors/antenna_court.ts` | antenna route-floor owner |
| AGENT_124 | `src/gen/design_floors/upper_bureau.ts` | upper bureau route-floor owner |
| AGENT_125 | `src/gen/design_floors/raionsovet_archive.ts` | raionsovet archive route-floor owner |
| AGENT_126 | `src/gen/design_floors/registry_morgue.ts` | registry morgue route-floor owner |
| AGENT_127 | `src/gen/design_floors/manhattan_crossroads.ts` | crossroads route-floor owner |
| AGENT_128 | `src/gen/design_floors/communal_ring.ts` | communal ring route-floor owner |
| AGENT_129 | `src/gen/design_floors/floor_69.ts` | floor 69 route-floor owner |
| AGENT_130 | `src/gen/design_floors/black_market_88.ts` | black market route-floor owner |
| AGENT_131 | `src/gen/design_floors/production_belt.ts` | production belt route-floor owner |
| AGENT_132 | `src/gen/design_floors/service_floor.ts` | service floor route-floor owner |
| AGENT_133 | `src/gen/design_floors/dark_metro.ts` | dark metro route-floor owner |
| AGENT_134 | `src/gen/design_floors/underhell.ts` | underhell route-floor owner |
| AGENT_135 | `src/gen/design_floors/darkness.ts` | darkness route-floor owner |
| AGENT_136 | `src/gen/design_floors/full_floor.ts` | design-floor expansion guard owner |
| AGENT_137 | `src/gen/procedural_screens.ts` | procedural screen cue owner |
| AGENT_138 | `src/gen/living/temple.ts` | temple content owner |
| AGENT_139 | `src/gen/living/library.ts` | library content owner |
| AGENT_140 | `src/gen/living/market.ts` | market content owner |
| AGENT_141 | `src/gen/living/black_market_88.ts` | living black market owner |
| AGENT_142 | `src/gen/living/mushroom_cellar.ts` | mushroom cellar owner |
| AGENT_143 | `src/gen/living/zhelemish_cellar.ts` | zhelemish cellar owner |
| AGENT_144 | `src/gen/living/carnivorous_fungus_room.ts` | carnivorous fungus room owner |
| AGENT_145 | `src/gen/living/art_studies.ts` | art studies owner |
| AGENT_146 | `src/gen/living/soviet_housing_pack.ts` | soviet housing pack owner |
| AGENT_147 | `src/gen/living/domkom_laundry_pack.ts` | domkom laundry owner |
| AGENT_148 | `src/gen/living/obzh_school.ts` | OBZH school owner |
| AGENT_149 | `src/gen/living/hospital_quarantine.ts` | hospital quarantine owner |
| AGENT_150 | `src/gen/living/cartographer_zone_map.ts` | cartographer owner |
| AGENT_151 | `src/gen/living/domkom_ammo_locker.ts` | ammo locker owner |
| AGENT_152 | `src/gen/living/emergency_medpost.ts` | emergency medpost owner |
| AGENT_153 | `src/gen/living/fake_medpost_zhelemish.ts` | fake medpost owner |
| AGENT_154 | `src/gen/living/hermoseam_station.ts` | hermoseam station owner |
| AGENT_155 | `src/gen/living/expedition_prep.ts` | expedition prep owner |
| AGENT_156 | `src/gen/living/external_cell_neighbor.ts` | external cell neighbor owner |
| AGENT_157 | `src/gen/living/govnyak_smoke_den.ts` | govnyak smoke den owner |
| AGENT_158 | `src/gen/living/white_compulsion_room.ts` | white compulsion owner |
| AGENT_159 | `src/gen/living/veretar_window_rescue.ts` | veretar window owner |
| AGENT_160 | `src/gen/living/scientist_escort_sample.ts` | scientist escort owner |
| AGENT_161 | `src/gen/living/istotit_supply_cache.ts` | Istotit supply cache owner |
| AGENT_162 | `src/gen/kvartiry/red_corner.ts` | red corner owner |
| AGENT_163 | `src/gen/kvartiry/ration_queue.ts` | ration queue owner |
| AGENT_164 | `src/gen/kvartiry/water_riot.ts` | water riot owner |
| AGENT_165 | `src/gen/kvartiry/barricade.ts` | barricade owner |
| AGENT_166 | `src/gen/kvartiry/communal_kitchen_feud.ts` | communal kitchen feud owner |
| AGENT_167 | `src/gen/kvartiry/ammo_smelter.ts` | ammo smelter owner |
| AGENT_168 | `src/gen/kvartiry/print_room.ts` | print room owner |
| AGENT_169 | `src/gen/kvartiry/lost_child_corner.ts` | lost child corner owner |
| AGENT_170 | `src/gen/kvartiry/medicine_swap.ts` | medicine swap owner |
| AGENT_171 | `src/gen/kvartiry/false_neighbor.ts` | false neighbor owner |
| AGENT_172 | `src/gen/kvartiry/kv08_route_assembly.ts` | kv08 route assembly owner |
| AGENT_173 | `src/gen/maintenance/pressure_station.ts` | pressure station owner |
| AGENT_174 | `src/gen/maintenance/steam_valves.ts` | steam valves owner |
| AGENT_175 | `src/gen/maintenance/diver_cache.ts` | diver cache owner |
| AGENT_176 | `src/gen/maintenance/watermeter_post.ts` | watermeter post owner |
| AGENT_177 | `src/gen/maintenance/overflow_sluice.ts` | overflow sluice owner |
| AGENT_178 | `src/gen/maintenance/water_bridge.ts` | water bridge owner |
| AGENT_179 | `src/gen/maintenance/lift_repair_shaft.ts` | lift repair shaft owner |
| AGENT_180 | `src/gen/maintenance/heatline_zero.ts` | heatline zero owner |
| AGENT_181 | `src/gen/maintenance/metro_error_line.ts` | metro error line owner |
| AGENT_182 | `src/gen/maintenance/concentrate_press.ts` | concentrate press owner |
| AGENT_183 | `src/gen/maintenance/charge_cage.ts` | charge cage owner |
| AGENT_184 | `src/gen/maintenance/automation_cage.ts` | automation cage owner |
| AGENT_185 | `src/gen/maintenance/collectors_pressure_reroute.ts` | collectors pressure reroute owner |
| AGENT_186 | `src/gen/maintenance/paritel_steam_bridge.ts` | Paritel steam bridge owner |
| AGENT_187 | `src/gen/maintenance/slime_sample_post.ts` | slime sample post owner |
| AGENT_188 | `src/gen/maintenance/blue_glow_sample.ts` | blue glow sample owner |
| AGENT_189 | `src/gen/maintenance/green_acid_room.ts` | green acid room owner |
| AGENT_190 | `src/gen/maintenance/brown_slime_cleanup.ts` | brown slime cleanup owner |
| AGENT_191 | `src/gen/maintenance/slime_deactivation_furnace.ts` | slime furnace owner |
| AGENT_192 | `src/gen/maintenance/slime_singing_vents.ts` | slime singing vents owner |
| AGENT_193 | `src/gen/maintenance/red_adhesive_trap.ts` | red adhesive trap owner |
| AGENT_194 | `src/gen/maintenance/black_slime_eyes.ts` | black slime eyes owner |
| AGENT_195 | `src/gen/maintenance/seroburmaline_no_look.ts` | seroburmaline no-look owner |
| AGENT_196 | `src/gen/maintenance/pneumomail_station.ts` | pneumomail station owner |
| AGENT_197 | `src/gen/maintenance/betonoed_shortcut.ts` | betonoed shortcut owner |
| AGENT_198 | `src/gen/maintenance/kostorez_locker.ts` | kostorez locker owner |
| AGENT_199 | `src/gen/maintenance/defector_liquidator.ts` | defector liquidator owner |
| AGENT_200 | `src/gen/maintenance/cult_held_workshop.ts` | cult-held workshop owner |
| AGENT_201 | `src/gen/ministry/permit_office.ts` | permit office owner |
| AGENT_202 | `src/gen/ministry/stamp_room.ts` | stamp room owner |
| AGENT_203 | `src/gen/ministry/weapon_permit_bureau.ts` | weapon permit bureau owner |
| AGENT_204 | `src/gen/ministry/inspection_archive.ts` | inspection archive owner |
| AGENT_205 | `src/gen/ministry/liquidator_archive.ts` | liquidator archive owner |
| AGENT_206 | `src/gen/ministry/document_gate.ts` | document gate owner |
| AGENT_207 | `src/gen/ministry/nii_contraband_audit.ts` | NII contraband audit owner |
| AGENT_208 | `src/gen/ministry/interrogation.ts` | interrogation closet owner |
| AGENT_209 | `src/gen/ministry/queue_hall.ts` | queue hall owner |
| AGENT_210 | `src/gen/ministry/refusal_clause.ts` | refusal clause owner |
| AGENT_211 | `src/gen/hell/altar_arena.ts` | hell altar arena owner |
| AGENT_212 | `src/gen/hell/thin_wall_chapel.ts` | thin wall chapel owner |
| AGENT_213 | `src/gen/hell/choir_tax.ts` | choir tax owner |
| AGENT_214 | `src/gen/hell/psi_meat_cache.ts` | psi meat cache owner |
| AGENT_215 | `src/gen/void/protocol_chamber.ts` | protocol chamber owner |
| AGENT_216 | `src/gen/void/borrowed_light_rule.ts` | borrowed light owner |
| AGENT_217 | `src/gen/void/trace_seal_protocol.ts` | trace seal owner |
| AGENT_218 | `src/systems/govnyak.ts` | govnyak system owner |
| AGENT_219 | `src/systems/pneumomail.ts` | pneumomail system owner |
| AGENT_220 | `src/systems/ration_coupons.ts` | ration coupon system owner |
