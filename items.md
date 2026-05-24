# Items And Weapons Update

Status: design intake for a future implementation pass. Created on 2026-05-24.

This document is not shipped behavior yet. It is a source-backed content and architecture brief for a large items/weapons update. Keep `README.md` factual after implementation; keep this file as the working design map until entries are actually built.

## Goal

Make items and weapons strengthen the expedition loop:

`lead -> prepare -> route -> risk -> fight/trade/steal/repair -> samosbor disruption -> loot -> event -> consequence`

New content should add decisions, not just names. A candidate item only graduates from backlog when it has a role, source, scarcity, reachable loot/trade path, and at least one conflict or counterplay use.

## Current Game Baseline

Verified from current source import on 2026-05-24:

- `ITEMS`: 255 item ids.
- `PHYS_WEAPON_STATS`: 32 physical entries, including unarmed fallback.
- `PSI_WEAPON_STATS`: 16 PSI weapon entries.
- `WEAPON_STATS`: 48 merged entries.
- `RESOURCES`: 17 economy resources.

Primary files:

- `src/data/items.ts`: item definitions, tags, use effects.
- `src/data/weapons.ts`: physical weapon stats and role tiers.
- `src/data/psi.ts`: PSI weapon stats.
- `src/data/resources.ts`: economy scarcity resources.
- `src/data/factories.ts`: production recipes and output access.
- `src/systems/inventory.ts`: inventory categories, item use handlers, weapon readiness.
- `src/systems/containers.ts`: loot and ownership surface.
- `src/systems/events.ts`: public facts for world response.

Current item model is already enough:

```ts
ItemType = FOOD | DRINK | MEDICINE | WEAPON | TOOL | KEY | NOTE | MISC | AMMO
ItemDef = id, name, type, desc, spawnRooms, spawnW, value, tags?, stack?, durability?, use?
```

Do not add a new `ItemType` for this update unless implementation proves the existing tags/use-handler pattern cannot express the gameplay.

## Existing Weapon Roles

Current physical weapons:

- unarmed fallback
- melee: `knife`, `wrench`, `pipe`, `rebar`, `axe`, `chainsaw`, `hammer`, `crowbar`, `sledgehammer`, `fire_hook`, `entrenching_spade`, `bayonet`, `chain`, `metal_chair`
- sidearms: `makarov`, `tt_pistol`, `nagant`, `homemade_pistol`
- shotguns: `shotgun`, `toz_shotgun`
- automatic/heavy: `ppsh`, `ak47`, `machinegun`
- industrial/special: `nailgun`, `harpoon_gun`, `flamethrower`, `grenade`
- rare energy: `gauss`, `plasma`, `bfg`, `gravity_beam_emitter`

Current PSI weapons:

- `psi_strike`, `psi_rupture`, `psi_storm`, `psi_brainburn`
- `psi_madness`, `psi_control`, `psi_phase`, `psi_mark`, `psi_recall`, `psi_beam`
- `psi_concrete_splinter`, `psi_shadow_lance`, `psi_order_seal`
- `psi_void_needle`, `psi_meat_hook`, `psi_siren_pulse`

Design implication: the update should not add ten generic guns. It should add missing roles:

- liquidator cleanup melee
- corridor shotgun lineage
- specialty shells
- single-use panic clear
- foam/concrete control
- legal/illegal access papers
- fuel and filter pressure
- sampleware and proof chain items

## Source Handling

Samosbor sources contradict each other. Treat them as layers:

- Stable motif: repeated across Samosbor wiki/archive or already compatible with GIGAHRUSH.
- Fandom variant: usable when it creates a strong gameplay role.
- Minecraft/game adaptation: useful for item ideas, crafting language and survival texture; do not copy numeric stats directly.
- Thread/fanon/expanded pages: use as rumors, documents, weird variants, or late-route prototypes unless multiple sources agree.

Known conflict:

- `ЧИЖ-3` appears in the user's example as a pistol-machinegun/automatic weapon, but the accessible Samosbor Fandom page describes it as a pump shotgun. For GIGAHRUSH, use the shotgun interpretation because it creates a distinct corridor role and fits the current weapon architecture.

## Hard Rules For New Items

Every proposed item entry must specify:

- `id`: lowercase snake_case.
- player-facing Russian name and one-line tone.
- `ItemType` and tags.
- resource mapping or reason it is outside resources.
- source: rooms, containers, NPC trade, production, contract, samosbor aftermath, monster counterplay, route floor or unique one-per-run.
- scarcity label expressed through `spawnW`, `value`, container access, resource pressure, route depth or production output, not a new rarity field.
- one player decision: buy, steal, repair, burn, seal, forge, report, hide, trade, use as bait, save for later.
- implementation path: data-only, weapon stats, use handler, production recipe, container set, quest/contract, event, or route-floor content.

Reject:

- items with no reachable loot/trade/use path
- hundreds of near-duplicate guns
- armor systems before a narrow protective use exists
- per-frame gas/fluid/global contamination simulation
- global crafting UI
- runtime population refill
- renderer-owned gameplay state
- content-specific logic in `main.ts`, `core/world.ts` or `render/webgl.ts`

## Scarcity Labels

Use labels in design, but implement them with existing data:

| Label | Implementation levers | Examples |
| --- | --- | --- |
| Бытовое | public containers, `spawnW > 0`, low value | cloth, water, knife, chalk |
| Дефицитное | resource pressure, owned room, mid value | filters, bandages, ammo, sealant |
| Уставное | faction/locked containers, permits, liquidator trade | Chizh-3, ROKS fuel, issue cards |
| Контрабанда | secret/black market, forged papers, audit risk | shocker, homemade ammo, scrubbed serial plate |
| НИИ/аномальное | route/design-floor gated, sample forms, high value | slime sampleware, PSI, energy cells |
| Уникальное | one-per-run, route quest, no generic spawn | GBE, gravizhornov proof item |

## Lore-To-Gameplay Map

### Liquidator Cleanup

Source motifs: liquidators clean up monsters, slime, corpses and abandoned gear after samosbor; they use protective suits, gas masks, rakes, axes, shotguns, flamethrowers, UV spotlights, explosives and containment tools.

Game direction:

- Make liquidator equipment about cleanup and containment first, DPS second.
- Tie it to samosbor aftermath, Maintenance cleanup rooms, `slime_nii`, black market leakage and Ministry papers.
- Use events for cleanup, sample handoff, confiscation, forged permits and collateral damage.

### Slime And Samples

Source motifs: slime is toxic; colors have different properties; napalm/cleanup is needed before handling; samples can be science, contraband or evidence.

Game direction:

- Existing slime sample items are strong. Expand with sampleware and chain-of-custody items rather than more colors.
- Sealed samples should be valuable and legal in NII paths.
- Contaminated/open samples should become lower-value contraband, bait, poison, audit risk or quest failure material.

### Gigastructure Economy

Source motifs: coupons, command economy, secondary-material production, black market and barter.

Game direction:

- Keep ruble-like `value` as current game abstraction, but write item fiction as coupons, permits, issue cards and barter.
- Let scarcity affect water, medicine, ammo, documents, filters, fuel and samples.
- Use `black_market_88`, Ministry weapon permits and production recipes for access tension.

## MVP Package

First implementation wave should target 25-35 items, not a giant registry dump.

### Survival And Tools

| Proposed id | Name | Type | Role | Source/use |
| --- | --- | --- | --- | --- |
| `liquidator_rake` | Грабли ликвидатора | WEAPON or TOOL+WEAPON | long melee/control, slime cleanup identity | Liquidator containers, cleanup contracts; should not outclass `fire_hook` |
| `rusty_rake` | Ржавые грабли | WEAPON | cheap bad cleanup/melee starter | abandoned cells, low durability |
| `liquidator_gasmask` | Противогаз ликвидатора | TOOL | protective prep token | future use-handler against gas/smog checks; no armor system yet |
| `filter_canister` | Фильтр-канистра | MISC | consumable filter pressure | resource `tools` or future `filters`; used by smog/quarantine content |
| `wet_rag_bundle` | Мокрая тряпичная связка | MISC | cheap emergency gas/smoke mitigation | kitchens/bathrooms; short-lived alternative to real filters |
| `asbestos_seal_cord` | Асбестовый уплотнительный шнур | MISC | hermetic repair input | similar to existing `asbestos_cord`, only add if distinct recipe exists |
| `sealed_sample_jar` | Опломбированная банка для пробы | MISC | sampleware | NII, cleanup rooms, slime collection |
| `slime_zinc_bucket` | Цинковое ведро для слизи | MISC | cleanup proof / heavy loot | liquidation aftermath, turn in to liquidators or NII |
| `decon_fluid` | Обеззараживающая жидкость | MISC | cleanup consumable | Maintenance/medical/liq stashes; event on use |

### Weapons

| Proposed id | Name | Type | Role | Implementation path |
| --- | --- | --- | --- | --- |
| `chizh3_shotgun` | ЧИЖ-3 | WEAPON | official liquidator pump shotgun, corridor stopper | new `WeaponStats`; access through permits/liquidators |
| `rb91_auto_shotgun` | РБ-91 | WEAPON | rare semi-auto shotgun, high shell burn | locked liquidator/black-market route |
| `shock_baton` | Шоковая дубинка | WEAPON | control/interrupt sidegrade, weak damage | reuse melee, add stun only if generic |
| `foam_grenade` | Пенограната 6П10 | WEAPON or AMMO | nonlethal control, temporary blockage/slow | grenade-like projectile; bounded geometry/status effect |
| `shmk_launcher` | ШМК | WEAPON | single-use fire panic clear | stack 1, ammoType self or `ammo_fuel`, high collateral |
| `roks47_flamethrower` | РОКС-47 | WEAPON | lore/flamethrower sidegrade, backpack napalm | either rename/faction variant of `flamethrower` or separate high-fuel weapon |
| `breach_charge` | Пробивной заряд | WEAPON or TOOL | door/wall/biomass breach, high noise | bounded placement/use; publishes collateral event |
| `moskvin_rifle` | Винтовка Москвина | WEAPON | slow accurate rifle, ammo economy | add only if it differs from `nagant`/`gauss`/`ak47` |
| `ptrs_liquidator` | ПТРС ликвидатора | WEAPON | anti-armor, prone/heavy fantasy | defer until heavy-weapon movement/cooldown risk is generic |

### Ammo And Resources

| Proposed id | Name | Type | Role |
| --- | --- | --- | --- |
| `ammo_12g_slug` | Пуля 12 калибра | AMMO | precise shotgun anti-armor |
| `ammo_12g_incendiary` | Зажигательная дробь | AMMO | slime/fungus counterplay, fire risk |
| `ammo_12g_chemical` | Химический патрон 12 калибра | AMMO | NII/liquidator special shell |
| `napalm_mix` | Напалмовая смесь | AMMO or MISC | ROKS/SHMK fuel input |
| `empty_fuel_tank` | Пустой ранцевый бак | MISC | production/repair input |
| `homemade_9mm` | Кустарные 9мм | AMMO | cheap unreliable ammo; only if misfire/spread can be generic |
| `barrel_blank` | Заготовка ствола | MISC | armory production input |
| `scrubbed_serial_plate` | Сбитая номерная планка | MISC | contraband/audit marker |

### Documents And Access

| Proposed id | Name | Type | Role |
| --- | --- | --- | --- |
| `liquidator_issue_card` | Карточка выдачи ликвидатора | MISC | legal access to one locked stash |
| `weapon_checkout_tag` | Оружейная бирка | MISC | weapon crate audit proof |
| `sample_chain_form` | Бланк цепочки пробы | MISC | makes sample legal/valuable |
| `confiscation_tag` | Бирка конфиската | MISC | turn illegal item into faction relation choice |
| `gusl_index_page` | Страница индекса ГУСЛ | NOTE or MISC | lore/access clue; identifies equipment tiers |
| `nii_sample_label` | Наклейка НИИ для пробы | MISC | turns jar+sample into official handoff |

### Trade And Contraband

| Proposed id | Name | Type | Role |
| --- | --- | --- | --- |
| `stolen_filter_pack` | Краденая пачка фильтров | MISC | cheap survival vs audit risk |
| `black_market_shells` | Чёрнорыночная дробь | AMMO | expensive shell source with heat |
| `blueprint_weapon_t2` | Чертёж оружия Т2 | MISC | access token for armory recipe |
| `contraband_shocker_parts` | Детали шокера | MISC | production/black-market bridge |

## Existing Items To Reframe Before Adding Duplicates

Prefer reusing or renaming in descriptions before adding duplicates:

- `flamethrower`: can become generic civilian/field flame thrower while `roks47_flamethrower` is liquidator-grade, or simply get ROKS fiction if no new stats are needed.
- `shotgun` and `toz_shotgun`: decide whether `chizh3_shotgun` is a new stat entry or a lore rename of the pump/official variant.
- `homemade_pistol`: already covers the Minecraft/custom pistol fantasy; add blueprints and ammo only if factories/contracts use them.
- `uv_spotlight`: already implemented and should be integrated into more monster/slime counterplay rather than duplicated.
- `gravity_beam_emitter`: already covers rare gravitational deletion-beam fantasy; use `gravizhornov` as stationary POI/prototype lore, not another handheld BFG.
- `gasmask_filter`, `filter_layer`, `hermo_gasket`, `asbestos_cord`, `sealant_tube`: already present as repair/protection components. Add variants only when they create a real route decision.

## Resource And Factory Updates

Do not add a standalone crafting UI for this wave. Route new craft/repair content through existing production surfaces.

Candidate resource pressure:

- `fuel`: currently narrow. Add `napalm_mix`, `empty_fuel_tank` and ROKS/SHMK recipes if fire weapons become a real preparation choice.
- `ammo`: expand with shell subtypes only if weapon code supports selecting or consuming variants cleanly.
- `tools`: keep filters/sealants here at first unless a measured need for separate `filters`/`sealants` resource appears.
- `slime_samples`: add sampleware and official labels before adding more sample colors.
- `documents`: already broad; new forms must unlock access, alter audit risk or complete contracts.
- `contraband`: link illegal weapons/ammo to `black_market_88`, forged permits and confiscation choices.

Factory hooks:

- `armory_bench`: repair/build Chizh-3, load shells, repair ROKS, assemble shock baton.
- `illegal_ammo_smelter`: homemade 9mm, black-market shells, scrubbed serial plate.
- `utility_room` or metal shop: foam grenade body, breach charge casing, door/seal kits.
- NII/slime floors: sealed jars, sample labels, decon fluid, contaminated batch.
- Liquidator HQ/stashes: issue cards, checkout tags, ROKS fuel, filters.

## Loot And Route Placement

Each item family needs one legal and one risky path.

| Family | Legal path | Risky path |
| --- | --- | --- |
| Chizh-3 / shells | Ministry weapon permit, Barni/liquidator issue | black market, weapon crate theft |
| ROKS / napalm | liquidator cleanup contract | stolen fuel tank, unsafe recipe |
| sampleware | NII request, quarantine pass | hidden camera, black-market sample buyer |
| filters/gasmask | medical/liq store, repair reward | stolen pack, abandoned infected room |
| foam/breach charges | engineering cleanup assignment | cult/raider stash, illegal ammo smelter |
| documents/forms | Ministry bureau | forged stamp room, black market |

Recommended route anchors:

- `LIVING`: Barni armory range, expedition prep, OBZh/shelter repairs.
- `MINISTRY`: weapon permit bureau, archive/audit documents, legal/forged papers.
- `MAINTENANCE`: cleanup rooms, brown slime, pressure/steam, industrial components.
- `slime_nii`: sampleware, NII labels, quarantine passes, decon fluid.
- `black_market_88`: illegal shells, stolen filters, scrubbed serials, contraband weapons.
- Procedural floors: aftermath caches, emergency lockers, route-risk variants.
- Samosbor aftermath: broken gear, slime buckets, contaminated papers, sealed/unsealed samples.

## Candidate Implementation Order

1. Data-only doc-backed pass:
   - add item definitions for 10-15 low-risk `MISC`/`AMMO`/document entries;
   - map them to `RESOURCES`;
   - add one or two factory recipes;
   - add container/contract references.

2. Weapon-role pass:
   - decide Chizh-3 vs existing shotguns;
   - add one new shotgun role and one foam/control throwable;
   - add tests for `WEAPON_STATS` and item references.

3. Cleanup/samosbor pass:
   - add `liquidator_rake` and sampleware uses;
   - wire one cleanup contract or Maintenance room;
   - publish events for legal handoff, stolen sample and contaminated sample.

4. Route economy pass:
   - integrate black market and Ministry permit paths;
   - make fuel, shells and filters visible in preparation summaries/rumors.

5. Rare/prototype pass:
   - ROKS/SHMK and stationary Жернов/Грави-жернов only after the basic loop is readable.

## Testing And Validation Expectations

For implementation PRs:

- data-only item additions: `npm run typecheck`, prefer `npm run check:readonly`.
- weapons, inventory, economy, quests, interactions or generation: `npm run check`.
- render/HUD/browser feedback: `npm run check:browser` when Chrome is available.
- add or update tests for:
  - every weapon item has `WEAPON_STATS`;
  - every ammo id is referenced by a weapon or resource;
  - every resource item exists;
  - every contract/container reward item exists;
  - no new item is unreachable if it is marked MVP.

## Source Links

External research used:

- Samosbor Archive: Liquidators: https://samosborarchive.fandom.com/ru/wiki/%D0%9B%D0%B8%D0%BA%D0%B2%D0%B8%D0%B4%D0%B0%D1%82%D0%BE%D1%80%D1%8B
- Samosbor Fandom: Liquidators: https://samosbor.fandom.com/ru/wiki/%D0%9B%D0%B8%D0%BA%D0%B2%D0%B8%D0%B4%D0%B0%D1%82%D0%BE%D1%80%D1%8B
- Samosbor Fandom: Samosbor: https://samosbor.fandom.com/ru/wiki/%D0%A1%D0%B0%D0%BC%D0%BE%D1%81%D0%B1%D0%BE%D1%80
- Samosbor Fandom: Gigastructure economy: https://samosbor.fandom.com/ru/wiki/%D0%93%D0%B8%D0%B3%D0%B0%D1%85%D1%80%D1%83%D1%89%D1%91%D0%B2%D0%BA%D0%B0
- Samosbor Fandom: Samosbor aftermath/slime: https://samosbor.fandom.com/ru/wiki/%D0%9F%D0%BE%D1%81%D0%BB%D0%B5%D0%B4%D1%81%D1%82%D0%B2%D0%B8%D1%8F_%D1%81%D0%B0%D0%BC%D0%BE%D1%81%D0%B1%D0%BE%D1%80%D0%B0
- ShoutWiki liquidator equipment/index/protocols: https://samosbor.shoutwiki.com/wiki/%D0%9B%D0%B8%D0%BA%D0%B2%D0%B8%D0%B4%D0%B0%D1%82%D0%BE%D1%80%D1%8B
- Minecraft adaptation item category: https://samosborminecraft.fandom.com/ru/wiki/%D0%9A%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D1%8F:%D0%9F%D1%80%D0%B5%D0%B4%D0%BC%D0%B5%D1%82%D1%8B
- Minecraft adaptation: Rake: https://samosborminecraft.fandom.com/ru/wiki/%D0%93%D1%80%D0%B0%D0%B1%D0%BB%D0%B8
- Minecraft adaptation: Homemade pistol: https://samosborminecraft.fandom.com/ru/wiki/%D0%9A%D1%83%D1%81%D1%82%D0%B0%D1%80%D0%BD%D1%8B%D0%B9_%D0%BF%D0%B8%D1%81%D1%82%D0%BE%D0%BB%D0%B5%D1%82
- Minecraft adaptation: Sound emitter: https://samosborminecraft.fandom.com/ru/wiki/%D0%97%D0%B2%D1%83%D0%BA%D0%BE%D0%B8%D0%B7%D0%BB%D1%83%D1%87%D0%B0%D0%B5%D1%82%D0%B5%D0%BB%D1%8C
- Minecraft adaptation: Fibrous capsule: https://samosborminecraft.fandom.com/ru/wiki/%D0%A4%D0%B8%D0%B1%D1%80%D0%BE%D0%B7%D0%BD%D0%B0%D1%8F_%D0%BA%D0%B0%D0%BF%D1%81%D1%83%D0%BB%D0%B0
- Minecraft adaptation: Pill jar: https://samosborminecraft.fandom.com/ru/wiki/%D0%91%D0%B0%D0%BD%D0%BA%D0%B0_%D1%81_%D1%82%D0%B0%D0%B1%D0%BB%D0%B5%D1%82%D0%BA%D0%B0%D0%BC%D0%B8
- Minecraft adaptation: Blueprints: https://samosborminecraft.fandom.com/ru/wiki/%D0%A7%D0%B5%D1%80%D1%82%D0%B5%D0%B6%D0%B8

Local source map:

- `README.md`
- `architecture.md`
- `desdoc.md`
- `src/core/types.ts`
- `src/data/items.ts`
- `src/data/weapons.ts`
- `src/data/psi.ts`
- `src/data/resources.ts`
- `src/data/factories.ts`
- `src/systems/inventory.ts`
- `Docs/DesignFloors/black_market_88.md`
- `Docs/DesignFloors/rework_floor_20_slime_nii.md`
