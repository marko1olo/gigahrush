# GIGAHRUSH Compute Audit Report

Status: AUDIT COMPLETE
Snapshot: 2026-05-22T00:47:56+01:00
Agent: GIGAHRUSH_COMPUTE_AUDITOR
Project root: `/Users/jirnyak/Mirror/gigahrush`

## Brief

`src/**/*.ts` currently contains 473 TypeScript files, 229,808 physical lines, and 213,044 meaningful lines by the audit heuristic. The main caveat is `src/data/bad_apple_frames.ts`: it is generated frame data and alone contributes 43,108 physical lines and 5.43 MB. Excluding it, runtime source is 472 files, 186,700 physical lines, 169,944 meaningful lines, and 7.98 MB.

The local Codex ledger for sessions attributed to this workspace is 3,568,001,004 total tokens after deduplicating repeated JSONL token events by session id. The cache ratio is 96.2101%. Using current standard GPT-5.5 public API rates as a pricing model, this is USD 2,769.85 cache-aware or USD 18,161.64 without cache. This is not an invoice.

Top-100 workspace sessions account for 1,992,820,764 tokens, or 55.8526% of the deduplicated token mass. That is the useful next audit target. Broad scanning below that is lower yield.

## Hard Numbers

| Metric | Value |
|---|---:|
| Source files, `src/**/*.ts` | 473 |
| Source physical LOC, `src/**/*.ts` | 229,808 |
| Source meaningful LOC, `src/**/*.ts` | 213,044 |
| Source logic density | 92.7069% |
| Runtime source files excluding `src/data/bad_apple_frames.ts` | 472 |
| Runtime source physical LOC excluding generated frames | 186,700 |
| Runtime source meaningful LOC excluding generated frames | 169,944 |
| Project code files counted | 586 |
| Project code physical LOC | 251,010 |
| Project code meaningful LOC | 231,999 |
| Test files, `tests/**/*.ts` | 91 |
| Test physical LOC | 14,820 |
| Active docs markdown LOC | 297,249 |
| Deduped JSONL workspace sessions | 713 |
| Deduped JSONL final-token sum | 3,568,001,004 |
| Input tokens | 3,555,135,410 |
| Cached input tokens | 3,420,398,208 |
| Output tokens | 12,865,594 |
| Reasoning output tokens, subset of output | 5,030,408 |
| Cached-input ratio | 96.2101% |
| Cache-aware current API estimate | USD 2,769.85 |
| No-cache equivalent | USD 18,161.64 |
| Cache avoided | USD 15,391.79 |
| Whole-period average | 12,961.58 tokens/sec |
| Whole-period minute rate | 777,695.03 tokens/min |
| Whole-period hour rate | 46,661,701.50 tokens/hour |
| Whole-period day rate | 1,119,880,836.09 tokens/day |
| Last 6h rate | 34,673.70 tokens/sec |
| Tokens per meaningful source LOC | 16,747.72 |
| Tokens per runtime meaningful LOC, generated frames excluded | 20,995.16 |
| Tokens per source byte | 266.114 |
| Tokens per runtime source byte, generated frames excluded | 447.011 |
| Cache-aware cost per meaningful source LOC | USD 0.013001 |
| Cache-aware cost per runtime meaningful LOC | USD 0.016299 |
| Energy by prompt constant, 0.05 Wh/token | 178.40 MWh |

## Evidence Rules

- Evidence classes used: FILESYSTEM, STATIC_DOC, JSONL, SQLITE, WEB_OFFICIAL, NPM_SCRIPT, CALC.
- `.codex` is live. This report is a point-in-time capture, not eternal truth.
- JSONL `token_count` events repeat and forked transcripts can embed another session's history. This audit does not sum every event and does not sum every JSONL file.
- Token totals are deduplicated by current `session_meta.id`: token events are associated with the nearest active session id, then the maximum `total_token_usage` per session is used.
- Workspace attribution is based on recorded Codex cwd/turn context for `/Users/jirnyak/Mirror/gigahrush`. It is not semantic proof that every thread changed this project. The top list includes some non-project-looking thread names, so diff attribution is still required before blaming a project feature or agent.
- Reasoning output is treated as part of output, not charged twice.
- Pricing uses public OpenAI standard GPT-5.5 text token rates: input USD 5.00/M, cached input USD 0.50/M, output USD 30.00/M. Sources: <https://openai.com/api/pricing/> and <https://developers.openai.com/api/docs/models/gpt-5.5/>.
- This is not an OpenAI invoice. It is local ledger accounting plus official public pricing.
- Energy is not measured. The energy row reuses the prompt constant implied by the source brief: 0.05 Wh/token.

## Source Scope

The source count is current filesystem state, not just committed git state. The repo is dirty, with many modified and untracked source files. The count intentionally includes those local changes because they are part of the workspace the user asked to audit.

Excluded from source metrics: `.git`, `node_modules`, `dist`, `tmp`, `gatbage`, `.wrangler`, `bad_apple`, `itch`.

Project code files include:

- `src/**/*.ts`
- `tests/**/*.ts`
- `scripts/**/*.mjs`
- `functions/**/*.ts`
- `cloudflare/d1/*.sql`
- `vite.config.ts`
- `index.html`
- `src/index.css`

Meaningful LOC is a heuristic count of nonblank lines that are not comment-only TypeScript/MJS lines. It is useful for scale comparison, not a parser-grade semantic measurement.

## Layer Breakdown

| Layer | Files | Physical LOC | Meaningful LOC | Bytes | Density |
|---|---:|---:|---:|---:|---:|
| `core` | 3 | 1,538 | 1,356 | 61,609 | 88.17% |
| `data` | 51 | 58,913 | 58,109 | 6,796,678 | 98.64% |
| `entities` | 64 | 8,166 | 6,974 | 327,077 | 85.40% |
| `gen` | 216 | 84,285 | 76,827 | 3,324,313 | 91.15% |
| `systems` | 102 | 57,681 | 52,764 | 2,157,307 | 91.48% |
| `render` | 31 | 13,329 | 11,677 | 513,962 | 87.61% |
| `src` root | 6 | 5,901 | 5,341 | 227,047 | 90.51% |

`data` density is inflated by generated/data-heavy files, especially `src/data/bad_apple_frames.ts`.

## Largest Source Files

| File | Physical LOC | Meaningful LOC | Bytes |
|---|---:|---:|---:|
| `src/data/bad_apple_frames.ts` | 43,108 | 43,100 | 5,425,898 |
| `src/main.ts` | 5,235 | 4,744 | 204,419 |
| `src/systems/ai/monster.ts` | 4,401 | 4,069 | 166,362 |
| `src/systems/samosbor.ts` | 3,172 | 2,920 | 121,358 |
| `src/gen/procedural_floor.ts` | 2,574 | 2,383 | 102,676 |
| `src/data/contracts.ts` | 2,174 | 2,153 | 215,733 |
| `src/gen/shared.ts` | 2,092 | 1,788 | 74,997 |
| `src/render/webgl.ts` | 2,078 | 1,717 | 80,591 |
| `src/systems/faction_events.ts` | 2,064 | 1,940 | 74,896 |
| `src/systems/debug.ts` | 1,800 | 1,694 | 76,802 |

## Token Ledger

The deduped token window spans 2026-05-18T19:19:27.879Z to 2026-05-21T23:47:22.959Z, or 275,275.08 seconds. All counted sessions report `gpt-5.5`.

Cost formula:

```txt
uncached_input = input_tokens - cached_input_tokens
cache_aware = uncached_input * 5.00/M + cached_input_tokens * 0.50/M + output_tokens * 30.00/M
no_cache = input_tokens * 5.00/M + output_tokens * 30.00/M
```

Computed inputs:

| Token bucket | Tokens |
|---|---:|
| Uncached input tokens | 134,737,202 |
| Cached input tokens | 3,420,398,208 |
| Output tokens | 12,865,594 |
| Total tokens | 3,568,001,004 |

## Top Workspace Sessions

| Rank | Thread | Tokens |
|---:|---|---:|
| 1 | Починить ИИ и спавн NPC | 92,364,045 |
| 2 | Разработать универсальный макробот | 90,161,986 |
| 3 | Расширить игру во всех направлениях | 70,002,504 |
| 4 | Увеличить NPC и мобов | 60,526,213 |
| 5 | Обнови ALife популяцию NPC | 52,279,580 |
| 6 | Парсить историю портфеля | 45,910,125 |
| 7 | Имплементировать планы Starcluster | 39,712,097 |
| 8 | Спроектировать редактор карт | 31,945,372 |
| 9 | Review plan_7 | 30,108,071 |
| 10 | Добавь Фурье мод звук-картинка | 29,510,657 |
| 11 | Review plan_5 | 28,674,037 |
| 12 | Locate plan_4.md | 28,409,626 |
| 13 | Продолжить Starcluster | 28,377,410 |
| 14 | Review plan_2.md | 28,334,360 |
| 15 | Исправить тексты под контекст игры | 26,798,104 |
| 16 | Проверь код | 25,783,102 |
| 17 | Review liquidator engineers | 25,729,130 |
| 18 | Review vanka banchiny doc | 24,063,506 |
| 19 | Add monster 29 | 23,816,147 |
| 20 | Продолжить фиксы и доработки | 23,017,874 |

Several top thread names are not obviously project-scoped. Treat this as a workspace-cwd ledger until each thread is joined to diffs, tests, and actual repo edits.

## Static Content Audit

`npm run content:audit` was run as a read-only validation step and failed with exit code 1.

Successful count output before the failure:

| Static counter | Value |
|---|---:|
| Plot NPC ids | 303 |
| Local NPC defs found | 104 |
| Plot chain steps | 16 |
| Side quest steps | 348 |
| Contracts | 133 |
| Item ids | 253 |
| Monster kinds | 60 |
| Monster registry entries | 56 |
| Monster variants | 5 |
| Rumors | 537 |
| Slime defs | 8 |
| Zhelemish defs | 3 |
| Procedural geometries | 10 |
| Procedural majority factions | 5 |
| Procedural anomalies | 19 |
| Design floor routes | 18 |
| Design floor generators | 18 |
| Manifest imports checked | 134 |
| Direct item call refs checked | 181 |

Failure class: missing rumor ids referenced from monster ecology/counterplay systems.

Unique missing ids:

- `ecology_panelnik_wall`
- `ecology_protokolnik_protocol`
- `ecology_lotochnik_drain`
- `lead_maintenance_lotochnik_lotok`
- `monster_olgoy_meat`
- `ecology_olgoy_collector`
- `ecology_kontorshchik_forms`
- `ecology_borshchevik_sap`
- `lead_maintenance_borshchevik_blockade`
- `ecology_gnilushka_restraint`
- `lead_living_lost_gnilushka_cell`

## Verdict

ГИГАХРУЩ is not a small TypeScript game anymore. The current source is 213,044 meaningful `src` LOC, or 169,944 meaningful runtime LOC when the generated Bad Apple frame table is excluded. Project code including tests, scripts, Cloudflare functions, SQL, config, HTML and CSS is 231,999 meaningful LOC.

The economic anomaly is not raw project size. It is workspace context recursion: 3.568B deduped local Codex tokens against 213,044 meaningful source LOC is 16,747.72 tokens per meaningful source line. Excluding generated frame data makes the ratio worse: 20,995.16 tokens per runtime meaningful line.

Cache pricing makes the estimated ledger survivable; it does not make the workflow clean. A 96.2101% cached-input ratio avoids about USD 15,391.79 under current GPT-5.5 public API pricing, but the top 100 sessions still hold more than half the token mass.

There is no valid proof from this audit that any one high-burn thread produced proportional code value. The next audit target is the top 100 `.codex` sessions: join each session to git diff, LOC delta, `npm run check` or failure output, and shipped gameplay effect. Until that join exists, high-burn accusations are not proven.

## Action Log

- Read `README.md`, `architecture.md`, `package.json`, and source tree layout.
- Counted current filesystem source and docs, with archive/build/dependency directories excluded.
- Parsed `~/.codex/sessions/**/*.jsonl` and `~/.codex/session_index.jsonl`.
- Checked `~/.codex/logs_2.sqlite` schema as supporting evidence that local logs exist, but did not use SQLite rows for token summation.
- Verified current GPT-5.5 pricing against official OpenAI pages.
- Ran `npm run content:audit`; it failed on missing rumor ids listed above.
