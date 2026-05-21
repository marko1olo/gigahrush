# Scenario Writers

Status: active subordinate reference for player-facing text passes.

These packets describe voice, domain tone, target files and text-pass DoD. They do not document shipped behavior, do not override current source files, and do not create backlog by themselves.

## Status Map

| Path | Status | Use |
| --- | --- | --- |
| `../../scenarist.md` | active tone brief | Read before any gameplay text edit. It is the project-wide anti-pomp rule set. |
| `01_glavred_tone_bible.md` | active pointer | Redirects to `../../scenarist.md`; keep only as compatibility for older task links. |
| `02_*.md` through `36_*.md` | active voice/domain packets | Character, faction, profession, POI and social-group voice guides. |
| `37_*.md` through `42_*.md` | active surface/system text packets | Barks, rumors, notes, quests, contracts and ordinary samosbor text. |
| `43_istotit.md`, `44_maronary.md`, `45_veretar.md` | active rare-samosbor text packets | Use with current `src/data/samosbor_variants.ts`, `src/data/samosbor_director.ts` and related systems. |
| `46_*.md` through `50_*.md` | active late/domain packets | Hell, Ministry absurdity, monster counterplay, Net Sphere and final VOID/Tvorets text. |
| `game_text_inventory.md` | active working inventory | Generated player-facing text extraction from `src/**/*.ts`; use for broad scenario review/replacement passes, not as tone guidance. |
| `../../gatbage/**` | archive-only context | Historical prompts, logs and retired lore notes. Read only when a task explicitly asks for history or comparison. |

No file under `Docs/ScenarioWriters/` is archived as of this map. If a packet becomes stale, mark its status here before moving or deleting anything.

## Use Rules

1. Start with `README.md`, `architecture.md`, `scenarist.md` and the current source files that own the text.
2. Then read only the relevant scenario packet or packets.
3. Treat `Целевые файлы` as routing hints. If a path moved or a system changed, search current `src/` and follow the code.
4. Use these docs to rewrite vague, trailer-like or over-poetic text into concrete game text with speaker, place, action, price, risk, reward or joke.
5. Do not add items, quests, systems, factions or lore claims only because a scenario packet mentions them. Gameplay scope comes from current source, `desdoc.md` and the task.
6. If a packet conflicts with README facts, architecture rules, `desdoc.md` priorities or current source behavior, treat the packet as stale and keep the shipped behavior unchanged until the docs are corrected.
7. For code text changes, run at least `npm run typecheck`; for systems, generation, UI, render or save changes, run `npm run check`. Docs-only edits do not require typecheck.

Do not recreate `Docs/Tasks`, `Docs/AgentLogs`, `Docs/AgentPrompts` or `Docs/DesignFloors/AgentPrompts` for scenario work. Keep durable conclusions in `appendix.md` only when they are worth preserving.
