# ГИГАХРУЩ: Monster Design Bible

Stable root entrypoint for monster work.

The full detailed design bible currently lives at `gatbage/monsters.md` in this worktree. The per-agent prompt/audit files now live at `gatbage/Monster_01.md` through `gatbage/Monster_49.md`; this root file exists as the stable compatibility entrypoint.

Before implementing a monster task, read:

- `README.md`
- `architecture.md`
- `desdoc.md`
- `gatbage/monsters.md`
- the assigned `gatbage/Monster_N.md`
- all source files listed in that assigned prompt

Core rule: a monster is a gameplay rule with warning, counterplay, route/resource/social decision, event/rumor/trace, and bounded runtime cost. A sprite-only or HP-only addition is not enough.

File map:

- `gatbage/Monster_01.md`-`gatbage/Monster_25.md`: new monster/encounter design slots from the design bible.
- `gatbage/Monster_26.md`-`gatbage/Monster_49.md`: existing 24 `MonsterKind` audit/balance/readability tasks.
- Existing-monster audit files intentionally keep shared tables read-only by default, so parallel agents do not corrupt current monster behavior or fight over `monster_ecology.ts`, `monster_variants.ts`, `rpg.ts`, or broad AI.
