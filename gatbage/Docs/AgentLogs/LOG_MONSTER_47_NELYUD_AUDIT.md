# MONSTER_47_NELYUD_AUDIT Log

## Final Report

- Audited NELYUD as the existing false-human close-reveal monster.
- Confirmed `closeReveal` is wired in generic monster AI with a 6-cell reveal/detect radius, so Нелюдь does not become permanently obvious or aggressive at long range.
- Confirmed the procedural visual path already corrupts NELYUD through a false-human sprite generator.
- Confirmed the Kvartiry false-neighbor room is reachable through `content_manifest.ts` and already includes witness/light/quest/reward support.
- Updated only `src/entities/nelyud.ts` plus this status/log pair.
- Changed local counterplay and loot hint text to support suspicion, distance testing, witness/light, and fake-resident evidence.
- Polished the fallback sprite so it remains a human silhouette at range with close-up wrongness.

## Validation

- Baseline `npm run typecheck`: exit 0.
- Post-change `npm run typecheck`: exit 0.
- `npm run check`: not run; no shared systems, save/load, generation, rendering pipeline, or AI behavior was changed.
