# AG23 Documents / Forgery / Notes Log

## 2026-05-17 Document Utility Pass

What changed:
Added eight explicit document item ids using existing `ItemType.MISC`: official and forged permit slips, official and forged quarantine clearances, a ration registry extract, a forged ration card, an elevator access order, and a VOID archive warrant. Added 28 short note entries grouped by permit, quarantine, ration, elevator, archive, maintenance, and VOID themes.

Gameplay hooks:
Added five system contracts that consume or reward the new documents. Locked safes can now seed official document papers; secret stashes can seed forged papers. Added rumors that point players toward document utility and updated rumor event mapping for document pickups/events.

Integration notes:
No document editor, parser, or new UI screen was added. The existing печатеед document targeting already treats these papers as document-like through names/descriptions containing propusk, spravka, pechat, prikaz, or document keywords.

Verification:
Baseline `npm run build` passed in 744 ms.
`npm run typecheck` passed.
Final `npm run build` passed in 1.56 s.

Final counts:
188 item ids, 137 note strings, 38 contract definitions, 146 rumor definitions.
