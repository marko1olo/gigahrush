# Items 2: Liquidator Weapons, Ammo And Combat Roles

Status: parallel implementation plan, not shipped behavior. Created 2026-05-24 for a future GPT-5.5 worker.

This worker owns physical weapons, ammo, weapon role tiers and combat-facing liquidator equipment. Do not add broad PPE, documents or NII samples here unless they are required as ammo/weapon access tokens.

## Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `src/data/items.ts`
- `src/data/weapons.ts`
- `src/data/psi.ts`
- `src/data/resources.ts`
- `src/systems/inventory.ts`
- `src/render/sprite_index.ts`
- `tests/data-ids.test.ts`
- `tests/inventory-rpg.test.ts`

Useful sources:

- Archive liquidator equipment and weapon categories: https://samosborarchive.fandom.com/ru/wiki/Ликвидаторы
- Samosbor wiki liquidator unit types and engineer-assault gear: https://samosb0r.fandom.com/ru/wiki/Ликвидаторы
- GUSL index and weapon/equipment classes: https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- Minecraft item category: https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы
- Minecraft pages: `Грабли`, `Автомат Ералашникова`, `Кустарный пистолет`, `Пистолет Каркарова`, `Винтовка Москвина`, `Кинжал из плоти`, `Костный кинжал`

## Ownership

Preferred write set after orchestrator approval:

- New pack file if pack registry exists: `src/data/item_packs/weapons_ammo.ts`
- New weapon pack if registry exists: `src/data/weapon_packs/liquidator_weapons.ts`
- Otherwise narrow additions to `src/data/items.ts` and `src/data/weapons.ts`
- Optional `src/data/resources.ts` for ammo/fuel mappings
- Optional `src/render/sprite_index.ts` only for a generic projectile/sprite channel approved by orchestrator

Do not edit:

- `src/main.ts`
- `src/core/world.ts`
- `src/render/webgl.ts` unless orchestrator explicitly assigns a generic projectile/render hook

## Current Weapon Baseline

Existing physical weapons already cover:

- melee: `knife`, `wrench`, `pipe`, `rebar`, `axe`, `chainsaw`, `hammer`, `crowbar`, `sledgehammer`, `fire_hook`, `entrenching_spade`, `bayonet`, `chain`, `metal_chair`
- sidearms: `makarov`, `tt_pistol`, `nagant`, `homemade_pistol`
- shotguns: `shotgun`, `toz_shotgun`
- automatic/heavy: `ppsh`, `ak47`, `machinegun`
- industrial/special: `nailgun`, `harpoon_gun`, `flamethrower`, `grenade`
- rare energy: `gauss`, `plasma`, `bfg`, `gravity_beam_emitter`

Do not add a duplicate unless it changes player decisions through ammo economy, legality, reach, spread, speed, collateral risk, permit path, production path or counterplay.

## Existing Items To Improve, Not Break

| Existing id | Keep | Improvement angle |
| --- | --- | --- |
| `shotgun` | Current generic sawed-off. | Keep as civilian short shotgun; add `chizh3_shotgun` as official pump if implemented. |
| `toz_shotgun` | Existing long shotgun sidegrade. | Use as hunting/civilian base, not liquidator ЧИЖ. |
| `homemade_pistol` | Already matches кустарный pistol motif. | Improve access through blueprint/ammo production, not duplicate. |
| `flamethrower` | Existing generic fire weapon. | Reframe as civilian/industrial flame tool; add ROKS only if stat/access differ. |
| `grenade` | Existing explosive projectile. | Use as base for foam/breach variants only if generic projectile support exists. |
| `harpoon_gun` | Existing industrial projectile weapon. | Can represent rail/bolt roles before adding many rifles. |
| `gravity_beam_emitter` | Existing rare deletion beam. | Keep unique; do not obsolete with generic gravity guns. |
| `ammo_shells` | Existing shotgun ammo. | Specialty shells need a generic ammo selection plan or separate weapon entries. |
| `ammo_fuel` | Existing fuel ammo. | Map napalm/ROKS/SHMK carefully. |
| `ammo_energy` | Existing rare energy ammo. | Keep rare; do not make all prototypes use it freely. |

## Candidate Backlog

Target this stream: 35-50 accepted entries or improvements. Split into a first implementation wave of 20-24 if code pressure is high.

| Mode | Proposed id | Russian name | Type | Role | Reachability | Implementation note |
| --- | --- | --- | --- | --- | --- | --- |
| new | `liquidator_rake` | Грабли ликвидатора 0Г15 | WEAPON | Iconic cleanup reach melee | Liquidator lockers/contracts | Keep weaker than `fire_hook`, add slime-clean tags. |
| new | `rusty_rake` | Ржавые грабли | WEAPON | Bad early reach weapon | Storage/abandoned cells | Upgrade or trade into official rake. |
| improve | `bayonet` | Штык | WEAPON | Existing reach melee | Current item | Could become rifle attachment fiction without attachment system. |
| new | `rake_bayonet` | Штык-грабли | WEAPON | Weird rifle fallback | Rare liquidator stash | Implement as standalone melee unless attachment system exists. |
| new | `liquidator_axe` | Топор ликвидатора | WEAPON | Heavy door/body/slime work | HQ/cleanup rooms | Sidegrade to `axe`, more durability, slower. |
| new | `shock_baton` | Шоковая дубинка | WEAPON | Human control, low monster damage | OVB/HQ/black market | Stun only through generic status if available. |
| new | `rubber_club` | Резиновая дубинка | WEAPON | Nonlethal-ish crowd control | HQ/Ministry | Low damage, high knockback. |
| improve | `homemade_pistol` | Кустарный пистолет | WEAPON | Existing craft pistol | Current item | Add blueprint/ammo source through items_5. |
| new | `karkarov_pistol` | Пистолет Каркарова | WEAPON | Official weak service pistol | Liquidator trade/permit | Sidegrade to `makarov`, less value or different spread. |
| new | `zatychkin_pistol` | Пистолет Затычкина | WEAPON | Burst sidearm / officer loot | OVB/officer stash | Use existing projectile behavior. |
| new | `slyoznev_pps41` | ППС-41 Слизнёва | WEAPON | Early SMG, fast ammo burn | Liquidator recruit stash | Sidegrade to `ppsh`; no heat unless generic. |
| new | `eralashnikov_auto` | Автомат Ералашникова | WEAPON | Main liquidator automatic rifle | Permit/HQ/black market | Use `ammo_762` or new rifle ammo only if resource mapped. |
| improve | `ak47` | Калашников | WEAPON | Existing automatic rifle | Current item | Keep as old-world analogue; don't duplicate if Ералаш uses same role. |
| new | `party_might_launcher` | Подствольник «Мощь партии» | WEAPON | Rifle grenade / breach mod | Rare liquidator stash | Model as standalone launcher if no attachments. |
| new | `nosin_rifle` | Винтовка Носина | WEAPON | Militia bolt rifle | Opolchenets/civilian stash | Slow, cheap ammo. |
| new | `moskvin_rifle` | Винтовка Москвина | WEAPON | Slow accurate liquidator rifle | 3rd-rank liquidator trade | Must differ from `nagant` and `harpoon_gun`. |
| new | `losyash_rifle` | Винтовка Лосяша | WEAPON | Rare anti-elite bolt/rail rifle | Deep route, recon stash | Could reuse harpoon projectile. |
| new | `tanev_svt40` | СВТ-40 Танева | WEAPON | Endgame sniper fantasy | Unique route/quest | Defer if cover penetration would require red files. |
| new | `chizh3_shotgun` | ЧИЖ-3 | WEAPON | Official pump shotgun | Liquidator permit/stash | Treat as shotgun source variant per `items.md`. |
| new | `conscripts_doublebarrel` | Двустволка срочника | WEAPON | Low-tier two-shot shotgun | Militia/civilian stash | Could be `toz_shotgun` reframe if redundant. |
| new | `rb91_auto_shotgun` | РБ-91 | WEAPON | Veteran semi-auto shotgun | Rare HQ/black market | High shell burn, strong recoil/spread. |
| new | `granit4u_belt_shotgun` | «Гранит»-4у | WEAPON | Crowd-control shotgun | Deep liquidator reward | Balance via reload/cooldown, no free dominance. |
| new | `pushkin_shotgun` | Ружьё «Пушкин» | WEAPON | Tactical shotgun shell platform | Rare | Only after ammo-selection decision. |
| new | `ptrs_liquidator` | ПТРС ликвидатора | WEAPON | Anti-armor/boss rifle | Route or mounted encounter | Defer unless heavy weapon handling is generic. |
| new | `rpl23_lmg` | РПЛ-23 Лёшкинского | WEAPON | Squad LMG | Deep HQ/engineer route | High ammo burn, heavy value. |
| new | `p41_heavy_mg` | 6П41 пулемёт | WEAPON | Engineer HMG | Exosuit/stationary only | Defer if movement support is absent. |
| new | `g41_grenade_launcher` | 5Г41 станковый гранатомёт | WEAPON | Mounted grenade launcher | Authored route floor | Stationary content, not generic loot. |
| new | `pistol_grenade_launcher` | Пистолет-гранатомёт | WEAPON | Unstable militia rare | Militia stash | Single shot, high self-risk. |
| improve | `flamethrower` | Огнемёт | WEAPON | Existing fire clear | Current item | Keep as generic/industrial baseline. |
| new | `roks47_flamethrower` | РОКС-47 | WEAPON | Signature backpack napalm | Liquidator permit/stash | Stronger fuel economy, heavier value. |
| new | `shmk_disposable` | ШМК | WEAPON | Single-use room fire panic clear | Rare sealed crate | Stack 1 or self-ammo; high collateral event. |
| new | `agnia_a130` | А-130 «Агния» | WEAPON | Sanitary corridor flamethrower | Maintenance/HQ | Sidegrade to `flamethrower`; lower damage, better cleanup tags. |
| new | `o15_multijet_flamer` | 6О15-УТТХ | WEAPON | Engineer breach flamethrower | Deep engineer stash | Defer if too dominant. |
| new | `ato41_atomic_flamer` | АТО-41 | WEAPON | Endgame door/slime cutter | Unique route | Needs strict cap and collateral. |
| new | `brt2_foam_projector` | БРТ-2 бетономёт | WEAPON | Foam terrain/immobilizer | Engineer route | Needs generic temporary-block/slow effect. |
| new | `foam_grenade_6p10` | Пенобетонная граната 6П10 | WEAPON | Throwable control | Liquidator crates | If no foam geometry, make slow/stun grenade. |
| new | `pbrog1_foam_launcher` | ПБРОГ-1 | WEAPON | One-shot ranged foam | Rare engineer crate | Model as launcher, not ammo subtype first. |
| new | `breach_charge` | Пробивной заряд | WEAPON | Door/wall/biomass breach | Engineer stash/factory | Bounded use only, publish event. |
| new | `concrete_breaker_grenade` | Бетонобойная граната | WEAPON | Breach grenade | Engineer stash | Avoid full-world damage scans. |
| new | `chest_failsafe_charge` | Фугасный нагрудный заряд | WEAPON | Last-resort consequence item | Story/rare | Likely defer for quest content. |
| new | `grn420_gravizhernov` | Гравижернов ГРН-420 | WEAPON | Heavy gravity AOE | Unique route/boss | Existing `gravity_beam_emitter` may already cover role. |
| new | `tracked_zhernov` | Гусеничный жернов | WEAPON | Regenerator finisher | Authored route machine | Better as POI interaction than inventory item. |
| new | `ammo_12g_slug` | Пуля 12 калибра | AMMO | Precise shotgun ammo | Factory/HQ | Requires ammo-selection or weapon-specific entry. |
| new | `ammo_12g_incendiary` | Зажигательная дробь | AMMO | Slime/fungus counterplay | Rare HQ/factory | Maybe map as fuel+shell recipe. |
| new | `ammo_12g_chemical` | Химический патрон 12 калибра | AMMO | NII/liquidator special shell | NII/HQ | Needs generic effect first. |
| new | `ammo_rifle_coupon` | Талон на винтовочные патроны | MISC | Ammo issue gating | HQ/office | May be better than many new ammo ids. |
| new | `napalm_mix` | Напалмовая смесь | AMMO | ROKS/SHMK fuel | Factory/HQ | Map to `fuel`; maybe alias to `ammo_fuel` behavior. |
| new | `empty_roks_tank` | Пустой ранцевый бак | MISC | Flamethrower repair/refill | HQ/factory | Production input. |
| new | `homemade_9mm` | Кустарные 9мм | AMMO | Cheap risky pistol ammo | Factory/black market | Only add misfire if generic; otherwise lower value/spread via weapon. |
| new | `rifle_bolt_pack` | Полимерные болты | AMMO | Лосяш/rail rifle ammo | Deep route/factory | Could reuse `ammo_harpoon` if redundant. |

## Chizh-3 Handling

Sources conflict. Preserve the `items.md` decision unless a stronger project source appears: implement `ЧИЖ-3` as an official pump shotgun/source variant, not a universal assault rifle. If the worker wants a common automatic rifle, use `eralashnikov_auto`.

## Implementation Notes

- Weapon item entry and weapon stats must land together.
- Add `PHYS_WEAPON_ROLE_TIERS` for every physical weapon id.
- Do not copy external numbers. Convert source flavor into existing fields: `dmg`, `speed`, `pellets`, `spread`, `ammoType`, `aoeRadius`, `projType`, `soundId`, `knockback`.
- Specialty ammo is the main risk. If generic ammo selection is not ready, prefer standalone weapons/launchers or data-only ammo tokens for factories/contracts.
- New projectile types require orchestrator approval and browser validation.

## Acceptance Checklist

- Every `ItemType.WEAPON` has `WEAPON_STATS`.
- Every stat id has a matching `ITEMS` entry unless it is the `''` unarmed fallback.
- Every ammo id is `ItemType.AMMO`, `spawnRooms: []`, `spawnW: 0`, resource-mapped and reachable through a concrete path.
- No new red-file gameplay logic.
- Run `npm run check`; run `npm run check:browser` if projectile/render behavior changes.

