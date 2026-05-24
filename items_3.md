# Items 3: Documents, Permits, Bureaucracy And Access Goods

Status: parallel implementation plan, not shipped behavior. Created 2026-05-24 for a future GPT-5.5 worker.

This worker owns paperwork, permits, issue cards, audit tokens, legal/forged pairs, document gates and bureaucracy-driven item access. Combat stats belong to `items_2.md`; NII sample chain belongs to `items_4.md` unless the item is primarily a document.

## Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `src/data/items.ts`
- `src/data/permits.ts`
- `src/systems/inventory.ts`
- `src/systems/permits.ts`
- `src/systems/events.ts`
- `src/gen/ministry/permit_office.ts`
- `src/gen/ministry/weapon_permit_bureau.ts`
- `tests/data-ids.test.ts`
- `tests/inventory-rpg.test.ts`

Useful sources:

- Samosbor setting basics: ration coupons, hermetic survival and bureaucracy: https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- Samosbor concentrate: ration dispenser, coupons and general/nutritious concentrate: https://samosb0r.fandom.com/ru/wiki/Концентрат
- GUSL index for equipment classification papers: https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- Minecraft terminal, part ticket, blueprints and item category pages: https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы
- Archive railways and missing transport documentation: https://samosb0r.fandom.com/ru/wiki/Железные_дороги

## Ownership

Preferred write set after orchestrator approval:

- New pack file if pack registry exists: `src/data/item_packs/documents_access.ts`
- Optional permit pack, or sole narrow ownership of `src/data/permits.ts`
- Optional generic inventory document handler if reusing `registerInventoryUseHandler()`
- Optional Ministry reachability through existing permit/weapon permit modules

Do not edit:

- broad quest system unless a generic document gate is assigned
- `main.ts`
- render

## Existing Items To Improve, Not Break

| Existing id | Keep | Improvement angle |
| --- | --- | --- |
| `weapon_permit_signed` | Existing legal short-weapon paper. | Use as baseline for legal firearm access. |
| `weapon_permit_forged` | Existing forged weapon paper. | Keep audit/contraband risk. |
| `ammo_issue_order` | Existing ammo issue paper. | Good pattern for one-use ammo access. |
| `official_quarantine_clearance` | Existing legal quarantine document. | Extend as model for legal/forged pairs. |
| `forged_quarantine_clearance` | Existing forged quarantine document. | Keep contraband/audit tags. |
| `official_permit_slip` | Existing general permit. | Use as low-tier official paper. |
| `forged_permit_slip` | Existing forged general permit. | Use as black-market counterpart. |
| `shelter_tally` | Existing after-samosbor list. | Pair with forged/clean shelter papers. |
| `forged_shelter_tally` | Existing forgery. | Keep as decision item, not just loot. |
| `water_coupon` | Existing ration paper. | Use as food/water economy foundation. |
| `concentrate_coupon` | Existing ration paper. | Pair with concentrate items. |
| `ration_registry_extract` | Existing audit document. | Use for ration forgery/document combos. |
| `fake_pass` | Existing forged pass. | Avoid duplicate generic fake papers. |
| `archive_access_permit` | Existing Ministry archive gate. | Keep route/document gate role. |
| `void_archive_warrant` | Existing rare warrant. | Endgame document pattern. |

## Candidate Backlog

Target this stream: 30-38 accepted entries or improvements.

| Mode | Proposed id | Russian name | Type | Role | Reachability | Implementation note |
| --- | --- | --- | --- | --- | --- | --- |
| new | `liquidator_issue_card` | Карточка выдачи ликвидатора | MISC | Legal access to one field kit | HQ/Ministry | Consumed or stamped by stash interaction. |
| new | `liquidator_field_roster` | Полевая ведомость ликвидаторов | MISC | Ties cleanup team to route/floor | HQ/office | Evidence for missing squad or stash. |
| new | `weapon_checkout_tag` | Оружейная бирка | MISC | Audit proof for issued weapon | Armory/HQ | Pair with stolen weapons. |
| new | `scrubbed_weapon_tag` | Сбитая оружейная бирка | MISC | Contraband marker | Black market | Use in trade/audit choices. |
| new | `ammo_coupon_9mm` | Талон на 9мм | MISC | Legal pistol ammo access | Office/HQ | Prefer token over generic ammo spawn. |
| new | `ammo_coupon_shells` | Талон на дробь | MISC | Legal shotgun ammo access | Office/HQ | Converts to `ammo_shells` through handler/contract. |
| new | `fuel_issue_stamp` | Штамп выдачи топлива | MISC | ROKS/SHMK fuel bureaucracy | Production/HQ | Links to `ammo_fuel`/`napalm_mix`. |
| new | `gusl_index_page` | Страница индекса ГУСЛ | NOTE | Lore/access clue | Office/HQ/archive | Keep Russian display; id uses `gusl`. |
| new | `gusl_index_fragment` | Обрывок ГУСЛ | MISC | Classifies weird weapon | Loot/office | Trade or unlock hint. |
| new | `foam_grenade_act` | Акт выдачи 6П10 | MISC | Foam grenade legal path | HQ | Pairs with items_2. |
| new | `confiscation_tag` | Бирка конфиската | MISC | Converts illegal item into relation/evidence choice | Ministry/HQ | Existing document market hooks likely enough. |
| new | `contraband_receipt_blank` | Пустая расписка контрабанды | MISC | Forgery input | Smoking/office | Pairs with black market. |
| new | `sample_chain_form` | Бланк цепочки пробы | MISC | Legalizes sample handoff | NII/office | Coordinate with items_4. |
| new | `nii_sample_label` | Наклейка НИИ для пробы | MISC | Sample official seal | NII/medical | Coordinate with items_4. |
| new | `contaminated_sample_act` | Акт испорченной пробы | MISC | Failure/evidence branch | NII/aftermath | Generated by failed sample handling. |
| new | `quarantine_breach_notice` | Извещение о нарушении карантина | MISC | Consequence document | Medical/Ministry | Event output or quest item. |
| new | `decon_completion_stamp` | Штамп санобработки | MISC | Cleanup completion proof | HQ/Maintenance | Pairs with cleanup gear. |
| new | `resident_identity_stub` | Корешок удостоверения личности | MISC | Basic identity document | Office/living | Existing `passport_stub` may cover; dedupe first. |
| improve | `passport_stub` | Паспортный корешок | MISC | Existing identity paper | Current item | Use instead of new if already present. |
| new | `part_ticket` | Партбилет | MISC | High-status terminal/work access | Office/Ministry | Source adaptation; use cautiously. |
| new | `labor_shift_card` | Карта смены | MISC | Worker access / factory gate | Factory/office | Links to production floors. |
| new | `hazard_shift_extension` | Допуск на сверхсмену | MISC | Dangerous production work permit | Factory/HQ | Risk/reward document. |
| new | `terminal_order_receipt` | Квитанция терминального заказа | MISC | Delayed mail/craft proof | Terminals/office | Good for future delivery system. |
| new | `mail_intercept_slip` | Лист перехвата почты | MISC | Theft vs legal delivery | Office/black market | Decision item. |
| new | `blueprint_t1_folder` | Папка чертежей Т1 | MISC | Recipe unlock | Cabinets/terminal | Coordinate with items_5. |
| new | `blueprint_t2_folder` | Папка чертежей Т2 | MISC | Better recipe unlock | Fibrous capsules/terminal | Coordinate with items_5. |
| new | `blueprint_t3_folder` | Папка чертежей Т3 | MISC | Rare recipe unlock | Frozen item/deep route | Coordinate with items_5. |
| new | `rail_depot_pass` | Пропуск в депо | MISC | Railway/transport route access | Transport offices | Source: rail docs are missing/extracted. |
| new | `rail_switch_order` | Ордер стрелочного перевода | MISC | Route reroute token | Depot/office | Future floor route hook, no new enum. |
| new | `hermodoor_service_log` | Журнал обслуживания гермодвери | MISC | Door repair/audit proof | Maintenance/office | Existing `hermodoor_journal` may cover; dedupe. |
| improve | `hermodoor_journal` | Журнал гермодвери | MISC | Existing door document | Current item | Add tags or use path if weak. |
| new | `samosbor_alarm_schedule` | График тревог | MISC | False/real alarm document | Office/HQ | Must not predict samosbor globally unless system supports. |
| new | `shelter_seat_card` | Карточка места в укрытии | MISC | Shelter access/bribe | Office/common | Works with `shelter_tally`. |
| new | `shelter_seat_forgery` | Поддельная карточка укрытия | MISC | Forged shelter access | Smoking/office | Legal/forged pair. |
| new | `water_reservoir_quota` | Квота резервуара воды | MISC | Water ration gate | Office/kitchen | Pair with water economy. |
| new | `concentrate_bonus_coupon` | Премиальный талон концентрата | MISC | Better ration reward | Kitchen/HQ | Links to `items_4` food. |
| new | `ovb_search_warrant` | Ордер ОВБ на обыск | MISC | High-risk legal power | OVB/HQ | Faction/audit content later. |

## Implementation Notes

- Most documents are `ItemType.MISC` with `document`, `permit`, `access`, `audit`, `forgery`, `contraband`, `official` tags.
- Existing inventory document actions include checking/selling/using some document gates. Reuse those patterns.
- Prefer legal/forged pairs where a real choice exists.
- Do not add a new terminal/mail system in this stream. If an item needs terminal delivery, make it a token for future work unless generic support already exists.
- Do not use display-name lookups for gameplay. Use ids and tags.

## Acceptance Checklist

- Every document has a player-facing decision: submit, forge, sell, hide, spend, report, trade or use as access.
- Existing near-duplicates are reused or explicitly improved.
- `DOCUMENT_GATE_ITEMS` or equivalent generic sets are updated only by a single owner.
- No save shape changes unless storing persistent document state.
- Run `npm run check:readonly`; run `npm run check` if inventory behavior changes.
