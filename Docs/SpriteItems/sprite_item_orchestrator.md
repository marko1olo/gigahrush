# Sprite Item Orchestrator

Target owner: final integration agent after future parallel GPT-5.5 item-sprite bundle workers.

## Mission

Integrate all bundle-level sprite work into one coherent procedural item sprite pass. The goal is that every item id in the current registry has a recognizable sprite in world drops and a matching icon in inventory/container grids.

## Current Prepared System

- `src/render/item_sprites.ts` provides a generic procedural item sprite generator keyed by `defId`.
- `src/render/webgl.ts` can derive item drop textures from `EntityType.ITEM_DROP.inventory` without changing save payload.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts` draw item icons next to text in their canvas grids.
- `tests/item-sprites.test.ts` covers all 431 current item ids and confirms item-drop visual ids come from inventory payload only.
- `Docs/SpriteItems/sprite_item_bundle_001.md` through `Docs/SpriteItems/sprite_item_bundle_050.md` replace the deleted single-item plan files and preserve their item-level requirements.

## Mandatory Intake

- `README.md`
- `architecture.md`
- `Docs/SpriteItems/README.md`
- `Docs/SpriteItems/sprite_item_000_manifest.md`
- All changed `Docs/SpriteItems/sprite_item_bundle_*.md` bundle files
- Relevant source diffs
- `git status --short`

## External Reference Guardrails

Use external references only as motif checks, not as copied art. The relevant motifs collected on 2026-05-26 are:

- Samosbor wiki: sirens, hermodoor pressure, unknown lethal anomaly, do-not-look dread.
- Gigakhrushchevka wiki/community pages: worn concrete, pipes, talons, ration economy, mold, repair culture.
- Food/culture/liquidator pages: concentrates, surrogate alcohol, handmade books, TV/radio, shotguns/flamethrowers/heavy cleanup gear.
- 2ch archives: noisy community tone; use only repeated motifs such as hermodoors, lifts/trains, production, wet meat smell, loose canon.
- Existing game source remains primary: monster sprites, durak cards, billboards/posters, eyes, procedural screens.

## Integration Order

1. Review completed bundle files and group by batch inside each bundle.
2. Merge data-free procedural visual rules into `src/render/item_sprites.ts`.
3. Keep `webgl.ts` as a generic hook only; reject per-item render branches there.
4. Preserve inventory/container layout readability on desktop and mobile.
5. Add or update tests only around generic sprite generation, registry coverage and UI/layout risks.
6. Update README only for shipped, verified behavior facts.

## Conflict Rules

- Prefer one generic visual resolver over hundreds of explicit sprite constants.
- Prefer procedural sprites over imported assets.
- Keep item-specific data in tags/registries/generator helpers, not the game loop.
- If two workers propose different visuals for the same item, choose the one with clearer 16-24px silhouette and stronger gameplay read.
- If workers edit shared files concurrently, orchestrator performs the final single merge.

## Reject

- New runtime dependency, asset pipeline, imported UI icon pack or hand-copied external art.
- Save shape changes for static item visuals.
- Renderer-owned gameplay state.
- Content-specific logic in `main.ts`, `core/world.ts`, or broad `render/webgl.ts` branches.
- Dead sprite rules for unreachable items without a debug or gameplay inspection path.

## Final Gate

- `npm run typecheck`
- `npm run test:unit`
- `npm run content:audit`
- `npm run check` for shared render/UI changes
- `npm run check:browser` when Chrome is available after WebGL/UI changes

## Patch Checklist

- What changed and why?
- Where is each new item visual visible: world drop, inventory, container, debug spawn?
- How does it react to samosbor? Expected answer: no special state, sprite derives from surviving item payload.
- Did it touch A-Life, factions, economy, quests, events, save/load, localization or render?
- What cache/cap prevents frame-time growth? Expected answer: WebGL item sprite texture cache and canvas icon cache.
- Which checks passed?
