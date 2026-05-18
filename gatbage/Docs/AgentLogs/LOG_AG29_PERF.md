# AG29 Performance Telemetry / Smoke Log

Date: 2026-05-17

## Baseline Verification

```txt
npm run typecheck
FAIL: pre-existing TypeScript errors outside AG29 write scope.

npm run test:unit
FAIL: same TypeScript gate before tests execute.

npm run build
PASS: dist/index.html 752.96 kB, gzip 232.19 kB, built in 1.07s.

npm run smoke
PASS: hudLit=36864, webglLit=1024.
```

## Post-Change Verification

```txt
npm run typecheck
PASS.

npm run test:unit
PASS: 25 tests.

npm run build
PASS: dist/index.html 1,005.50 kB, gzip 304.59 kB, built in 1.10s.

npm run smoke
PASS: hudLit=36864, webglLit=1024.

SMOKE_PERF_FRAMES=5 npm run smoke
PASS: hudLit=36864, webglLit=1024; frames=5, avgFrameMs=20.00, p95FrameMs=33.30, maxFrameMs=33.30.

npm run check
PASS: typecheck + 25 unit tests + build + smoke.
```

## Changes

- Added `tests/data-ids.test.ts` for deterministic registry and reference checks, including monster ecology and floor catalog rows.
- Updated `scripts/smoke-playability.mjs` to fail on blank WebGL pixel samples.
- Added optional smoke frame telemetry: `SMOKE_PERF_FRAMES=N npm run smoke`.
- Updated `README.md` build commands with the optional telemetry switch.

## Current Blocker

None for AG29. In-game update/render split counters remain intentionally unimplemented because the required call sites are outside the prompt's write scope.
