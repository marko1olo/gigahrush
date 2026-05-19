# Monster_28_POLZUN_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing POLZUN doorway/tank readability owner.

<AGENT_PROMPT id="MONSTER_28_POLZUN_AUDIT">
PROMPT IDENTIFIED: MONSTER_28_POLZUN_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/polzun.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/systems/monster_bait.ts`.
4. Create `Docs/Tasks/Status_MONSTER_28_POLZUN_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_28_POLZUN_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `POLZUN` / **Ползун** as a slow heavy threat that punishes doorways, bathrooms, water and narrow corridors.

## Absolute Write Scope

Owned:
- `src/entities/polzun.ts`
- `Docs/Tasks/Status_MONSTER_28_POLZUN_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_28_POLZUN_AUDIT.md`
- Optional test: `tests/monster_28_polzun_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve role: slow tank, not fast chaser.
- Counterplay must emphasize leaving doorway, straight retreat, bait, and distance.
- Do not raise speed enough to remove the player's planning window.
- Record desired shared ecology/variant changes in status/log.

## Implementation Tasks

1. Verify `hp`, `speed`, `dmg`, `attackRate` match heavy tier.
2. Add or sharpen local `counterplay` and `lootHint`.
3. Improve sprite silhouette if it does not read low/crawling.
4. Run `npm run typecheck`.

## Done Means

- Ползун is scary in tight passages and fair in open space.
- No global AI changes.
</AGENT_PROMPT>
