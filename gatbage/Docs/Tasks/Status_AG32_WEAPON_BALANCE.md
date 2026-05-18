# AG32 Weapon Role Balance Status

Date: 2026-05-17

## Checklist

- [x] Extracted `AGENT_32_WEAPON_ROLE_BALANCE` prompt block.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P0.1, `src/data/weapons.ts`, `src/data/psi.ts`, `src/data/items.ts`, `src/systems/inventory.ts`, `src/systems/ai/combat.ts`, `src/systems/rpg.ts`, and `src/gen/living/tutor_room.ts`.
- [x] Ran mandatory baseline `npm run typecheck`: passed before edits.
- [x] Tuned physical weapon data in `src/data/weapons.ts`.
- [x] Tuned PSI weapon data in `src/data/psi.ts`.
- [x] Updated shipped item descriptions, values, and ammo spawn scarcity in `src/data/items.ts`.
- [x] Reduced tutor room counter 9mm from 16 to 8 in `src/gen/living/tutor_room.ts`.
- [x] Scanned for near-duplicate DPS/ammo/spread roles and documented justifications below.
- [x] Ran `npm run check`: blocked by unrelated current-tree typecheck errors outside AG32 write scope.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG32_WEAPON_BALANCE.md`.

## Physical Weapon Role Table

| Id | Role after pass | After stats | Before -> after reasoning |
| --- | --- | --- | --- |
| unarmed | Last resort fallback | 3 dmg / 1.3 reach / 0.35 cd | 3/1.3/0.30 -> 3/1.3/0.35. Slower so fists do not compete with knife. |
| knife | Emergency melee | 8 dmg / 1.25 reach / 0.28 cd / 35 dur | 8/1.3/0.25/40 -> 8/1.25/0.28/35. Fast, but short and fragile. |
| wrench | Reliable worker tool | 14 dmg / 1.35 reach / 0.48 cd / 85 dur | 12/1.4/0.40/60 -> 14/1.35/0.48/85. Lower DPS than hammer, much better durability. |
| pipe | Cheap reach blunt | 20 dmg / 1.65 reach / 0.62 cd / 55 dur | 18/1.5/0.50/50 -> 20/1.65/0.62/55. Longer and slower instead of plain upgrade. |
| rebar | Durable long stab | 27 dmg / 1.8 reach / 0.72 cd / 90 dur | 25/1.6/0.60/80 -> 27/1.8/0.72/90. Reach/durability niche over axe. |
| axe | Short high burst | 34 dmg / 1.45 reach / 0.82 cd / 70 dur | 30/1.5/0.70/70 -> 34/1.45/0.82/70. Stronger hit, worse reach/cycle. |
| chainsaw | Rare burst tool | 80 dmg / 1.35 reach / 0.22 cd / 18 dur | 100/1.4/0.20/30 -> 80/1.35/0.22/18. Still terrifying, but resource-bound by breakage. |
| makarov | Cheap precise pistol | 18 dmg / 0.45 cd / 0.025 spread / ammo_9mm | 20/0.40/0.02 -> 18/0.45/0.025. Starter gun stays useful without becoming zone-clear ammo. |
| ppsh | Ammo-hungry 9mm hose | 8 dmg / 0.09 cd / 0.09 spread / ammo_9mm | 10/0.08/0.06 -> 8/0.09/0.09. Higher consumption, less precision, distinct from pistol. |
| shotgun | Corridor stop at close range | 9x6 dmg / 1.05 cd / 0.22 spread / shells | 8x6/1.00/0.15 -> 9x6/1.05/0.22. Wider panic cone, not precision. |
| nailgun | Industrial precision stream | 14 dmg / 0.22 cd / 0.025 spread / nails | 12/0.12/0.04 -> 14/0.22/0.025. Slower, accurate, tied to scarcer industrial nails. |
| ak47 | Military punch rifle | 30 dmg / 0.24 cd / 0.045 spread / ammo_762 | 25/0.15/0.03 -> 30/0.24/0.045. Strong per-shot rifle, not SMG clone. |
| machinegun | Belt-fed suppressor | 16 dmg / 0.08 cd / 0.12 spread / ammo_belt | 15/0.07/0.10 -> 16/0.08/0.12. Highest sustained fire, high spread and belt dependence. |
| grenade | One-use area burst | 90 dmg / 1.5 cd / radius 4 / grenade item | 80/1.2/r4 -> 90/1.5/r4. More decisive throw, slower follow-up. |
| gauss | Late precise energy kill | 140 dmg / 1.8 cd / 0 spread / energy | 120/1.5/0 -> 140/1.8/0. Big shot, slow and energy-bound. |
| plasma | Fast unstable energy drain | 30 dmg / 0.22 cd / 0.10 spread / energy | 35/0.15/0.08 -> 30/0.22/0.10. Still strong, no longer the obvious best DPS. |
| bfg | Late area delete button | 240 dmg / 3.5 cd / radius 9 / energy | 200/3.0/r8 -> 240/3.5/r9. More impact per cell, slower and expensive. |
| flamethrower | Short industrial fire stream | 6 dmg / 0.08 cd / 0.18 spread / fuel | 5/0.05/0.15 -> 6/0.08/0.18. Lower sustained pressure, fuel-bound cone. |
| hammer | Cheap fast blunt | 13 dmg / 1.3 reach / 0.38 cd / 70 dur | 14/1.35/0.35/65 -> 13/1.3/0.38/70. Fast worker weapon, lower hit than wrench. |
| crowbar | Durable mid-tier blunt | 28 dmg / 1.55 reach / 0.68 cd / 105 dur | 26/1.55/0.58/90 -> 28/1.55/0.68/105. Durability role, not pure DPS. |
| sledgehammer | Heavy burst melee | 50 dmg / 1.6 reach / 1.25 cd / 90 dur | 42/1.55/0.95/85 -> 50/1.6/1.25/90. Biggest non-saw hit, real recovery cost. |
| fire_hook | Longest melee reach | 21 dmg / 2.05 reach / 0.78 cd / 80 dur | 22/1.8/0.70/70 -> 21/2.05/0.78/80. Reach specialist with modest DPS. |
| entrenching_spade | Reliable short military tool | 18 dmg / 1.35 reach / 0.48 cd / 90 dur | 16/1.35/0.35/75 -> 18/1.35/0.48/90. Durable, not a bayonet duplicate. |
| bayonet | Fast precise thrust | 16 dmg / 1.55 reach / 0.35 cd / 60 dur | 18/1.45/0.30/55 -> 16/1.55/0.35/60. Speed/reach niche with lower hit. |
| chain | Flexible reach weapon | 18 dmg / 1.85 reach / 0.52 cd / 75 dur | 20/1.7/0.55/80 -> 18/1.85/0.52/75. Long, uneven, lighter than rebar. |
| metal_chair | Fragile wide shove | 24 dmg / 1.55 reach / 0.85 cd / 32 dur | 19/1.45/0.65/45 -> 24/1.55/0.85/32. Funny burst object, breaks fast. |
| tt_pistol | Scarcer strong pistol | 26 dmg / 0.42 cd / 0.04 spread / ammo_762tt | 24/0.35/0.035 -> 26/0.42/0.04. Power over Makarov, rarer ammo. |
| nagant | Slow precision revolver | 34 dmg / 0.9 cd / 0.012 spread / ammo_nagant | 22/0.55/0.02 -> 34/0.9/0.012. Accurate high-hit antique, low DPS. |
| homemade_pistol | Janky 9mm hand cannon | 22 dmg / 0.9 cd / 0.14 spread / ammo_9mm | 18/0.75/0.12 -> 22/0.9/0.14. Cheap high single shot with bad accuracy. |
| toz_shotgun | Tighter slow hunting shotgun | 8x8 dmg / 1.35 cd / 0.09 spread / shells | 7x8/1.15/0.12 -> 8x8/1.35/0.09. Distinct from obrez by tighter cone and slower cycle. |
| harpoon_gun | Industrial heavy penetrator | 70 dmg / 1.7 cd / 0.005 spread / harpoons | 55/1.4/0.01 -> 70/1.7/0.005. Rare ammo, precise heavy shot. |

## PSI Weapon Role Table

| Id | Role after pass | After stats | Before -> after reasoning |
| --- | --- | --- | --- |
| psi_strike | Early utility bolt | 14 dmg / 2 PSI / 0.45 cd | 10/1/0.35 -> 14/2/0.45. Five casts at base 10 PSI, not infinite backup ammo. |
| psi_rupture | Cheap wide PSI AoE | 18 dmg / 5 PSI / 0.9 cd / radius 3 | 10/3/0.6/r3 -> 18/5/0.9/r3. Expensive enough to matter, bigger role than strike. |
| psi_storm | Cone panic wave | 18 dmg / 12 PSI / 1.4 cd | 10/10/1.0 -> 18/12/1.4. Requires later level/INT or stabilizer support. |
| psi_brainburn | Level-gated execution | 10 PSI / 1.2 cd | 8/1.0 -> 10/1.2. One base-pool cast, still level-gated by system. |
| psi_madness | Mid-cost crowd chaos | 7 PSI / 0.9 cd / 15s | 5/0.8 -> 7/0.9. Base player can cast once and still feel exposed. |
| psi_control | Expensive ally turn | 12 PSI / 1.0 cd / 15s | 8/0.8 -> 12/1.0. Moved above base pool so INT matters. |
| psi_phase | Expensive traversal escape | 12 PSI / 0.7 cd / 15s | 8/0.5 -> 12/0.7. No free early wall-walk chain. |
| psi_mark | Teleport setup | 4 PSI / 0.4 cd | 3/0.3 -> 4/0.4. Mark plus recall costs 8 of base 10. |
| psi_recall | Teleport payoff | 4 PSI / 0.4 cd | 3/0.3 -> 4/0.4. Keeps utility strong but not free. |
| psi_beam | Expensive beam pulse | 20 dmg / 6 PSI / 0.35 cd | 15/3/0.05 -> 20/6/0.35. Converted from near-unusable drain spike into costly pulses. |
| psi_concrete_splinter | Mid bolt | 22 dmg / 3 PSI / 0.55 cd | 18/2/0.4 -> 22/3/0.55. More punch, less spam. |
| psi_shadow_lance | Fast strong bolt | 42 dmg / 5 PSI / 0.75 cd | 32/4/0.55 -> 42/5/0.75. High single-target tier. |
| psi_order_seal | Small precise AoE seal | 30 dmg / 7 PSI / 1.1 cd / radius 2 | 24/5/0.8/r2 -> 30/7/1.1/r2. Smaller but stronger than rupture. |
| psi_void_needle | Rare late precision | 80 dmg / 9 PSI / 1.35 cd | 70/7/1.2 -> 80/9/1.35. One-shot base pool spend. |
| psi_meat_hook | Heavy slow organic bolt | 34 dmg / 4 PSI / 0.9 cd | 26/3/0.65 -> 34/4/0.9. Slower, cheaper alternative to lance. |
| psi_siren_pulse | PSI mini-AoE projectile | 28 dmg / 6 PSI / 1.0 cd / radius 2 | 10/9/1.0 storm effect -> projectile AoE. Removed duplicate storm behavior. |

## Duplicate Audit

- Makarov, homemade pistol, TT, and Nagant are no longer a flat pistol ladder: Makarov is cheap/accurate starter, homemade is inaccurate 9mm burst, TT uses scarcer 7.62 TT, Nagant is slow and precise.
- Shotgun and TOZ were near duplicates by shell role. The obrez is now the wide corridor stopper; TOZ is slower, tighter, and higher pellet count.
- PPSh, AK-47, and machinegun separate by resource and control: PPSh burns 9mm, AK hits harder with rare 7.62, machinegun burns belts with high spread.
- Nailgun and harpoon gun are industrial weapons now: nails/harpoons spawn only from production pools and the weapons trade fire rate for precision or heavy single shots.
- Energy tier is resource-bound: energy cells no longer spawn from broad storage/production pools and are HQ-only random loot plus authored drops/rewards. Plasma is no longer the obvious top DPS; gauss and BFG carry late-tier burst roles.
- PSI storm and siren pulse were mechanical near-duplicates because both used `psiEffect: 'storm'`. Siren pulse is now a projectile AoE, while storm remains the cone wave.
- Melee weapons still have some close DPS values by design, but each near value is separated by reach, durability, or swing speed: bayonet speed, fire hook reach, crowbar durability, sledgehammer burst, chair fragility.

## Starter Pressure

The first plot reward in `src/data/plot.ts` remains outside AG32 write scope and still gives Makarov plus 8 rounds. The armory counter was reduced from 16 to 8 rounds, so the immediate tutorial stock is now 16 direct rounds if the player completes the first quest and loots the counter. With Makarov at 18 damage and slower 0.45 cooldown, that is useful training/survival ammo but not enough to clear zones.

## Validation

- Baseline before edits: `npm run typecheck` passed.
- Post-edit `npm run typecheck` did not stay stable because other dirty-tree edits changed during the pass. Observed unrelated failures included `src/main.ts` unused projectile feedback helpers, `src/data/contracts.ts` contract typing, then `src/render/map_ui.ts` and `src/systems/quests.ts`.
- Required final `npm run check` failed at typecheck with current unrelated errors:
  - `src/gen/maintenance/water_bridge.ts(28,9): error TS6133: 'ci' is declared but its value is never read.`
  - `src/render/map_ui.ts(51,40): error TS18048: 'state' is possibly 'undefined'.`

