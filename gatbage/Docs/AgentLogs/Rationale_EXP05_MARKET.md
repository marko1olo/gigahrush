# EXP05_MARKET Rationale

## Decision 1: Market as adapter, not economy rewrite

Problem: Черный рынок должен давать scarcity, долги и контракты, но AG10 уже владеет economy/contracts/containers. Дублирование создаст конфликт и второй источник правды.

Solution: Документы фиксируют Market88 как thin illegal layer: market-owned access, debt templates, trader stock lanes and raid rules; AG10-owned base scarcity, contracts, Quest wrapping, containers and stack transfer.

Rejected Alternatives: Отдельная live market simulation, второй quest journal, отдельный item stack для товаров рынка. Это дороже, конфликтует с AG10 и делает exploit bugs вероятнее.

Scalability potential: Low - static lane scarcity and one pocket. Middle - explicit AG10 scarcity queries. High - samosbor/faction/production event hooks. Ultra - dense visual scene and more rows without changing aggregate logic.

Hardware Impact: Stable runtime target is 0 us/frame. Avoiding full-world container/NPC market scans saves roughly 1000-3000 us/frame on i3/MX350-class hardware in worst cases.

## Decision 2: Hidden pocket before Floor 88

Problem: EXP05 lore wants Black Market 88, but a new numbered floor would create dependencies on future floor-instance/metro/404 systems.

Solution: Implementation plan requires a hidden room/pocket with two MVP entries first: living password and maintenance hatch. Floor 88 is documented as later presentation once the loop is proven.

Rejected Alternatives: Adding permanent `FloorLevel.ROOM_88`, waiting for metro/404, or making a map-only shop. These choices either collide with future agents or fail playable MVP.

Scalability potential: Low - one pocket. Middle - two entry gates. High - ministry/metro adapters. Ultra - numbered 88 instance with the same market state.

Hardware Impact: One pocket adds generation and interaction cost only. It avoids full floor generation and keeps low-end cost near 0 us/frame outside entry interaction.

## Decision 3: Debts must have owners and consequences

Problem: Debt can become flavor text or an unbounded social-state mess.

Solution: Manifest requires five debt templates with explicit ownerId, dueAt, severity, settlement and consequenceId. Integration caps active debts at 64 and processes overdue state through cooldowned explicit events.

Rejected Alternatives: Anonymous debt flags, per-frame debt timers scanning all NPCs, or global social-credit implementation inside market MVP.

Scalability potential: Low - one debt flag with consequence. Middle - five templates. High - debt settlement contracts. Ultra - cross-expansion debts while preserving owner and cap.

Hardware Impact: Overdue checks should run on interaction/debug/time gates, not each frame. Estimated savings versus naive NPC debt scan: 500-2000 us/frame on low-end silicon.

## Decision 4: Debug is part of DOD

Problem: A planning doc without debug hooks lets future implementation become unverifiable, especially for delayed debt and raid states.

Solution: Manifest requires debug commands for status, price breakdown, password grant, debt creation/maturity, contract spawn, raid force and samosbor demand cycling.

Rejected Alternatives: Relying on random events or manual long playthroughs to verify market state.

Scalability potential: Low validates single-room market. Middle validates debt/raid. High validates scarcity and samosbor hooks. Ultra can add offline balance simulation without runtime cost.

Hardware Impact: Debug commands run on explicit input. Steady cost remains 0 us/frame; event checks are bounded and inspect small arrays.

