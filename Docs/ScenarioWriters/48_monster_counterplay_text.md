# Сценарист 48: Монстры и counterplay

## Поверхность

Названия, counterplay, loot hints, слухи и warning barks для монстров. Монстр должен быть понятен через поведение, а не только HP/speed.

## Тон

Практический страх. "Что делать, где не стоять, чем пахнет, какой звук перед атакой". Не энциклопедия.

## Целевые файлы

- `src/entities/*.ts`: `counterplay`, `lootHint`, names.
- `src/data/monster_ecology.ts`
- `src/data/monster_variants.ts`
- `src/data/rumors.ts`: monster topic.
- `src/systems/ai/barks.ts`: combat warnings.

## Что переписать

1. Для каждого базового монстра проверить: есть ли readable counterplay.
2. Слухи о монстрах должны давать подсказки: дистанция, свет, документы, вода, углы, звук.
3. Loot hints должны быть предметными и без "эпической добычи".
4. Варианты монстров описывать через тактику: armored, ambush, ranged, water, document, lamp, wall.

## Примеры строк

- Сборка: "Быстрая, слабая, приходит не одна. Держи угол и не трать последний магазин на первую."
- Ползун: "Медленный, но в тесном проходе он уже рядом. Не отходи спиной к ванной."
- Глаз: "Любит лампы и прямую линию. Уйди за угол до вспышки."
- Печатеед: "Чует документы. Сбрось бланки или плати патронами и кровью."
- Арматурный: "Железо звенит перед ударом. Если на полу слишком ровно - не наступай."

## Игровая задача

Текст монстров должен улучшать combat readability. Игрок должен понимать, почему умер и как в следующий раз жить.

## DoD

- Все 24 base monster kinds reviewed.
- У каждого есть distinct counterplay line and loot hint style.
- Monster rumors align with mechanics.
- После entity/data changes `npm run typecheck`; AI changes `npm run check`.
