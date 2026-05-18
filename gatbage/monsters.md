# ГИГАХРУЩ: Monster Design Bible

Версия: 1.0  
Дата: 2026-05-18  
Статус: дизайн-док для нарезки будущих `monster_N.md`; не факт-карта текущего билда  
Цель: дать параллельным агентам основу для массового добавления монстров как игровых ролей, а не как набора новых спрайтов.

`README.md` остается источником shipped behavior. Этот документ описывает, какие монстр-пакеты стоит делать дальше, как не конфликтовать в shared files, и какие требования должны попасть в каждый будущий `monster_N.md`.

## 1. Источники И Отбор

Прочитанные локальные опоры:

- `README.md`: текущая факт-карта билда, этажи, procedural route, 24 monster definitions, variants, ecology.
- `architecture.md`: границы `core/data/gen/systems/render`, правила параллельных агентов, red/yellow/green files.
- `desdoc.md`: P0.2 Monster Counterplay Pass, survival ARPG sim shooter direction, лорная волна и backlog.
- `src/core/types.ts`: текущий `MonsterKind`.
- `src/entities/monster.ts` и `src/entities/*.ts`: текущие `MonsterDef`, registry, sprite hooks.
- `src/data/monster_ecology.ts`: floor/room identity, counterplay, loot hints, rare drops.
- `src/data/monster_variants.ts`: дешевые modifiers без новых runtime scans.
- `src/systems/ai/monster.ts`: текущие generic and special AI hooks.
- `src/systems/monster_bait.ts`: bounded bait markers.
- `src/data/procedural_floors.ts`: geometry/anomaly/faction tags and monster bias.
- `Docs/Tasks/Status_AG34_MONSTER_COUNTERPLAY.md`: уже проведенный audit по 22/24 монстрам.

Внешний ресерч по Самосбору и тредовым следам:

- Оригинальный бугурт-тред происходит с 2ch.hk и в поздних пересказах задает ядро: гигапанелька/Гигахрущ, самосбор как более страшный аналог выброса, твари после самосбора, ликвидаторы после события.
- Самосборные вики противоречат друг другу, но устойчивые мотивы совпадают: сирена или ее отказ, запах сырого мяса, фиолетовый туман, гермодвери, неполная безопасность укрытия, последствия в виде тварей, слизи, плесени, зараженных и аномалий.
- Важная формула для игры: тварей нельзя надежно классифицировать по биологии, зато их можно классифицировать по поведению. Это идеально совпадает с P0.2: монстр должен иметь readable rule and counterplay.
- Канон коллективный и шумный. В игру берем не пасты целиком, а устойчивые мотивы, которые дают маршрут, риск, выбор, контр-игру, лут, событие или последствие.

Внешние ссылки для будущих авторов:

- https://samosbors8878.fandom.com/ru/wiki/Оригинальный_бугурт-трейд
- https://samosborarchive.fandom.com/ru/wiki/Самосбор
- https://samosborarchive.fandom.com/ru/wiki/Гигахрущёвка
- https://samosborarchive.fandom.com/ru/wiki/Твари
- https://samosborarchive.fandom.com/ru/wiki/Заражённые
- https://samosborarchive.fandom.com/ru/wiki/Гермодверь
- https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- https://kletka.wiki.gg/wiki/Ru:Samosbor

## 2. Главная Дизайн-Теза

Монстр в ГИГАХРУЩЕ - это не существо с HP. Это локальное правило вылазки.

Хороший монстр меняет план игрока:

- куда идти;
- что взять перед выходом;
- стрелять или экономить патроны;
- держать дистанцию или рваться вплотную;
- закрываться или бежать;
- светить, тушить, чинить, вскрывать, подделывать, отвлекать;
- сдать образец, скрыть след, продать остатки или сообщить ликвидаторам.

Плохой монстр:

- отличается только цветом;
- требует только больше DPS;
- появляется где угодно без floor identity;
- не имеет предупреждения и контр-игры;
- требует новый широкий system just for itself;
- сканирует весь мир каждый кадр;
- не оставляет лут, слух, событие, POI или контракт.

## 3. Текущий Ростер И Занятые Ниши

Сейчас в коде 24 `MonsterKind`. Не надо дублировать их роль без нового решения игрока.

| Kind | Имя | Уже занятая ниша | Не дублировать |
| --- | --- | --- | --- |
| `SBORKA` | Сборка | быстрый слабый расход патронов, bait-reactive | просто еще один быстрый мелкий монстр |
| `TVAR` | Тварь | средняя угроза, держать дистанцию, стены/панели | generic melee chaser |
| `POLZUN` | Ползун | медленный танк, опасен в дверях/воде/узких местах | еще один HP sponge |
| `BETONNIK` | Бетонник | редкая тяжелая бетонная угроза | просто большой tank |
| `ZOMBIE` | Мертвяк | бывший жилец, толпа/изоляция | generic undead |
| `EYE` | Глаз | ranged line-of-fire enemy | еще один прямой стрелок без новой геометрии |
| `NIGHTMARE` | Кошмарище | редкий pressure enemy, burst-or-flee | просто elite melee |
| `SHADOW` | Теневик | темнота/ambush/move after hit | еще одна тень без света/движения |
| `REBAR` | Арматура | металл/склад/псевдомусор | another mimic junk |
| `MATKA` | Матка | spawner boss, kill-or-clear decision | бесконечные спавнеры без cap |
| `IDOL` | Идол | static ranged/psi monolith | static turret без условия |
| `MANCOBUS` | Манкобус | controller boss, guards + corner play | fat boss с цифрами |
| `HERALD` | Вестник | Hell watcher/ranged cover play | another ranged watcher |
| `CREATOR` | Творец | final Void boss | new final boss без финального контекста |
| `SPIRIT` | Дух | phasing, walls do not protect | ghost clone |
| `ROBOT` | Робот | industrial ranged machine, dodge volley | another plasma shooter |
| `SHOVNIK` | Шовник | wall/seam bias | wall monster clone |
| `LAMPOVY` | Ламповый | light-powered threat | light-fed clone |
| `PECHATEED` | Печатеед | document hunter | another document eater |
| `TUBE_EEL` | Трубный угорь | water/pipe ambusher | water chaser clone |
| `PARAGRAPH` | Параграф | ranged hostile document | paper projectile clone |
| `NELYUD` | Нелюдь | false human, close reveal | generic mimic person |
| `KRYSNOZHKA` | Крысоножка | food/garbage swarm, bait/shotgun/trap | uncapped swarm |
| `KOSTOREZ` | Косторез | elite windup melee, shotgun stagger, metal armor interaction | unreadable one-shot melee |

Existing generic hooks:

- melee chase with pathfinding;
- ranged projectile enemy;
- phasing movement;
- static ranged enemy;
- matka capped local reproduction;
- wall-adjacent speed/damage for `SHOVNIK`;
- lamp-adjacent damage for `LAMPOVY`;
- water movement for `TUBE_EEL`;
- document targeting for `PECHATEED`;
- close reveal range for `NELYUD`;
- readable windup/stagger for `KOSTOREZ`;
- food/govnyak bait markers for `SBORKA`, `TVAR`, `POLZUN`, `KRYSNOZHKA`;
- monster ecology event data and rumor hooks.

## 4. Свободные Ниши

Следующий проход должен брать эти gaps. Приоритет выше у ниш, которые добавляют новый выбор без большого engine rewrite.

| Gap | Что нужно игре | Почему свободно |
| --- | --- | --- |
| Shelter/door deception | угроза, заставляющая решать: открывать, чинить, ждать, проверять | гермодвери и самосбор есть, но мало монстров вокруг решения "впустить/не впустить" |
| Route denial | монстр закрывает, пломбирует, меняет или делает дорогим путь | есть chasers, но мало врагов, которые меняют маршрут |
| Sound/noise predator | стрелять/бежать опасно, тишина становится тактикой | текущие монстры почти не реагируют на шум как ресурс |
| Resource sabotage | вода, фильтры, документы, патроны, контейнеры становятся целью | Печатеед чует бумаги, но нет широкой survival-resource угрозы |
| Crowd pressure | бой внутри толпы, очереди, паники, свидетелей | есть social floors, но монстры редко используют crowd as terrain |
| Vent/ceiling/pipe warning | угроза не из пола и не из прямого коридора | есть трубный угорь, но нет читаемого vent/gas predator |
| Trap/tether enemy | не догоняет, а связывает пространство | текущие враги мало создают temporary hazard lines |
| Topology enemy | самосборная перестановка как монстр, а не только anomaly | procedural teleport exists, но нет encounter around it |
| Slime cleanup enemy | остатки самосбора рождают цель "сжечь/запечатать/сдать" | slime defs есть, но мало монстров как cleanup pressure |
| Conditional neutral | не агрессивен до кражи, взгляда, документа, голоса, долга | Нелюдь близко раскрывается, но social-condition space шире |
| Non-kill resolution | можно закрыть, накормить, ослепить, предъявить форму, отвести | большинство монстров решаются убийством или бегством |
| Boss as room puzzle | boss не HP pool, а комната с выключателями/укрытиями/minions | есть боссы, но больше таких staged encounters усилит ARPG loop |

## 5. Implementation Modes

Не все `monster_N.md` должны требовать новый enum. Для параллельной работы это критично.

### Mode A: Encounter/Variant On Existing Monster

Лучший режим для массовых параллельных задач.

Использовать, когда идея может жить как:

- новый named encounter;
- новый POI with monster setup;
- новый `MonsterVariantDef`;
- новый rumor/contract around existing `MonsterKind`;
- новый local generator module.

Типичный write scope:

- один новый или существующий `src/gen/<floor>/<module>.ts`;
- один локальный manifest entry, если уже разрешен prompt;
- optional `src/data/monster_variants.ts` только если один агент владеет этим файлом;
- status/log docs;
- optional unique test.

Плюсы:

- почти нет конфликтов;
- можно сделать 5-25 задач параллельно;
- не нужно трогать `core/types.ts`, `entities/monster.ts`, `systems/rpg.ts`.

Минус:

- нельзя честно создать новый `MonsterKind`.

### Mode B: New Monster Kind With Integrator

Использовать только для 3-7 самых сильных ниш за волну.

Shared files, которые нельзя отдавать 25 агентам одновременно:

- `src/core/types.ts` for `MonsterKind`;
- `src/entities/monster.ts` registry and sprite hooks;
- `src/data/monster_ecology.ts`;
- `src/data/monster_variants.ts`, if variants are part of the same kind;
- `src/systems/rpg.ts` XP table;
- `src/systems/world_log.ts` if event names need display text;
- `src/systems/rumor.ts` only if broad rare-monster logic changes;
- `src/systems/ai/monster.ts` only if a generic behavior hook is truly needed.

Safe split:

1. One integrator creates enum slots, registry placeholders, XP/log coverage and tests.
2. Workers own disjoint `src/entities/<monster>.ts` plus disjoint encounter modules.
3. One final integrator resolves `monster_ecology.ts`, `monster_variants.ts`, rumor ids and content-registry failures.

### Mode C: New Generic AI Hook

Use sparingly. A hook is valid only when it supports at least 3 future monsters or variants.

Good hooks:

- bounded noise markers, similar to bait markers;
- bounded door-pressure markers;
- local tether/trap state on entity AI;
- local resource-scent marker published by container/inventory action;
- one screen/signal marker list capped by distance and count.

Bad hooks:

- a separate system per monster;
- global inventory scan each frame;
- full-world search for doors/containers/lights;
- renderer-owned gameplay state;
- unbounded reproduction, gas spread or path rewrites.

## 6. Required Anatomy Of A Monster

Every future `monster_N.md` must specify these fields.

```txt
id:
ru_name:
mode: A | B | C
floor_role:
spawn_context:
combat_role:
noncombat_role:
warning_cue:
player_counterplay:
failure_result:
reward_or_trace:
event_hooks:
rumor_hooks:
implementation_scope:
forbidden_scope:
validation:
```

Minimum gameplay requirement:

- one readable warning;
- one tactical response;
- one route/resource/social decision;
- one reachable encounter or debug path;
- one event, rumor, log, loot hint, or visible trace;
- no unbounded hot-loop cost.

## 7. Balance Bands

Use these as starting lines, not laws.

| Tier | HP | Speed | Damage | Use |
| --- | ---: | ---: | ---: | --- |
| Trash | 8-25 | 2.1-3.0 | 2-6 | panic, bait, ammo pressure |
| Common | 35-80 | 1.4-2.2 | 8-18 | ordinary expedition threat |
| Heavy | 100-220 | 0.7-1.4 | 16-30 | doorway/terrain rule |
| Elite | 120-350 | 1.0-2.0 | 15-40 | readable special counterplay |
| Static | 40-180 | 0 | 10-35 | line/room puzzle |
| Boss | 300+ | varies | varies | staged encounter, not only HP |

Rules:

- a fast monster must be weak, baitable, staggerable or rare;
- a tank must be avoidable, slow, objective-bound or terrain-bound;
- a ranged monster must have line-of-sight counterplay;
- a stealth/ambush monster must leave a cue before lethal contact;
- a resource-saboteur must be preventable or reversible;
- a boss must teach the rule before it kills the player.

## 8. 25 Monster Slots For 5x5 Parallel Planning

These are design slots for future `Monster_01.md` through `Monster_25.md`. They are not all "must be new enum" tasks. The recommended mode is part of the design.

Existing monsters also have audit/balance/readability prompts:

- `Monster_26.md`-`Monster_49.md` cover the current 24 `MonsterKind` values in enum order, from `SBORKA` through `KOSTOREZ`.
- These audit tasks are intentionally conservative: each owns its unique `src/entities/<monster>.ts`, status/log docs, and optional focused test.
- Shared tables and broad systems remain read-only unless an integrator explicitly assigns them, so old monsters are not damaged by parallel edits.

### Batch 1: Civil, Shelter, Social Horror

#### monster_01: `golos_za_dveryu` / Голос За Дверью

Mode: A first, B later only if door AI becomes generic.  
Primary floors: `LIVING`, `KVARTIRY`, procedural `false_safe_block`, samosbor aftermath.  
Current gap: shelter/door deception.

Role:

- A threshold threat that speaks from behind a closed or half-sealed door during warning/aftermath.
- It does not need to be physically strong. It pressures the player's decision to open, wait, repair, or flee.
- It should never be a random instant-death door.

Gameplay:

- Warning cue: message/log/screen line about a familiar voice using wrong details; door twitch mark; raw meat smell near threshold.
- Counterplay: do not open; inspect from distance; use a screen/rumor clue; repair seal; leave marker for liquidators; shoot through if local code supports it.
- Failure: opening spawns `NELYUD`, `SHADOW` or a new thin melee body nearby, damages seal, publishes event.
- Reward/trace: rare `bottled_voice`, `siren_shard`, or document clue; rumor about the door spreads.

Implementation recommendation:

- First wave: local encounter in `living/external_cell_neighbor.ts`, `kvartiry/false_neighbor.ts`, or a new procedural false-safe module using existing `NELYUD`.
- Shared hook later: bounded `door_lure` event markers consumed by monster AI.

DoD:

- Player can choose not to open and be rewarded by safety or rumor clarity.
- Opening is a deliberate action or clearly triggered local setup, not accidental proximity.

#### monster_02: `plombirovshchik` / Пломбировщик

Mode: B if real moving monster; A if local encounter with `SHOVNIK`.  
Primary floors: `LIVING`, `MINISTRY`, `MAINTENANCE`.  
Current gap: route denial and shelter access.

Role:

- A sealant-bodied monster that closes, jams or marks doors behind the player.
- It turns "run back to safe room" into a route problem.
- It should be weak in open space and dangerous only near doors/walls.

Gameplay:

- Warning cue: fresh rubber smell, white sealant line, door handle ticks.
- Counterplay: pull it away from walls; cut seal with knife/axe; use `sealant_tube` or `hermo_gasket`; loud shot interrupts sealing.
- Failure: one local door becomes locked/jammed or slower to pass; player must reroute.
- Reward/trace: `hermo_gasket`, `sealant_tube`, hermodoor repair clue.

Implementation recommendation:

- Reuse `SHOVNIK` wall bias for first encounter.
- If new kind: add small AI branch only for local door-near action with cooldown and radius cap.

DoD:

- At least one encounter teaches "kill in center room, not in doorway".
- No global door scan. Only doors near the monster or in owned room.

#### monster_03: `ocherednik` / Очередник

Mode: A.  
Primary floors: `KVARTIRY`, `MINISTRY`, `communal_ring`, ration queues.  
Current gap: crowd pressure.

Role:

- Not a single beast, but a samosbor-mutated queue knot using existing NPC/crowd space.
- It blocks corridors, attracts witnesses, punishes shooting in social floors.

Gameplay:

- Warning cue: line of unmoving people, murmured numbers, ration paper trail.
- Counterplay: show ration coupon, take side route, disperse with loud noise, expose fake queue leader, or fight through and lose reputation.
- Failure: player is slowed/pushed into a bad line, witnesses report theft/violence, nearby `ZOMBIE`/`NELYUD` activates.
- Reward/trace: ration papers, rumor, faction event, small money or coupon.

Implementation recommendation:

- Use local NPCs plus one `NELYUD` or `ZOMBIE` named leader.
- Avoid new `MonsterKind` unless crowd control becomes generic.

DoD:

- The encounter gives noncombat resolution.
- Killing everything is possible but socially expensive.

#### monster_04: `pustoy_sosed` / Пустой Сосед

Mode: A now, B later if hybrid NPC/monster is formalized.  
Primary floors: `LIVING`, `KVARTIRY`, `registry_morgue`.  
Current gap: conditional neutral / social reveal.

Role:

- A former neighbor who remains "normal" until the player is alone, too close, carrying a relevant item, or after a lie.
- Different from `NELYUD`: this is a social setup, not only close-range reveal.

Gameplay:

- Warning cue: name mismatch, wrong apartment number, no reflection in screen text, NPCs avoid him.
- Counterplay: keep distance, lead to lit public room, ask for document, bring witness, expose to liquidator.
- Failure: close reveal and fast melee; possible infection/black slime trace.
- Reward/trace: `fake_pass`, neighbor complaint, event for exposed infected.

Implementation recommendation:

- Local named NPC that spawns or transforms into `NELYUD`.
- No broad NPC FSM rewrite. Keep conditions local and bounded.

DoD:

- Player has at least one clue before reveal.
- There is a witness/expose path, not only ambush.

#### monster_05: `kartotechnik` / Картотечник

Mode: A or B.  
Primary floors: `MINISTRY`, `raionsovet_archive`, `registry_morgue`.  
Current gap: objective harassment without raw damage.

Role:

- A filing-cabinet parasite that targets quest documents, forms, keys and map leads.
- It extends document gameplay beyond `PECHATEED`: instead of just chasing paper carriers, it relocates or guards the needed record.

Gameplay:

- Warning cue: drawers opening in sequence, papers sorted into impossible alphabetical order.
- Counterplay: bring decoy `blank_form`, close drawer bank, burn wrong index, use official permit, rush the core shelf.
- Failure: quest item moved to a nearby container/room, `PARAGRAPH` spawn, extra route step.
- Reward/trace: `blank_form`, `ink_bottle`, `missing_record_file`.

Implementation recommendation:

- First wave: Ministry archive POI with `PECHATEED`/`PARAGRAPH` combo and a moved container.
- New kind only if it gets reusable "relocate local objective" behavior.

DoD:

- The player loses time/route certainty, not save integrity.
- Objective relocation is local, bounded, and logged.

### Batch 2: Industrial, Service, Resource Pressure

#### monster_06: `kabelnik` / Кабельник

Mode: B if tether line is implemented; A as `LAMPOVY`/`ROBOT` encounter first.  
Primary floors: `MAINTENANCE`, `production_belt`, `service_floor`.  
Current gap: trap/tether enemy.

Role:

- A cable-limbed industrial threat that creates a visible charged line between itself and a lamp/machine.
- It is less about chasing and more about dividing a room.

Gameplay:

- Warning cue: sparking cable line, lamp flicker, humming after player crosses.
- Counterplay: cut cable with melee at anchor, shut fuse, lure it away from lamps, shoot anchor, use rubber item.
- Failure: shock/slow, forced detour, resource drain.
- Reward/trace: `wire_coil`, `fuse`, `circuit_board`.

Implementation recommendation:

- Generic hook should be local entity `ai.tetherAnchorX/Y` and cooldown, not a world scan.
- Rendering can use existing marks/particles if available; no new DOM UI.

DoD:

- Player can see the line before taking damage.
- Tether has a maximum lifetime and one anchor.

#### monster_07: `ventshun` / Вентшун

Mode: A first, B later.  
Primary floors: `MAINTENANCE`, `service_floor`, `dark_metro`.  
Current gap: vent/ceiling/pipe warning.

Role:

- A vent predator that attacks from grates, pipes and ceiling shafts.
- It pressures "stand still and shoot down corridor" behavior.

Gameplay:

- Warning cue: dust falling from vent, metal cough, grate mark.
- Counterplay: move out from under vents, close valve, fire into grate, throw bait/noise away.
- Failure: short burst damage, smog cloud, or spawned `SBORKA`/`TUBE_EEL` from vent.
- Reward/trace: `filter_layer`, `pipe`, `gasmask_filter`.

Implementation recommendation:

- First wave: local room with vent marks and delayed spawn using existing monsters.
- New kind later if a bounded `vent_marker` list becomes useful for 3+ modules.

DoD:

- The vent cue appears before spawn.
- Spawn count is capped per room.

#### monster_08: `filtronos` / Фильтронос

Mode: A or B.  
Primary floors: `MAINTENANCE`, smog procedural floors, water rooms.  
Current gap: resource sabotage.

Role:

- A filter-faced scavenger that contaminates water/filter supplies or guards clean air items.
- It attacks survival preparation rather than just HP.

Gameplay:

- Warning cue: sucking breath, filter wrappers, dry puddle, NPC complains that filters went stale.
- Counterplay: kill quickly, seal container, distract with bad filter/govnyak, use gasmask before fight.
- Failure: one local container loses `filter_layer`/water or gains contaminated item; smog worsens locally.
- Reward/trace: `filter_layer`, `gasmask_filter`, `filter_receipt`.

Implementation recommendation:

- Prefer local POI container manipulation at generation or on interaction.
- Avoid scanning player inventory every frame.

DoD:

- Resource loss can be prevented by player action.
- The monster teaches "containers are part of combat prep".

#### monster_09: `pressovik` / Прессовик

Mode: A as room puzzle; B only if moving press body is needed.  
Primary floors: `production_belt`, `concentrate_press`, `MAINTENANCE`.  
Current gap: timed route hazard / boss as room puzzle.

Role:

- A production-line monster synchronized with pistons, conveyors or pressure doors.
- It is dangerous when the player fights on its rhythm.

Gameplay:

- Warning cue: warning light, floor mark, repeated slam.
- Counterplay: cross on safe beat, stop machine, lure ordinary monsters into press, shoot from side cover.
- Failure: high burst damage or forced retreat; no hidden instant death.
- Reward/trace: `gear`, `spring`, `metal_sheet`, production event.

Implementation recommendation:

- Implement as owned room logic using existing hazards/marks if possible.
- New kind is optional; the room rule matters more than the sprite.

DoD:

- Player can observe one full safe/unsafe cycle before required crossing.
- No per-frame full-room scan beyond bounded local positions.

#### monster_10: `nasosnaya_matka` / Насосная Матка

Mode: A as boss encounter using `MATKA`/`TUBE_EEL`; B later.  
Primary floors: `MAINTENANCE`, pressure/water POIs.  
Current gap: water pressure boss.

Role:

- A pump-room spawner that changes water lanes and spawns water-biased threats.
- Different from `MATKA`: tied to valves and pressure, not generic reproduction.

Gameplay:

- Warning cue: pumps pulse like breathing, water rises in two lanes, pressure gauge mark.
- Counterplay: close valves in order, fight on dry perimeter, use harpoon/electric tool, kill core after draining.
- Failure: room water expands locally, `TUBE_EEL` gets advantage, route becomes harder.
- Reward/trace: `manometer`, `valve_tag`, `pipe`, water resource event.

Implementation recommendation:

- Local boss room in maintenance; no global fluid sim.
- Spawn caps below current `MATKA` child cap, preferably 3-6 active adds.

DoD:

- The dry route remains possible.
- Valve interaction changes the fight state.

### Batch 3: Samosbor Residue, Slime, Food/Medicine Horror

#### monster_11: `myasomer` / Мясомер

Mode: C if noise markers are built; A as staged encounter first.  
Primary floors: samosbor aftermath on all non-VOID floors, `HELL`.  
Current gap: sound/noise predator.

Role:

- A thin post-samosbor hunter that reacts to sprinting, shooting, door bashing or repeated loud actions.
- It makes silence and patience tactically valuable.

Gameplay:

- Warning cue: wall heartbeat, raw-meat smell intensifies after noise, HUD/log line.
- Counterplay: stop firing, walk away, close door slowly, throw noise/bait, use suppressed/low-noise route if such item exists.
- Failure: it accelerates or calls `SBORKA`/`SHADOW` after noise burst.
- Reward/trace: `siren_shard`, `rawmeat`, event rumor.

Implementation recommendation:

- Do not implement broad acoustic simulation.
- If needed, add bounded `noise_marker` events from existing loud actions with TTL/cap like monster bait.

DoD:

- Noise response is readable and capped.
- Player can deliberately avoid triggering it.

#### monster_12: `chernaya_lichinka` / Черная Личинка

Mode: A first, B later.  
Primary floors: black slime POIs, `MAINTENANCE`, cult false-safe blocks.  
Current gap: slime cleanup enemy.

Role:

- A small residue larva that grows around black slime if the player ignores cleanup.
- It makes UV/fire/seal decisions matter.

Gameplay:

- Warning cue: black slime eyelets, clicking wet bubbles, UV flicker.
- Counterplay: UV spotlight, fire, seal sample, avoid stepping through, remove cultists from room.
- Failure: larva becomes `EYE` variant or spawns a small ambush; slime sample becomes more dangerous.
- Reward/trace: `slime_sample_black`, `psi_dust`, event for sealed residue.

Implementation recommendation:

- First wave can be `EYE`/`SBORKA` named encounter in `black_slime_eyes.ts`.
- New kind only if growth state becomes generic.

DoD:

- Cleanup path is as valid as killing.
- Growth is local, not a global timer across the map.

#### monster_13: `belaya_prislushka` / Белая Прислушка

Mode: A.  
Primary floors: white slime room, hospitals, communal shelters.  
Current gap: compulsion/NPC management.

Role:

- A white slime listener that pressures NPCs or the player to walk toward a bad door/source.
- It turns escort and shelter play into a decision.

Gameplay:

- Warning cue: NPC repeats one phrase, white residue faces toward door, screen text asks for quiet.
- Counterplay: break line of sight, escort NPC away, cover source, use antidep/psi item if available, burn residue.
- Failure: NPC opens/approaches danger, small monster spawn, reputation loss if ignored.
- Reward/trace: `slime_sample_white`, `antidep`, scientist/cult interest.

Implementation recommendation:

- Use local NPC behavior in owned room; no broad FSM rewrite.
- Publish event when witness is rescued or lost.

DoD:

- The player can save someone without killing the source.
- The cue is visible before the NPC is lost.

#### monster_14: `zhelemishnik` / Желемышник

Mode: A or B.  
Primary floors: `LIVING`, `KVARTIRY`, mushroom/zhelemish cellars.  
Current gap: resource monster tied to food/medicine economy.

Role:

- A human-fungal guardian around zhelemish patches.
- It makes "eat, sell, boil, surrender sample" a risky decision.

Gameplay:

- Warning cue: leathery skin flakes, jelly smell, wet cellar growth.
- Counterplay: salt/fire, harvest only outer patch, distract with dried zhelemish, bring scientist container.
- Failure: melee infection/status, patch spoils, NPC distrust if sold raw.
- Reward/trace: `zhelemish_raw`, `zhelemish_dried`, `slime_sample_brown`.

Implementation recommendation:

- First wave: local `ZOMBIE`/`POLZUN` variant in zhelemish cellar with harvest choice.
- If new kind: make it slow and tied to source patch, not roaming everywhere.

DoD:

- Player chooses between food, sample, medicine counterfeit or safe exit.
- Raw use remains risky, not pure buff.

#### monster_15: `samosbornyy_ostov` / Самосборный Остов

Mode: A first.  
Primary floors: post-samosbor rooms, hospitals, registry morgue, `HELL`.  
Current gap: loot-risk/container mimic without duplicating `REBAR`.

Role:

- A corpse shell that looks like aftermath loot until disturbed.
- Different from `REBAR`: organic/container/corpse context, not metal junk.

Gameplay:

- Warning cue: corpse breathes dust, flies avoid it, loot label feels too clean.
- Counterplay: poke/shoot from distance, scan by rumor, burn corpse, leave for liquidators.
- Failure: close ambush or black slime splash.
- Reward/trace: note, `rawmeat`, `bandage`, rare `samosbor_tally`.

Implementation recommendation:

- Use local item drop + hidden `ZOMBIE`/`SHADOW` spawn in owned POI.
- No need for new kind unless corpse-state gets reused widely.

DoD:

- The player has a clue before looting.
- The ambush does not punish every corpse in the game.

### Batch 4: Anomaly, Screen, Route, Perception

#### monster_16: `ekrannik` / Экранник

Mode: A first, C later if screen markers become generic.  
Primary floors: `MINISTRY`, `antenna_court`, `dark_metro`, `VOID`, procedural screens.  
Current gap: misinformation and screen/signal threat.

Role:

- A screen-bound enemy that uses terminals, warning screens or TV noise to create false leads and ranged pressure.
- It belongs to route cues and rumor systems.

Gameplay:

- Warning cue: screen line repeats player name/floor wrong, green or white frame, map hint contradicts room.
- Counterplay: break line of sight, turn off screen/fuse, shoot screen, ignore false marker, use screen only after clearing room.
- Failure: false route marker, `EYE`/`PARAGRAPH` shot, samosbor warning confusion.
- Reward/trace: `circuit_board`, `overexposed_photo`, rumor about signal nest.

Implementation recommendation:

- Start in a route-floor module using existing screen functions and `EYE`/`PARAGRAPH`.
- Generic screen marker hook should be capped and consumed only on interaction/proximity.

DoD:

- Misinformation is recoverable and clearly suspect.
- It never silently corrupts quest state.

#### monster_17: `perestanovshchik` / Перестановщик

Mode: A as anomaly encounter, C only after proof.  
Primary floors: procedural `teleport_cells`, `VOID`, `darkness`.  
Current gap: topology enemy.

Role:

- A route anomaly with a body: it swaps two local exits, cells or door labels after seeing the player.
- It makes chalk marks, route memory and minimap cues matter.

Gameplay:

- Warning cue: repeated doorway, floor number mismatch, map flicker.
- Counterplay: mark the correct door, kill/disable anchor, use paired cell intentionally, retreat before swap completes.
- Failure: player loops into side room, loses time, faces ambush.
- Reward/trace: `lift_scheme`, `void_spike`, topology rumor.

Implementation recommendation:

- First wave: owned procedural/anomaly room using existing `world.anomalyTeleports`.
- Avoid changing global floor transition or save route.

DoD:

- Swap is local and reversible/understandable.
- No softlocks; route back always exists.

#### monster_18: `hladonets` / Хладонец

Mode: A.  
Primary floors: procedural `hladon`, `MAINTENANCE`, cold service rooms.  
Current gap: cold pocket as active monster.

Role:

- A cold-pocket stalker that makes warmth/steam/route planning relevant.
- It extends Hladon without adding fluid/weather simulation.

Gameplay:

- Warning cue: frost mark, breath on screen, slowed NPCs.
- Counterplay: steam valve, heat item, boiler water, lure away from cold cells, avoid long fight.
- Failure: slow/needs drain inside radius, bad chase setup.
- Reward/trace: `boiler_water`, `asbestos_cord`, `valve_tag`.

Implementation recommendation:

- Local encounter around existing Hladon rooms using `SHADOW`/`TUBE_EEL` variant or new named monster.
- Runtime effects must be radius-capped.

DoD:

- Heat/steam response visibly changes the fight.
- Cold effect is bounded to marked cells/room.

#### monster_19: `seryy_smotritel` / Серый Смотритель

Mode: A.  
Primary floors: seroburmaline rooms, `VOID`, `darkness`.  
Current gap: no-look / perception rule.

Role:

- A watcher that is safer when not stared at or when approached through memory/marks.
- It turns camera/line-of-sight into a puzzle without needing full gaze simulation.

Gameplay:

- Warning cue: seroburmaline shimmer, afterimage on walls, NPC tells you to work by memory.
- Counterplay: route behind cover, close eyes via local interaction if available, use minimap/marks, break source mirror.
- Failure: PSI damage, wrong-door style displacement, `SHADOW` ambush.
- Reward/trace: `slime_sample_seroburmaline`, `psi_dust`, no-look rumor.

Implementation recommendation:

- Local room rule based on simple angle/line check at slow tick or interaction, not renderer gaze every frame.
- Can reuse `EYE`/`SHADOW`.

DoD:

- The player understands "do not stare" from layout and text.
- No frame-heavy ray checks beyond existing line helper or low-frequency local check.

#### monster_20: `maronary_signalshchik` / Маронарный Сигнальщик

Mode: A.  
Primary floors: `maronary` samosbor variant aftermath, screen-heavy route floors.  
Current gap: rare samosbor aftermath monster.

Role:

- A green-signal remnant that appears after Maronary-style warning and turns screens into risky navigational tools.
- It should reinforce an existing rare samosbor, not create a new variant.

Gameplay:

- Warning cue: high beep, green screen source, body-light mismatch.
- Counterplay: leave screen room, break source, follow non-green route cue, use ear/eye protection if existing item supports it.
- Failure: confusion, delayed route, `EYE` or `SPIRIT` pressure.
- Reward/trace: `overexposed_photo`, `bottled_voice`, event for green source sealed.

Implementation recommendation:

- Use `samosbor_variants.ts` existing Maronary hooks and a local aftermath POI.
- No new samosbor variant.

DoD:

- Encounter only appears where Maronary context is present or forced/debugged.
- It improves readability of the existing variant.

### Batch 5: High-Threat, Faction, Boss, Late Game

#### monster_21: `ostavshiysya_likvidator` / Оставшийся Ликвидатор

Mode: A first as NPC/monster encounter.  
Primary floors: post-samosbor `LIVING`, `MAINTENANCE`, liquidator floors, `HELL` threshold.  
Current gap: armed corrupted human-like threat with loot/reputation stakes.

Role:

- A lost liquidator after cleanup failure: armed, wounded, not purely monstrous.
- The player must decide: help, disarm, flee, kill, report.

Gameplay:

- Warning cue: broken respirator, wrong cleanup code, shotgun held too steady.
- Counterplay: talk from distance, show permit, throw med item, flank after reload, use cover.
- Failure: ranged burst, reputation hit, liquidator hostility if killed publicly.
- Reward/trace: ammo, `gasmask_filter`, liquidator rumor, moral debt.

Implementation recommendation:

- Use NPC hostile/faction systems first, not `MonsterKind`.
- If converted to monster later, it needs readable reload/aim logic, not instant hitscan.

DoD:

- Non-kill outcome exists.
- Loot is useful but killing has social cost.

#### monster_22: `chernobozhiy_svod` / Чернобожий Свод

Mode: A.  
Primary floors: cult false-safe blocks, `KVARTIRY`, `HELL`, cult workshops.  
Current gap: cult ritual as combat room rule.

Role:

- A cult-owned room anchor that protects cultists or black-hand marks until exposed/sealed.
- It is a boss-like condition, not a mobile DPS race.

Gameplay:

- Warning cue: black-hand marks align, silent safe block, cult supplies too organized.
- Counterplay: expose marker, steal/ruin supply, bring liquidator proof, destroy anchor, avoid shelter trap.
- Failure: cultist reinforcements, `SHADOW`/`IDOL` spawn, false shelter consequence.
- Reward/trace: `idol_chernobog`, `meat_rune`, faction event.

Implementation recommendation:

- Use existing cult modules and false-safe block tags.
- Avoid making cultists magic casters; keep it social contamination plus room mechanics.

DoD:

- Player can expose instead of only fight.
- Event residue changes rumor/faction state.

#### monster_23: `matka_dokumentov` / Матка Документов

Mode: A or B.  
Primary floors: `MINISTRY`, `raionsovet_archive`, `upper_bureau`.  
Current gap: bureaucratic boss encounter.

Role:

- A stationary archive boss that spawns or empowers `PARAGRAPH`/`PECHATEED` until the player handles files/stamps.
- It makes Ministry combat different from industrial combat.

Gameplay:

- Warning cue: forms crawl toward a central desk, stamp hits with no hand.
- Counterplay: burn wrong stack, stamp cancellation form, close cabinets, rush core, use decoy blank forms.
- Failure: more paper threats, document loss/delay, forced route to another office.
- Reward/trace: `unsigned_order`, `blank_form`, `psi_order_seal`.

Implementation recommendation:

- Local room puzzle first; new kind only if reused across Ministry.
- Spawn cap must be low, e.g. max 3-5 active paper threats.

DoD:

- Boss phase ends when office objective is solved.
- It has a paper/document solution, not just bullets.

#### monster_24: `pristav_pustoty` / Пристав Пустоты

Mode: A first, B later.  
Primary floors: `VOID`, `darkness`, protocol chambers.  
Current gap: late-game rule enemy.

Role:

- A void bailiff that enforces a temporary protocol: pay item, keep light borrowed, do not cross twice, do not shoot first.
- It extends existing void protocols with a hostile representative.

Gameplay:

- Warning cue: protocol line appears before the body, entity waits until violation.
- Counterplay: obey rule, pay small cost, break protocol anchor, deliberately violate and prepare.
- Failure: `SPIRIT`/`PARAGRAPH` spawn, item tax, route penalty.
- Reward/trace: `void_spike`, `psi_mark`, protocol rumor.

Implementation recommendation:

- Use `src/systems/void_protocols.ts` only if owned by one integrator; otherwise make a local chamber encounter.
- Do not create a universal law engine.

DoD:

- Rule is stated before enforcement.
- Violation is a choice, not an invisible trap.

#### monster_25: `remontnik_bez_smeny` / Ремонтник Без Смены

Mode: A or B.  
Primary floors: `service_floor`, `MAINTENANCE`, procedural workshops, post-samosbor aftermath.  
Current gap: repair/destruction consequence.

Role:

- A maintenance remnant that "repairs" the player's shortcuts by welding doors, moving tools, or restoring bad walls.
- It punishes careless destruction but can be bargained with through parts/permits.

Gameplay:

- Warning cue: welding light in empty corridor, tool cart moves between rooms.
- Counterplay: show work order, give part, steal tool before it sees, lure away, kill for tools.
- Failure: local shortcut closes, repair quest changes, nearby machinery wakes.
- Reward/trace: `wrench`, `gear`, `sealant_tube`, repair rumor.

Implementation recommendation:

- Start as local maintenance POI with route alternative.
- If new kind, give it low combat stats but strong local route effect.

DoD:

- It changes only local route state and never seals the only exit.
- Noncombat repair/trade resolution exists.

## 9. Recommended First Wave

If only five monster tasks can run first, pick these because they cover the most gameplay gaps with manageable scope:

1. `monster_02_plombirovshchik`: door/shelter route denial using existing Shovnik patterns.
2. `monster_06_kabelnik`: visible tether/trap rule for Maintenance.
3. `monster_12_chernaya_lichinka`: black slime cleanup pressure using existing slime/UV hooks.
4. `monster_16_ekrannik`: screen/signal misinformation tied to procedural screens.
5. `monster_21_ostavshiysya_likvidator`: non-kill armed post-samosbor encounter.

If twenty-five tasks run in parallel, split them by mode:

- Agents 1-15 should mostly do Mode A local encounters/variants.
- Agents 16-20 can prototype bounded generic hooks, but only one hook owner per hook.
- Agents 21-25 should be integration/audit tasks, not more new enums.

## 10. Future `monster_N.md` Prompt Template

Use this exact shape when generating worker files.

```md
# monster_N_<slug>

Model: GPT-5.5
Reasoning: xhigh
Parallel role: <unique ownership summary>

<AGENT_PROMPT id="MONSTER_N_<SLUG>">
PROMPT IDENTIFIED: MONSTER_N_<SLUG> | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and every file in your absolute write scope.
3. Read relevant monster files:
   - `src/entities/monster.ts`
   - `src/data/monster_ecology.ts`
   - `src/data/monster_variants.ts`
   - `src/systems/ai/monster.ts` only if the task explicitly owns an AI hook.
4. Create `Docs/Tasks/Status_MONSTER_N_<SLUG>.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_N_<SLUG>.md`.
6. Run baseline `npm run typecheck` and record exact result.

## Goal

Implement <monster name> as <gameplay role>, not as a sprite-only addition.

## Absolute Write Scope

Owned:
- <exact source files>
- `Docs/Tasks/Status_MONSTER_N_<SLUG>.md`
- `Docs/AgentLogs/LOG_MONSTER_N_<SLUG>.md`
- Optional focused test: `tests/monster_N_<slug>.test.ts`

Read for context:
- `README.md`
- `architecture.md`
- `desdoc.md`
- `monsters.md`
- <relevant source files>

Forbidden:
- Do not edit `main.ts`, `core/world.ts`, `render/webgl.ts`, package metadata, or broad systems unless explicitly listed as owned.
- Do not add runtime dependencies.
- Do not add unbounded scans, unbounded spawns, DOM UI, or global per-frame logic.
- Do not import another unfinished monster_N module.

## Design Contract

- id:
- ru_name:
- mode:
- floors:
- room/context:
- warning cue:
- counterplay:
- failure result:
- reward/trace:
- event/rumor hook:

## Implementation Tasks

1. Implement the smallest playable slice.
2. Add reachable encounter or debug path.
3. Publish a `WorldEvent` if the world state changes.
4. Add/update rumor/counterplay text if applicable.
5. Keep behavior bounded by local room, cooldown, radius, cap, or generation-time work.
6. Run `npm run typecheck`; for generator/system/render/save changes run `npm run check` unless blocked by real environment failure.

## Done Means

- The monster changes player tactics.
- The player has at least one readable counterplay.
- The encounter is reachable.
- The change respects layer boundaries.
- Validation results are recorded with exact commands.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the monster is only a name, sprite, or HP/speed variant, stop and redesign it around a player decision.
</POLISH_MANDATE>
```

## 11. Integration Checklist For A True New MonsterKind

Only use this when Mode B is approved.

1. `src/core/types.ts`: add `MonsterKind.<ID>` with one-line role comment.
2. `src/entities/<id>.ts`: export `DEF: MonsterDef` and `generateSprite()`.
3. `src/entities/monster.ts`: import DEF/sprite, add to `MONSTERS`, `MONSTER_SPRITES`, optional floor lists.
4. `src/data/monster_ecology.ts`: add ecology row with floors, rooms, variants, spawn weight, rare flag, counterplay, loot hint, rumor ids, rare drops.
5. `src/data/monster_variants.ts`: add variants only if they change tactics.
6. `src/data/rumors.ts`: add at least one useful rumor that reveals floor/room/counterplay context.
7. `src/systems/rpg.ts`: add XP value.
8. `src/systems/world_log.ts`: add display name if events/log need it.
9. `src/entities/procedural_visuals.ts`: add palette only if default mutation is unreadable.
10. Generation: add one reachable spawn through floor content, procedural bias, contract, or debug.
11. Tests: `tests/content-registry.test.ts` should keep passing; add focused test if a system hook was introduced.

Do not add a new kind unless the design cannot be expressed by `MonsterVariantDef`, named encounter, or local POI.

## 12. Validation Rules

For docs-only `monster_N.md` generation:

- no typecheck required, but generated prompt must include validation requirements.

For data-only monster variant/ecology/rumor:

- run `npm run typecheck`;
- run `npm run test:unit` if content registry or ids change.

For generator/system/render/save changes:

- run `npm run check` unless blocked;
- if blocked, record exact command and first real error.

For AI changes:

- add focused test or debug scenario;
- verify no unbounded full-world scan;
- verify scan cooldown/radius/cap.

For render/readability:

- visually check if the change affects HUD/WebGL/canvas;
- no DOM-heavy UI.

## 13. Final Taste Rules

- Russian player-facing monster text is normal.
- Names should feel like building maintenance, Soviet bureaucracy, communal fear, aftermath science, or тредовый urban folklore.
- Avoid heroic fantasy taxonomy. These are not species in a clean bestiary; they are recurring behavior models after samosbor.
- Prefer "I know what to do differently next time" over "I need bigger numbers".
- A monster that can be avoided, exposed, sealed, distracted or used against another threat is usually better than a monster that only dies.
