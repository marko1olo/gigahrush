# Items 000: Parallel Item Worker Manifest

Status: manifest for single-item GPT-5.5 workers, not shipped behavior. Created 2026-05-24.

This manifest maps each concrete item/update candidate to one standalone worker plan file. There are 201 unique item plans generated from 207 candidate rows in `items_1.md` through `items_5.md`.

Use these files after the `items_orchestrator.md` pre-pass decides how per-item packs are registered. In a 200-agent run, each worker receives exactly one file from this table and must not implement neighboring items.

| N | Plan | id | Russian name | Type | Mode | Source plans |
| ---: | --- | --- | --- | --- | --- | --- |
| 001 | [items_001.md](items_001.md) | `liquidator_rake` | Грабли ликвидатора 0Г15 | WEAPON | new | items_1.md, items_2.md |
| 002 | [items_002.md](items_002.md) | `rusty_rake` | Ржавые грабли | WEAPON | new | items_1.md, items_2.md |
| 003 | [items_003.md](items_003.md) | `uv_spotlight` | УФ-прожектор ликвидатора | TOOL | improve | items_1.md |
| 004 | [items_004.md](items_004.md) | `ip4_gasmask` | Противогаз ИП-4 | TOOL | new | items_1.md |
| 005 | [items_005.md](items_005.md) | `p14_gasmask_receipt` | Квитанция 8П14 | MISC | new | items_1.md |
| 006 | [items_006.md](items_006.md) | `gasmask_filter` | Фильтр противогаза | MISC | improve | items_1.md |
| 007 | [items_007.md](items_007.md) | `used_gasmask_filter` | Отработанный фильтр | MISC | new | items_1.md |
| 008 | [items_008.md](items_008.md) | `wet_rag_bundle` | Мокрые тряпки | MISC | new | items_1.md |
| 009 | [items_009.md](items_009.md) | `asbestos_cord` | Асбестовая верёвка | MISC | improve | items_1.md |
| 010 | [items_010.md](items_010.md) | `rubber_door_wedge` | Резиновый клин гермодвери | MISC | new | items_1.md |
| 011 | [items_011.md](items_011.md) | `hermo_gasket` | Гермопрокладка | MISC | improve | items_1.md |
| 012 | [items_012.md](items_012.md) | `sealant_tube` | Тюбик герметика | MISC | improve | items_1.md |
| 013 | [items_013.md](items_013.md) | `decon_fluid` | Обеззараживающая жидкость | MISC | new | items_1.md |
| 014 | [items_014.md](items_014.md) | `alkali_powder` | Щёлочная присыпка | MISC | new | items_1.md |
| 015 | [items_015.md](items_015.md) | `lime_bucket` | Ведро извести | MISC | new | items_1.md |
| 016 | [items_016.md](items_016.md) | `zinc_slime_bucket` | Цинковое ведро для слизи | MISC | new | items_1.md |
| 017 | [items_017.md](items_017.md) | `nii_sample_container` | Тара НИИ для пробы | MISC | improve | items_1.md, items_4.md |
| 018 | [items_018.md](items_018.md) | `cleanup_tongs` | Санитарные щипцы | TOOL | new | items_1.md |
| 019 | [items_019.md](items_019.md) | `body_bag_roll` | Рулон мешков для тел | MISC | new | items_1.md |
| 020 | [items_020.md](items_020.md) | `corpse_number_tag` | Номерок трупа | MISC | new | items_1.md |
| 021 | [items_021.md](items_021.md) | `portable_siren_key` | Ключ переносной сирены | MISC | new | items_1.md |
| 022 | [items_022.md](items_022.md) | `radio_headset_liquidator` | Гарнитура ликвидатора | TOOL | new | items_1.md |
| 023 | [items_023.md](items_023.md) | `field_radio_battery` | Батарея рации | MISC | new | items_1.md |
| 024 | [items_024.md](items_024.md) | `liquidator_flashlamp` | Переносной прожектор | TOOL | new | items_1.md |
| 025 | [items_025.md](items_025.md) | `ozk_patch` | Заплата ОЗК | MISC | new | items_1.md |
| 026 | [items_026.md](items_026.md) | `protective_apron` | Кислотный фартук | MISC | new | items_1.md |
| 027 | [items_027.md](items_027.md) | `cleanup_order_stub` | Корешок приказа на зачистку | MISC | new | items_1.md |
| 028 | [items_028.md](items_028.md) | `slime_scraper` | Скребок для слизи | TOOL | new | items_1.md |
| 029 | [items_029.md](items_029.md) | `hermetic_tape` | Гермолента | MISC | new | items_1.md |
| 030 | [items_030.md](items_030.md) | `smoke_candle_check` | Дымовая шашка проверки тяги | MISC | new | items_1.md |
| 031 | [items_031.md](items_031.md) | `post_samosbor_probe_kit` | Набор замера после самосбора | MISC | new | items_1.md |
| 032 | [items_032.md](items_032.md) | `contaminated_gloves` | Загрязнённые перчатки | MISC | new | items_1.md |
| 033 | [items_033.md](items_033.md) | `bayonet` | Штык | WEAPON | improve | items_2.md |
| 034 | [items_034.md](items_034.md) | `rake_bayonet` | Штык-грабли | WEAPON | new | items_2.md |
| 035 | [items_035.md](items_035.md) | `liquidator_axe` | Топор ликвидатора | WEAPON | new | items_2.md |
| 036 | [items_036.md](items_036.md) | `shock_baton` | Шоковая дубинка | WEAPON | new | items_2.md |
| 037 | [items_037.md](items_037.md) | `rubber_club` | Резиновая дубинка | WEAPON | new | items_2.md |
| 038 | [items_038.md](items_038.md) | `homemade_pistol` | Кустарный пистолет | WEAPON | improve | items_2.md |
| 039 | [items_039.md](items_039.md) | `karkarov_pistol` | Пистолет Каркарова | WEAPON | new | items_2.md |
| 040 | [items_040.md](items_040.md) | `zatychkin_pistol` | Пистолет Затычкина | WEAPON | new | items_2.md |
| 041 | [items_041.md](items_041.md) | `slyoznev_pps41` | ППС-41 Слизнёва | WEAPON | new | items_2.md |
| 042 | [items_042.md](items_042.md) | `eralashnikov_auto` | Автомат Ералашникова | WEAPON | new | items_2.md |
| 043 | [items_043.md](items_043.md) | `ak47` | Калашников | WEAPON | improve | items_2.md |
| 044 | [items_044.md](items_044.md) | `party_might_launcher` | Подствольник «Мощь партии» | WEAPON | new | items_2.md |
| 045 | [items_045.md](items_045.md) | `nosin_rifle` | Винтовка Носина | WEAPON | new | items_2.md |
| 046 | [items_046.md](items_046.md) | `moskvin_rifle` | Винтовка Москвина | WEAPON | new | items_2.md |
| 047 | [items_047.md](items_047.md) | `losyash_rifle` | Винтовка Лосяша | WEAPON | new | items_2.md |
| 048 | [items_048.md](items_048.md) | `tanev_svt40` | СВТ-40 Танева | WEAPON | new | items_2.md |
| 049 | [items_049.md](items_049.md) | `chizh3_shotgun` | ЧИЖ-3 | WEAPON | new | items_2.md |
| 050 | [items_050.md](items_050.md) | `conscripts_doublebarrel` | Двустволка срочника | WEAPON | new | items_2.md |
| 051 | [items_051.md](items_051.md) | `rb91_auto_shotgun` | РБ-91 | WEAPON | new | items_2.md |
| 052 | [items_052.md](items_052.md) | `granit4u_belt_shotgun` | «Гранит»-4у | WEAPON | new | items_2.md |
| 053 | [items_053.md](items_053.md) | `pushkin_shotgun` | Ружьё «Пушкин» | WEAPON | new | items_2.md |
| 054 | [items_054.md](items_054.md) | `ptrs_liquidator` | ПТРС ликвидатора | WEAPON | new | items_2.md |
| 055 | [items_055.md](items_055.md) | `rpl23_lmg` | РПЛ-23 Лёшкинского | WEAPON | new | items_2.md |
| 056 | [items_056.md](items_056.md) | `p41_heavy_mg` | 6П41 пулемёт | WEAPON | new | items_2.md |
| 057 | [items_057.md](items_057.md) | `g41_grenade_launcher` | 5Г41 станковый гранатомёт | WEAPON | new | items_2.md |
| 058 | [items_058.md](items_058.md) | `pistol_grenade_launcher` | Пистолет-гранатомёт | WEAPON | new | items_2.md |
| 059 | [items_059.md](items_059.md) | `flamethrower` | Огнемёт | WEAPON | improve | items_2.md |
| 060 | [items_060.md](items_060.md) | `roks47_flamethrower` | РОКС-47 | WEAPON | new | items_2.md |
| 061 | [items_061.md](items_061.md) | `shmk_disposable` | ШМК | WEAPON | new | items_2.md |
| 062 | [items_062.md](items_062.md) | `agnia_a130` | А-130 «Агния» | WEAPON | new | items_2.md |
| 063 | [items_063.md](items_063.md) | `o15_multijet_flamer` | 6О15-УТТХ | WEAPON | new | items_2.md |
| 064 | [items_064.md](items_064.md) | `ato41_atomic_flamer` | АТО-41 | WEAPON | new | items_2.md |
| 065 | [items_065.md](items_065.md) | `brt2_foam_projector` | БРТ-2 бетономёт | WEAPON | new | items_2.md |
| 066 | [items_066.md](items_066.md) | `foam_grenade_6p10` | Пенобетонная граната 6П10 | WEAPON | new | items_2.md |
| 067 | [items_067.md](items_067.md) | `pbrog1_foam_launcher` | ПБРОГ-1 | WEAPON | new | items_2.md |
| 068 | [items_068.md](items_068.md) | `breach_charge` | Пробивной заряд | WEAPON | new | items_2.md |
| 069 | [items_069.md](items_069.md) | `concrete_breaker_grenade` | Бетонобойная граната | WEAPON | new | items_2.md |
| 070 | [items_070.md](items_070.md) | `chest_failsafe_charge` | Фугасный нагрудный заряд | WEAPON | new | items_2.md |
| 071 | [items_071.md](items_071.md) | `grn420_gravizhernov` | Гравижернов ГРН-420 | WEAPON | new | items_2.md |
| 072 | [items_072.md](items_072.md) | `tracked_zhernov` | Гусеничный жернов | WEAPON | new | items_2.md |
| 073 | [items_073.md](items_073.md) | `ammo_12g_slug` | Пуля 12 калибра | AMMO | new | items_2.md |
| 074 | [items_074.md](items_074.md) | `ammo_12g_incendiary` | Зажигательная дробь | AMMO | new | items_2.md |
| 075 | [items_075.md](items_075.md) | `ammo_12g_chemical` | Химический патрон 12 калибра | AMMO | new | items_2.md |
| 076 | [items_076.md](items_076.md) | `ammo_rifle_coupon` | Талон на винтовочные патроны | MISC | new | items_2.md |
| 077 | [items_077.md](items_077.md) | `napalm_mix` | Напалмовая смесь | AMMO | new | items_2.md |
| 078 | [items_078.md](items_078.md) | `empty_roks_tank` | Пустой ранцевый бак | MISC | new | items_2.md |
| 079 | [items_079.md](items_079.md) | `homemade_9mm` | Кустарные 9мм | AMMO | new | items_2.md |
| 080 | [items_080.md](items_080.md) | `rifle_bolt_pack` | Полимерные болты | AMMO | new | items_2.md |
| 081 | [items_081.md](items_081.md) | `liquidator_issue_card` | Карточка выдачи ликвидатора | MISC | new | items_3.md |
| 082 | [items_082.md](items_082.md) | `liquidator_field_roster` | Полевая ведомость ликвидаторов | MISC | new | items_3.md |
| 083 | [items_083.md](items_083.md) | `weapon_checkout_tag` | Оружейная бирка | MISC | new | items_3.md |
| 084 | [items_084.md](items_084.md) | `scrubbed_weapon_tag` | Сбитая оружейная бирка | MISC | new | items_3.md |
| 085 | [items_085.md](items_085.md) | `ammo_coupon_9mm` | Талон на 9мм | MISC | new | items_3.md |
| 086 | [items_086.md](items_086.md) | `ammo_coupon_shells` | Талон на дробь | MISC | new | items_3.md |
| 087 | [items_087.md](items_087.md) | `fuel_issue_stamp` | Штамп выдачи топлива | MISC | new | items_3.md |
| 088 | [items_088.md](items_088.md) | `gusl_index_page` | Страница индекса ГУСЛ | NOTE | new | items_3.md |
| 089 | [items_089.md](items_089.md) | `gusl_index_fragment` | Обрывок ГУСЛ | MISC | new | items_3.md |
| 090 | [items_090.md](items_090.md) | `foam_grenade_act` | Акт выдачи 6П10 | MISC | new | items_3.md |
| 091 | [items_091.md](items_091.md) | `confiscation_tag` | Бирка конфиската | MISC | new | items_3.md |
| 092 | [items_092.md](items_092.md) | `contraband_receipt_blank` | Пустая расписка контрабанды | MISC | new | items_3.md |
| 093 | [items_093.md](items_093.md) | `sample_chain_form` | Бланк цепочки пробы | MISC | new | items_3.md |
| 094 | [items_094.md](items_094.md) | `nii_sample_label` | Наклейка НИИ для пробы | MISC | new | items_3.md |
| 095 | [items_095.md](items_095.md) | `contaminated_sample_act` | Акт испорченной пробы | MISC | new | items_3.md |
| 096 | [items_096.md](items_096.md) | `quarantine_breach_notice` | Извещение о нарушении карантина | MISC | new | items_3.md |
| 097 | [items_097.md](items_097.md) | `decon_completion_stamp` | Штамп санобработки | MISC | new | items_3.md |
| 098 | [items_098.md](items_098.md) | `resident_identity_stub` | Корешок удостоверения личности | MISC | new | items_3.md |
| 099 | [items_099.md](items_099.md) | `passport_stub` | Паспортный корешок | MISC | improve | items_3.md |
| 100 | [items_100.md](items_100.md) | `part_ticket` | Партбилет | MISC | new | items_3.md |
| 101 | [items_101.md](items_101.md) | `labor_shift_card` | Карта смены | MISC | new | items_3.md |
| 102 | [items_102.md](items_102.md) | `hazard_shift_extension` | Допуск на сверхсмену | MISC | new | items_3.md |
| 103 | [items_103.md](items_103.md) | `terminal_order_receipt` | Квитанция терминального заказа | MISC | new | items_3.md |
| 104 | [items_104.md](items_104.md) | `mail_intercept_slip` | Лист перехвата почты | MISC | new | items_3.md |
| 105 | [items_105.md](items_105.md) | `blueprint_t1_folder` | Папка чертежей Т1 | MISC | new | items_3.md, items_5.md |
| 106 | [items_106.md](items_106.md) | `blueprint_t2_folder` | Папка чертежей Т2 | MISC | new | items_3.md, items_5.md |
| 107 | [items_107.md](items_107.md) | `blueprint_t3_folder` | Папка чертежей Т3 | MISC | new | items_3.md, items_5.md |
| 108 | [items_108.md](items_108.md) | `rail_depot_pass` | Пропуск в депо | MISC | new | items_3.md |
| 109 | [items_109.md](items_109.md) | `rail_switch_order` | Ордер стрелочного перевода | MISC | new | items_3.md |
| 110 | [items_110.md](items_110.md) | `hermodoor_service_log` | Журнал обслуживания гермодвери | MISC | new | items_3.md |
| 111 | [items_111.md](items_111.md) | `hermodoor_journal` | Журнал гермодвери | MISC | improve | items_3.md |
| 112 | [items_112.md](items_112.md) | `samosbor_alarm_schedule` | График тревог | MISC | new | items_3.md |
| 113 | [items_113.md](items_113.md) | `shelter_seat_card` | Карточка места в укрытии | MISC | new | items_3.md |
| 114 | [items_114.md](items_114.md) | `shelter_seat_forgery` | Поддельная карточка укрытия | MISC | new | items_3.md |
| 115 | [items_115.md](items_115.md) | `water_reservoir_quota` | Квота резервуара воды | MISC | new | items_3.md |
| 116 | [items_116.md](items_116.md) | `concentrate_bonus_coupon` | Премиальный талон концентрата | MISC | new | items_3.md |
| 117 | [items_117.md](items_117.md) | `ovb_search_warrant` | Ордер ОВБ на обыск | MISC | new | items_3.md |
| 118 | [items_118.md](items_118.md) | `empty_sample_jar` | Пустая банка для пробы | MISC | new | items_4.md |
| 119 | [items_119.md](items_119.md) | `sealed_sample_jar` | Опломбированная банка для пробы | MISC | new | items_4.md |
| 120 | [items_120.md](items_120.md) | `cracked_sample_jar` | Треснувшая банка для пробы | MISC | new | items_4.md |
| 121 | [items_121.md](items_121.md) | `sterile_swab` | Стерильный мазок | MISC | new | items_4.md |
| 122 | [items_122.md](items_122.md) | `contaminated_swab` | Загрязнённый мазок | MISC | new | items_4.md |
| 123 | [items_123.md](items_123.md) | `sample_cork_seal` | Пробковая пломба | MISC | new | items_4.md |
| 124 | [items_124.md](items_124.md) | `glass_ampoule_empty` | Пустая ампула | MISC | new | items_4.md |
| 125 | [items_125.md](items_125.md) | `gas_sample_ampoule` | Ампула газовой пробы | MISC | new | items_4.md |
| 126 | [items_126.md](items_126.md) | `slime_age_label_brown` | Бирка молодой слизи | MISC | new | items_4.md |
| 127 | [items_127.md](items_127.md) | `slime_age_label_orange` | Бирка подростковой слизи | MISC | new | items_4.md |
| 128 | [items_128.md](items_128.md) | `slime_age_label_violet` | Бирка взрослой слизи | MISC | new | items_4.md |
| 129 | [items_129.md](items_129.md) | `slime_calcified_chip` | Окаменевший скол слизи | MISC | new | items_4.md |
| 130 | [items_130.md](items_130.md) | `slime_motor_node` | Моторный узел слизи | MISC | new | items_4.md |
| 131 | [items_131.md](items_131.md) | `slime_sense_node` | Чувствительный узел слизи | MISC | new | items_4.md |
| 132 | [items_132.md](items_132.md) | `frozen_slime_core` | Замороженное ядро слизи | MISC | new | items_4.md |
| 133 | [items_133.md](items_133.md) | `boiled_slime_residue` | Вываренный остаток слизи | MISC | new | items_4.md |
| 134 | [items_134.md](items_134.md) | `antifungal_ointment` | Противогрибковая мазь | MEDICINE | improve | items_4.md |
| 135 | [items_135.md](items_135.md) | `anti_spore_inhaler` | Противоспоровый ингалятор | MEDICINE | new | items_4.md |
| 136 | [items_136.md](items_136.md) | `burn_gel` | Противоожоговый гель | MEDICINE | new | items_4.md |
| 137 | [items_137.md](items_137.md) | `painkiller_pack` | Болеутоляющее | MEDICINE | new | items_4.md |
| 138 | [items_138.md](items_138.md) | `sleeping_pills` | Снотворное «Попобава» | MEDICINE | new | items_4.md |
| 139 | [items_139.md](items_139.md) | `antiemetic` | Противорвотное | MEDICINE | new | items_4.md |
| 140 | [items_140.md](items_140.md) | `sterile_bandage` | Стерильный бинт | MEDICINE | new | items_4.md |
| 141 | [items_141.md](items_141.md) | `splint` | Шина | MEDICINE | new | items_4.md |
| 142 | [items_142.md](items_142.md) | `syringe_empty` | Пустой шприц | MISC | new | items_4.md |
| 143 | [items_143.md](items_143.md) | `permanganate_vial` | Марганцовка | MEDICINE | new | items_4.md |
| 144 | [items_144.md](items_144.md) | `technical_spirit` | Технический спирт | MISC | new | items_4.md |
| 145 | [items_145.md](items_145.md) | `cotton_wool` | Вата | MISC | new | items_4.md |
| 146 | [items_146.md](items_146.md) | `soap_72` | Мыло хозяйственное 72% | MISC | new | items_4.md |
| 147 | [items_147.md](items_147.md) | `lice_shampoo` | Шампунь от вшей | MISC | new | items_4.md |
| 148 | [items_148.md](items_148.md) | `grey_briquette` | Концентрат-беляк | FOOD | improve | items_4.md |
| 149 | [items_149.md](items_149.md) | `liquidator_ration` | Черный сухпай ликвидатора | FOOD | improve | items_4.md |
| 150 | [items_150.md](items_150.md) | `daily_concentrate` | Пищевой концентрат ежедневный | FOOD | new | items_4.md |
| 151 | [items_151.md](items_151.md) | `white_concentrate` | Белый концентрат | FOOD | new | items_4.md |
| 152 | [items_152.md](items_152.md) | `black_concentrate` | Чёрный концентрат | FOOD | new | items_4.md |
| 153 | [items_153.md](items_153.md) | `red_concentrate` | Красный концентрат | FOOD | new | items_4.md |
| 154 | [items_154.md](items_154.md) | `experimental_concentrate` | Несерийный концентрат | FOOD | new | items_4.md |
| 155 | [items_155.md](items_155.md) | `protein_mold_cake` | Плесневой белковый брикет | FOOD | new | items_4.md |
| 156 | [items_156.md](items_156.md) | `water_reservoir_sample` | Проба воды из резервуара | MISC | new | items_4.md |
| 157 | [items_157.md](items_157.md) | `mutant_tissue_sample` | Образец ткани твари | MISC | new | items_4.md |
| 158 | [items_158.md](items_158.md) | `fibrous_capsule_cut` | Срез фиброзной капсулы | MISC | new | items_4.md |
| 159 | [items_159.md](items_159.md) | `frozen_item_shard` | Осколок замороженного предмета | MISC | new | items_4.md |
| 160 | [items_160.md](items_160.md) | `weapon_blueprint_t2` | Чертёж оружия Т2 | MISC | new | items_5.md |
| 161 | [items_161.md](items_161.md) | `homemade_ammo_instruction` | Инструкция кустарных патронов | MISC | new | items_5.md |
| 162 | [items_162.md](items_162.md) | `barrel_part` | Заготовка ствола | MISC | improve | items_5.md |
| 163 | [items_163.md](items_163.md) | `magazine_part` | Детали магазина | MISC | improve | items_5.md |
| 164 | [items_164.md](items_164.md) | `scrubbed_serial_plate` | Сбитая номерная планка | MISC | new | items_5.md |
| 165 | [items_165.md](items_165.md) | `stolen_filter_pack` | Краденая пачка фильтров | MISC | new | items_5.md |
| 166 | [items_166.md](items_166.md) | `black_market_shells` | Чёрнорыночная дробь | AMMO | new | items_5.md |
| 167 | [items_167.md](items_167.md) | `contraband_shocker_parts` | Детали шокера | MISC | new | items_5.md |
| 168 | [items_168.md](items_168.md) | `junior_tech_case` | Корпус «Юный техник» | MISC | new | items_5.md |
| 169 | [items_169.md](items_169.md) | `sound_emitter` | Звукоизлучатель | MISC | new | items_5.md |
| 170 | [items_170.md](items_170.md) | `keyboard_unit` | Клавиатура | MISC | new | items_5.md |
| 171 | [items_171.md](items_171.md) | `screen_unit` | Экран | MISC | new | items_5.md |
| 172 | [items_172.md](items_172.md) | `krona_battery` | Батарейка «Крона» | MISC | new | items_5.md |
| 173 | [items_173.md](items_173.md) | `heating_element` | Нагревательный элемент | MISC | new | items_5.md |
| 174 | [items_174.md](items_174.md) | `electrode_pack` | Электроды | MISC | new | items_5.md |
| 175 | [items_175.md](items_175.md) | `wire_bundle` | Провода | MISC | new | items_5.md |
| 176 | [items_176.md](items_176.md) | `wire_coil` | Моток провода | MISC | improve | items_5.md |
| 177 | [items_177.md](items_177.md) | `water_filter_regulator` | Регулятор фильтра воды | MISC | new | items_5.md |
| 178 | [items_178.md](items_178.md) | `pump_impeller` | Крыльчатка насоса | MISC | new | items_5.md |
| 179 | [items_179.md](items_179.md) | `vent_damper_plate` | Заслонка вентиляции | MISC | new | items_5.md |
| 180 | [items_180.md](items_180.md) | `rail_switch_handle` | Рукоять стрелочного перевода | MISC | new | items_5.md |
| 181 | [items_181.md](items_181.md) | `rail_signal_lamp` | Сигнальная лампа депо | MISC | new | items_5.md |
| 182 | [items_182.md](items_182.md) | `rail_spike_pack` | Пакет костылей | MISC | new | items_5.md |
| 183 | [items_183.md](items_183.md) | `track_diagram_scrap` | Обрывок схемы путей | MISC | new | items_5.md |
| 184 | [items_184.md](items_184.md) | `import_toiletpaper` | Туалетная бумага «Импорт» | MISC | new | items_5.md |
| 185 | [items_185.md](items_185.md) | `toiletpaper` | Туалетная бумага | MISC | improve | items_5.md |
| 186 | [items_186.md](items_186.md) | `roller_brush` | Валик | MISC | new | items_5.md |
| 187 | [items_187.md](items_187.md) | `aerosol_paint_maiden` | Аэрозольная краска «цвет девства» | MISC | new | items_5.md |
| 188 | [items_188.md](items_188.md) | `plastic_sheet` | Пластик | MISC | new | items_5.md |
| 189 | [items_189.md](items_189.md) | `ceramic_shards_pack` | Керамика | MISC | new | items_5.md |
| 190 | [items_190.md](items_190.md) | `cardboard_stack` | Картон | MISC | new | items_5.md |
| 191 | [items_191.md](items_191.md) | `cloth_roll` | Ткань | MISC | new | items_5.md |
| 192 | [items_192.md](items_192.md) | `rubber_tube` | Резиновая трубка | MISC | new | items_5.md |
| 193 | [items_193.md](items_193.md) | `bottle_empty` | Бутылка | MISC | new | items_5.md |
| 194 | [items_194.md](items_194.md) | `sugar_pack` | Сахар | FOOD | new | items_5.md |
| 195 | [items_195.md](items_195.md) | `braga_bucket` | Ведро браги | MISC | new | items_5.md |
| 196 | [items_196.md](items_196.md) | `moonshine_still_part` | Деталь самогонного аппарата | MISC | new | items_5.md |
| 197 | [items_197.md](items_197.md) | `dice_bone` | Игральные кости | MISC | new | items_5.md |
| 198 | [items_198.md](items_198.md) | `resident_trinket_box` | Коробка жильцовых мелочей | MISC | new | items_5.md |
| 199 | [items_199.md](items_199.md) | `party_portrait_pin` | Значок с портрета партии | MISC | new | items_5.md |
| 200 | [items_200.md](items_200.md) | `stolen_terminal_stamp` | Украденная печать терминала | MISC | new | items_5.md |
| 201 | [items_201.md](items_201.md) | `market_weight_scale` | Рыночные весы | MISC | new | items_5.md |

## Duplicate Rows Merged

- `liquidator_rake`: items_1.md:69, items_2.md:81
- `rusty_rake`: items_1.md:70, items_2.md:82
- `nii_sample_container`: items_1.md:85, items_4.md:73
- `blueprint_t1_folder`: items_3.md:97, items_5.md:70
- `blueprint_t2_folder`: items_3.md:98, items_5.md:71
- `blueprint_t3_folder`: items_3.md:99, items_5.md:72

## Required Orchestrator Rule

Do not let all workers edit `src/data/items.ts` directly in parallel. Use per-item pack files or run item docs sequentially by ownership slots.
