# Design Floors Index

Status: historical planning artifact that seeded the authored-floor wave. Current shipped route facts live in `README.md`, `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts` and `src/data/procedural_floors.ts`.

## Purpose

This folder turns the requested large floor wave into implementable slices for separate GPT-5.5 agents. Each `.md` is a floor brief with its own route id, intended TS ownership, gameplay role, NPC/quest surface, cross-floor hooks and Definition of Done.

The current game has 6 coded base floors, 15 routed authored design floors and procedural interstitial floors. This folder preserves the original agent briefs; do not treat the table below as the source of truth when it conflicts with shipped route data.

## Original Planned Vertical Route

Negative z is "up" by current project convention; positive z is "down". Each anchor below is separated from the next by three procedural floors.

| z | Route id | Display name | Main role | Doc |
| ---: | --- | --- | --- | --- |
| -40 | `roof` | Крыша | open sky, dynamic cloud ceiling, antennas | [roof.md](roof.md) |
| -36 | `chthonic_attic` | Хтонический чердак | upper occult concrete roots | [chthonic_attic.md](chthonic_attic.md) |
| -32 | `antenna_court` | Антенный двор | radio, weather lies, floor signals | [antenna_court.md](antenna_court.md) |
| -28 | `upper_bureau` | Верхнее бюро | elite paperwork, permits before Ministry | [upper_bureau.md](upper_bureau.md) |
| -24 | `ministry` | Министерство | full bureaucratic stealth/combat anchor | [ministry.md](ministry.md) |
| -20 | `raionsovet_archive` | Райсовет и Живой архив | access, records, identity | [raionsovet_archive.md](raionsovet_archive.md) |
| -16 | `registry_morgue` | Морг регистраций | body tags, deaths, legal identity | [registry_morgue.md](registry_morgue.md) |
| -12 | `kvartiry` | Квартиры | dense social riot floor | [kvartiry.md](kvartiry.md) |
| -8 | `manhattan_crossroads` | Перекрестки | asphalt roads, lanes, crossings | [manhattan_crossroads.md](manhattan_crossroads.md) |
| -4 | `communal_ring` | Коммунальное кольцо | apartment-like floors, shared services | [communal_ring.md](communal_ring.md) |
| 0 | `living` | Жилой | player hub and everyday survival | [living.md](living.md) |
| 4 | `floor_69` | Этаж 69 | adult vice, debt, blackmail, refuge | [floor_69.md](floor_69.md) |
| 8 | `black_market_88` | Черный рынок 88 | illegal economy, contracts, raids | [black_market_88.md](black_market_88.md) |
| 12 | `production_belt` | Производственный пояс | factories, shifts, output containers | [production_belt.md](production_belt.md) |
| 16 | `service_floor` | Служебный этаж | maintenance access, lift machines, staff routes | [service_floor.md](service_floor.md) |
| 20 | `collectors` | Коллекторы | water, pipes, pressure, tube monsters | [collectors.md](collectors.md) |
| 24 | `dark_metro` | Темная пересадка | мрачные маршруты, wrong station, darkness | [dark_metro.md](dark_metro.md) |
| 28 | `hell` | Ад | high-threat meat/cult combat | [hell.md](hell.md) |
| 32 | `underhell` | Ниже ада | stronger chthonic layer, sacrifice rules | [underhell.md](underhell.md) |
| 36 | `void` | Пустота | late anomaly protocol and final space | [void.md](void.md) |
| 40 | `darkness` | Тьма | post-void anti-floor, light as resource | [darkness.md](darkness.md) |

## Cross-Floor Spine

- Ministry and Raionsovet own documents that open roads, markets, factories and medical/morgue records.
- Manhattan Crossroads is the physical route fantasy: block grid, roads, crossings, ambushes, traffic-like flow, contracts that cross several entrances.
- Floor 69 and Market 88 share vice/debt/blackmail state, but Floor 69 must stay non-graphic and adult-only.
- Production feeds Market 88, Living scarcity, Ministry quotas and Collector repair parts.
- Service Floor and Collectors control lifts, pressure and water consequences for all lower floors.
- Hell, Underhell, Void and Darkness form the late descent: combat, ritual, protocol, then light failure.
- Roof, Antenna Court and Chthonic Attic make the upward route useful: sky, signal, weather, dangerous shortcuts and false safety.

## Agent Use

Each agent touching shipped floor code should read:

1. `README.md`
2. `architecture.md`
3. `Docs/DesignFloors/floor_contract.md`
4. its own floor doc
5. nearest existing source reference under `src/gen/`

Parallel implementation prompts from the completed floor waves are now historical context in `../../appendix.md`; original prompt files are archived under `../../gatbage/Docs/DesignFloors/AgentPrompts/`. Do not recreate this prompt folder unless a new explicit orchestration batch needs it. New floor work should start from this index, the relevant floor doc, `floor_contract.md`, README, architecture and current source.

Do not update `README.md` until a floor is actually implemented and validated.
