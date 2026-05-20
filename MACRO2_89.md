# MACRO2_89: Void Protocol Backlash Clarity

Модель: GPT-5.5, reasoning extra high.

Цель: Void protocol choices state their rule, cost, backlash and success/failure cause before punishment.

Критично: late-game rule threats are strong only when the player can learn the rule.

Ownership: `src/systems/void_protocols.ts`, `src/gen/void/protocol_chamber.ts`, `src/gen/void/trace_seal_protocol.ts`, `src/render/quest_ui.ts`, tests.

Читать: `README.md Void`, `Docs/Expansions/10_void_afterprotocol/*`, `src/gen/void/**`.

Deliverables:
- UI/log text for rule, cost, accepted/rejected action;
- backlash events feed rumors/log/death cause;
- return portal freeplay path remains tested.

Проверки: `npm run test:unit`, debug Void protocol route.

Параллельные ограничения: no new final cosmology; local protocols only.
