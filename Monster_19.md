# Monster_19_Seryy_Smotritel

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: no-look perception encounter owner.

<AGENT_PROMPT id="MONSTER_19_SERYY_SMOTRITEL">
PROMPT IDENTIFIED: MONSTER_19_SERYY_SMOTRITEL | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/seroburmaline_no_look.ts`
   - `src/data/slime_defs.ts`
   - `src/gen/design_floors/darkness.ts`
   - `src/gen/void/protocol_chamber.ts`
   - `src/entities/eye.ts`
   - `src/entities/shadow.ts`
4. Create `Docs/Tasks/Status_MONSTER_19_SERYY_SMOTRITEL.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_19_SERYY_SMOTRITEL.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `seryy_smotritel` / **Серый Смотритель** as a local no-look/perception encounter around seroburmaline residue. Avoid heavy renderer gaze logic.

## Absolute Write Scope

Owned:
- New source file: `src/gen/void/seryy_smotritel.ts`
- `Docs/Tasks/Status_MONSTER_19_SERYY_SMOTRITEL.md`
- `Docs/AgentLogs/LOG_MONSTER_19_SERYY_SMOTRITEL.md`
- Optional focused test: `tests/monster_19_seryy_smotritel.test.ts`

Conditional integration:
- `src/gen/void/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add per-frame renderer gaze checks.
- Do not make "do not look" invisible or unexplained.
- Do not create a new PSI framework.

## Design Contract

- id: `seryy_smotritel`
- ru_name: `Серый Смотритель`
- mode: A local room rule
- floors: seroburmaline rooms, `VOID`, `darkness`
- room/context: shimmer room, mirror/source anchor, no-look route
- warning cue: seroburmaline shimmer, afterimage marks, NPC/log says work by memory
- counterplay: route behind cover, use marks/minimap, break source, approach through side corridor
- failure result: PSI damage, displacement, or `SHADOW` ambush
- reward/trace: `slime_sample_seroburmaline`, `psi_dust`, no-look rumor
- event/rumor hook: tags `monster`, `seroburmaline`, `no_look`, `psi`

## Implementation Tasks

1. Create a local Void or Darkness chamber with a visible watcher/source.
2. Use geometry and marks to teach not staring/standing in line.
3. Implement any line/angle check at interaction or slow/local cadence only.
4. Add a clear safe route using cover/marks.
5. Add a risky sample/reward after the source is disabled or bypassed.
6. Publish event for source watched, avoided, disabled, or sample taken.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player can infer and obey the rule.
- Runtime cost stays bounded.
- The encounter fits seroburmaline without new global perception systems.
</AGENT_PROMPT>

<POLISH_MANDATE>
Do not simulate eyes; design the room so line of sight is enough.
</POLISH_MANDATE>
