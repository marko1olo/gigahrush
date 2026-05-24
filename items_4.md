# Items 4: NII Sampleware, Slime, Medicine, Food And Anomaly Loot

Status: parallel implementation plan, not shipped behavior. Created 2026-05-24 for a future GPT-5.5 worker.

This worker owns NII sample chain, slime/gas/fog/anomaly samples, medical consumables, hygiene and survival food. Cleanup field gear belongs to `items_1.md`; bureaucracy belongs to `items_3.md`.

## Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `src/data/items.ts`
- `src/data/resources.ts`
- `src/data/monster_ecology.ts`
- `src/systems/inventory.ts`
- `src/systems/psi.ts`
- `src/gen/hell/psi_meat_cache.ts`
- `tests/data-ids.test.ts`
- `tests/inventory-rpg.test.ts`

Useful sources:

- Archive slime: colors/age effects, NII study, heat/freeze/pressure notes: https://samosborarchive.fandom.com/ru/wiki/Слизь
- Archive NII: research institution context: https://samosborarchive.fandom.com/ru/wiki/НИИ
- Archive gas: aftermath gas source for sample ideas: https://samosborarchive.fandom.com/ru/wiki/Газ
- Samosbor basics: food/water ration and mold-based concentrates: https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- Samosbor concentrate: general and nutritious concentrate: https://samosb0r.fandom.com/ru/wiki/Концентрат
- Minecraft item category and medicine pages: https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы

## Ownership

Preferred write set after orchestrator approval:

- New pack file if pack registry exists: `src/data/item_packs/nii_sampleware.ts`
- Otherwise narrow additions to `src/data/items.ts`
- Optional generic use handler: `src/systems/sampleware_items.ts`
- Optional resource mapping in `src/data/resources.ts`
- Optional reachability through NII/slime/medical route modules only if existing paths are insufficient

Do not edit:

- broad samosbor runtime
- monster AI
- save payload unless persistent sample state is added

## Existing Items To Improve, Not Break

| Existing id | Keep | Improvement angle |
| --- | --- | --- |
| `slime_sample_brown` | Existing sample lane. | Add better handoff/research roles through sampleware. |
| `slime_sample_green` | Existing acid sample. | Keep high danger; no generic use spam. |
| `slime_sample_white` | Existing mutagen sample. | Preserve no-look/mutation flavor through tags. |
| `slime_sample_red` | Existing adhesive/trap sample. | Pair with trap/solvent future work. |
| `slime_sample_black` | Existing UV/mass sample. | Pair with `uv_spotlight`. |
| `slime_sample_blue` | Existing glow sample. | Keep energy/PSI relation. |
| `blue_glow_sample_sealed` | Existing sealed/use item. | Preserve sealed vs opened value decision. |
| `blue_glow_sample_open` | Existing opened/use item. | Keep risky use role. |
| `slime_sample_silver` / `slime_sample_silver_open` | Existing deceptive sample pair. | Do not duplicate transparent/silver sample. |
| `slime_sample_seroburmaline` | Existing void/PSI sample. | Use as high-tier NII path. |
| `nii_sample_container` | Existing empty sampleware. | Expand chain with labels/forms, not duplicate jar. |
| `psi_stabilizer` | Existing PSI medicine. | Use as baseline for stronger/weirder PSI meds. |
| `antifungal_ointment` | Existing fungus medicine. | Good anchor for mold/fungal medical loop. |
| `zhelemish_*` | Existing food/sample lane. | Preserve treated/contaminated decisions. |

## Candidate Backlog

Target this stream: 35-45 accepted entries or improvements.

| Mode | Proposed id | Russian name | Type | Role | Reachability | Implementation note |
| --- | --- | --- | --- | --- | --- | --- |
| improve | `nii_sample_container` | Тара НИИ для пробы | MISC | Official sample container | Existing item | Keep as base for sample chain. |
| new | `empty_sample_jar` | Пустая банка для пробы | MISC | Cheap unofficial sampleware | Medical/storage | Lower value, breaks legal handoff. |
| new | `sealed_sample_jar` | Опломбированная банка для пробы | MISC | Official sealed sampleware | NII/medical/HQ | Maybe alias to existing `nii_sample_container`; dedupe first. |
| new | `cracked_sample_jar` | Треснувшая банка для пробы | MISC | Bad sample container | Storage/aftermath | Leaks/low value. |
| new | `sterile_swab` | Стерильный мазок | MISC | Small evidence sample | Medical/NII | Stackable sample input. |
| new | `contaminated_swab` | Загрязнённый мазок | MISC | Failed handling output | Use handler/event | Low-value evidence. |
| new | `sample_cork_seal` | Пробковая пломба | MISC | Sealing consumable | Office/medical | Pairs with sample jar. |
| new | `glass_ampoule_empty` | Пустая ампула | MISC | Medicine/sample input | Medical/NII | Generic component. |
| new | `gas_sample_ampoule` | Ампула газовой пробы | MISC | NII gas evidence | Gas aftermath/NII | No global gas sim required. |
| new | `slime_age_label_brown` | Бирка молодой слизи | MISC | Sample classification token | NII/cleanup | Could be combined with document item. |
| new | `slime_age_label_orange` | Бирка подростковой слизи | MISC | More dangerous sample proof | NII/cleanup | Source: age/color slime. |
| new | `slime_age_label_violet` | Бирка взрослой слизи | MISC | High-tier dangerous proof | NII/cleanup | Keep rare. |
| new | `slime_calcified_chip` | Окаменевший скол слизи | MISC | Mature/dead slime material | Aftermath/deep route | Good factory/NII input. |
| new | `slime_motor_node` | Моторный узел слизи | MISC | Weird research sample | Rare slime aftermath | Lore from primitive motor. |
| new | `slime_sense_node` | Чувствительный узел слизи | MISC | Echolocation/odor sample | Rare slime aftermath | Could link to detectors later. |
| new | `frozen_slime_core` | Замороженное ядро слизи | MISC | Freezing counterplay proof | Cold route/aftermath | Defer use unless cold system exists. |
| new | `boiled_slime_residue` | Вываренный остаток слизи | MISC | Heat counterplay proof | NII/cleanup | Could be output of decon/heat. |
| improve | `antifungal_ointment` | Противогрибковая мазь | MEDICINE | Existing fungal medicine | Current item | Keep as core fungus counter. |
| new | `anti_spore_inhaler` | Противоспоровый ингалятор | MEDICINE | Respiratory medicine | Medical/NII | One-use PSI/HP or status relief. |
| new | `burn_gel` | Противоожоговый гель | MEDICINE | Fire/slime burn treatment | Medical/HQ | Small HP, tag `burn`. |
| new | `painkiller_pack` | Болеутоляющее | MEDICINE | Aim/move penalty relief | Medical/vending | If no pain status, use small HP + sleep tradeoff. |
| new | `sleeping_pills` | Снотворное «Попобава» | MEDICINE | Forced rest / risk | Medical/black market | Defer if sleep action not generic. |
| new | `antiemetic` | Противорвотное | MEDICINE | Nausea/food preservation | Medical | Useful only with nausea/poison status. |
| new | `sterile_bandage` | Стерильный бинт | MEDICINE | Better bleed/infection care | Medical/craft | If no bleed, higher heal than `bandage`. |
| new | `splint` | Шина | MEDICINE | Fracture/limp treatment | Medical | Defer if no fracture status. |
| new | `syringe_empty` | Пустой шприц | MISC | Injection component | Medical/NII | Use with serum/poison later. |
| new | `permanganate_vial` | Марганцовка | MEDICINE | Poison/injection counter | Medical/storage | Simple medicine until poison exists. |
| new | `technical_spirit` | Технический спирт | MISC | Sterilization/fuel/contraband | Medical/production | Coordinate with items_5 for brewing. |
| new | `cotton_wool` | Вата | MISC | Medical/filter component | Medical/storage | Resource `medicine` or `tools`. |
| new | `soap_72` | Мыло хозяйственное 72% | MISC | Hygiene/decontamination | Bathrooms/vending | Could reduce contamination/parasite later. |
| new | `lice_shampoo` | Шампунь от вшей | MISC | Hygiene/parasite item | Vending/medical | Mostly trade/status future. |
| improve | `grey_briquette` | Концентрат-беляк | FOOD | Existing common concentrate | Current item | Align with source general concentrate. |
| improve | `liquidator_ration` | Черный сухпай ликвидатора | FOOD | Existing high nutrition | Current item | Align with source nutritious concentrate. |
| new | `daily_concentrate` | Пищевой концентрат ежедневный | FOOD | Standard vending ration | Kitchen/vending | Could be alias to `grey_briquette`; dedupe first. |
| new | `white_concentrate` | Белый концентрат | FOOD | Common low-protein ration | Kitchen/vending | Avoid duplicate with `grey_briquette`. |
| new | `black_concentrate` | Чёрный концентрат | FOOD | Worker/liquidator high-calorie ration | HQ/factory | Existing `liquidator_ration` may cover. |
| new | `red_concentrate` | Красный концентрат | FOOD | Premium/bribe ration | HQ/office | Valuable small food. |
| new | `experimental_concentrate` | Несерийный концентрат | FOOD | Random risky ration | NII/factory | Avoid random effects unless bounded and tested. |
| new | `protein_mold_cake` | Плесневой белковый брикет | FOOD | Mold-origin food | Kitchen/fungal zones | Ties setting to food without duplicate. |
| new | `water_reservoir_sample` | Проба воды из резервуара | MISC | Water safety evidence | Bathrooms/kitchens | Works with water system/economy. |
| new | `mutant_tissue_sample` | Образец ткани твари | MISC | Ecology proof | Monster drops/contracts | Coordinate with monster ecology. |
| new | `fibrous_capsule_cut` | Срез фиброзной капсулы | MISC | Meat-block hazard loot | Samosbor aftermath | Good source for blueprints/items_5. |
| new | `frozen_item_shard` | Осколок замороженного предмета | MISC | Ice-block loot residue | Cold/deep route | Unlocks rare recipes. |

## Implementation Notes

- Prefer sealed/open/contaminated pairs only when they change rewards.
- Do not add many slime colors beyond existing samples. Expand handling, labels and sampleware first.
- Medicine can remain simple `use` effects until statuses exist. Avoid adding status systems in this stream unless orchestrator assigns them.
- Food should strengthen ration/economy texture, not replace the current survival loop.
- Use `resourceForItem` mappings for medicine, food, slime samples and NII goods where economy should react.

## Acceptance Checklist

- Existing sample ids are reused instead of duplicated.
- Each new sample has a handoff/trade/quest/contract path.
- No full contamination simulation.
- No new monster behavior unless a generic drop/contract path already exists.
- Run `npm run check`; run `npm run test:generation` if new generation/drop sources are added.

