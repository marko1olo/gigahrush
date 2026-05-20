# MACRO2_59: A-Life Witness And Residue

Модель: GPT-5.5, reasoning extra high.

Цель: NPCs see and remember theft, murder, samosbor, faction clash, rare monster and shortage in bounded form.

Критично: A-Life should create stories the player can hear and investigate.

Ownership: `src/systems/npc_memory.ts`, `src/systems/context.ts`, `src/systems/rumor.ts`, `src/systems/events.ts`, tests.

Читать: `desdoc.md P1 A-Life`, `src/systems/events.ts`, `src/systems/npc_memory.ts`.

Deliverables:
- compact witness fact shape with floor/zone/actor/action;
- dialogue/context lines surface recent facts;
- physical residue hook: mark, moved loot, scared NPC, price/zone change.

Проверки: `npm run test:unit`, manual theft/faction clash route.

Параллельные ограничения: fixed-size buffers only; no unbounded memory graph.
