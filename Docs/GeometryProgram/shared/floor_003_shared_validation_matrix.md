# Shared Validation Matrix

Use this matrix for every geometry implementation branch.

Docs-only:

```bash
git diff --check
```

Narrow data/content:

```bash
npm run typecheck
npm run check:readonly
```

Generation, systems, save/load, AI, inventory, economy, quests, interactions, A-Life, rendering, UI, mobile or browser behavior:

```bash
npm run check
```

Browser/render/mobile/light/rail/input:

```bash
npm run check:browser
```

Manual assertions:

- spawn passable
- up/down lift rules correct
- non-sealed rooms reachable
- no ordinary choke isolates both lifts
- protected cells preserved
- population caps respected
- route cue visible
- samosbor either tested or explicitly exempt
- runtime caches invalidated
- dirty flags changed after mutation

For new ids:

- design floors: generator + data + manifest + test
- procedural geometry: id + def + generator + forced spec
- anomaly: id + def + generator + runtime hook if needed + stress test
