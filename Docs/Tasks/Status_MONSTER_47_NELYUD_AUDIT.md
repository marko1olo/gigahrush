# MONSTER_47_NELYUD_AUDIT Status

Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_47_NELYUD_AUDIT">` from `Monster_47.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/nelyud.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, and `src/gen/kvartiry/false_neighbor.ts`.
- Baseline command: `npm run typecheck`
- Baseline result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Audit Notes

- `aiFlags: ['closeReveal']` is correct and already consumed by the generic monster AI through the NELYUD-specific 6-cell detection/reveal radius.
- Stats stay unchanged at hp 80, speed 1.8, dmg 18, attackRate 1.4: this keeps Нелюдь inside the common close-threat band while making the social reveal, not raw numbers, the main rule.
- `src/entities/procedural_visuals.ts` already routes procedural NELYUD sprites through `corruptFalseHuman()`, so runtime monster sprites keep the false-human identity path.
- `src/gen/kvartiry/false_neighbor.ts` already provides a reachable close-reveal encounter with Рая as witness, a lamp, a side quest, and detector/fake-pass rewards.

## Changes

- Sharpened local `counterplay` to emphasize distance testing, witness/light, and keeping an exit instead of trusting the face.
- Sharpened local `lootHint` around fake domestic evidence, fake pass, and the rare detector.
- Polished the fallback NELYUD sprite in `src/entities/nelyud.ts`: still human at range, with close-up asymmetry, too-long hands, coat seam, and small face corruption cues.
- Kept `floors` on civil floors only: `LIVING`, `KVARTIRY`, `MINISTRY`.

## Shared Diff Requests

- None required for this audit.
- Broader false-neighbor expansion to LIVING/procedural false-safe blocks would need reassigned scope in generator/data files; the existing Kvartiry encounter is already manifest-wired and reachable.

## Validation

- Post-change command: `npm run typecheck`
- Post-change result: exit 0
- `npm run check`: not run; this audit is scoped to local entity metadata/sprite and docs unless implementation changes expand.
