# AGENT_119_README_FACT_PASS

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: factual README refresh owner.

<AGENT_PROMPT id="AGENT_119_README_FACT_PASS">
PROMPT IDENTIFIED: AGENT_119_README_FACT_PASS | DOMAIN: README / Shipped Facts / Third-Wave Documentation | ITERATION: 3.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/Tasks/Status_AG61_*.md` through `Status_AG118_*.md` if present, `scripts/content-audit.mjs`, `package.json`.
3. Create `Docs/Tasks/Status_AG119_README_FACT_PASS.md`.
4. Append final report to `Docs/AgentLogs/LOG_AG119_README_FACT_PASS.md`.
5. Run baseline `npm run typecheck` and record the result.

## Goal

Update README only with shipped behavior from the third wave after code lands. Keep roadmap/lore intent in `desdoc.md`, not README.

## Absolute Write Scope

Owned:
- `README.md`
- Status/log docs
- Tiny factual typo fixes in docs only

Forbidden:
- Do not implement gameplay.
- Do not describe planned content as shipped.
- Do not edit architecture policy unless a factual path changed and the user explicitly wants it.

## Implementation Tasks

1. Inventory implemented third-wave modules by reading source and status/log files, not by trusting prompts.
2. Run content audit/typecheck and record results.
3. Update counts only if you can verify them from code or existing audit scripts.
4. Add concise factual sections for shipped slime/cult/variant/monster/economy systems only if they exist.
5. Remove or avoid roadmap language in README.
6. Preserve README's role as implementation map.
7. Run `npm run typecheck`; run `npm run check` if source docs mention systems/render/generation changes needing validation.

## Done Means

- README matches code, not aspiration.
- Counts and feature claims are defensible.
- No gameplay or architecture changes are mixed in.
</AGENT_PROMPT>

<POLISH_MANDATE>
Be suspicious of impressive claims. If you cannot point to shipped code, keep it out of README.
</POLISH_MANDATE>
