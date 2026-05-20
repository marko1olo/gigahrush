# Сценарист 41: Системные контракты

## Поверхность

Системные задания и процедурные поручения: kill, fetch, deliver, repair, inspect, escort-like talk, scarcity tasks. Их много, и они легко превращаются в однотипный generator text. Твоя задача - сделать их короткими, рабочими и разноголосыми.

## Тон

Заявка, наряд, просьба, сделка, приказ. Контракт должен звучать от того, кто его выдает: ликвидатор, домком, рынок, НИИ, Министерство, врач, рабочий.

## Целевые файлы

- `src/data/contracts.ts`
- `src/systems/contracts.ts`
- `src/systems/quest_deadlines.ts` if messages appear there.
- `src/data/rumors.ts`: contract-created/completed rumors.
- `src/systems/events.ts`: only if public event text needs adjusting.

## Что переписать

1. Проверить шаблоны на одинаковый голос. Разделить issuer tone.
2. Все контракты должны иметь цель, риск, награду, срок/дефицит if relevant.
3. Deadlines говорить бытово: "до отбоя", "до смены", "пока фильтр сухой", но механически оставить существующие численные сроки.
4. Не добавлять новый тип контракта без системы. Лучше использовать существующие QuestType.

## Примеры строк

- Ликвидатор: "Зачисти сектор у гермы. Плата патронами, если вернешься не с пустым магазином."
- Домком: "Принеси воду в общий ящик до отбоя. Потом будут считать не ведра, а фамилии."
- НИИ: "Доставь пробу не вскрывая. Если банка греется, меняй маршрут, не крышку."
- Рынок: "Забери долговую бумагу. Сжечь можно, но за целую платят."
- Медик: "Найди бинты. Любые, только без зелёного налета."

## Игровая задача

Контракты должны поддерживать core loop: lead, prepare, travel, decision, consequence. Каждый контракт - маленькая вылазка, не abstract task.

## DoD

- 40+ contract templates reviewed.
- Issuer voice visible in text.
- No generic "go retrieve item" unless wrapped in concrete risk.
- Для data-only `npm run typecheck`; contracts/systems changes `npm run check`.
