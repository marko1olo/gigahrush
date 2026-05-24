# Items Orchestrator: Big Item And Weapon Update Control Plan

Status: control plan, not shipped behavior. Created 2026-05-24.

This file is for the coordinating GPT-5.5 pass after `items_1.md` through `items_5.md` have been used by parallel workers. It decides merge order, rejects dead data, checks source consistency and protects the game architecture.

For a one-agent-per-item run, use `items_000_manifest.md`: it maps the 201 unique item/update candidates to `items_001.md` through `items_201.md`.

## Scope Summary

The five work plans contain 207 candidate new/improved rows and should produce at least 100 useful accepted entries after dedupe:

| Plan | Domain | Target accepted count |
| --- | --- | ---: |
| `items_1.md` | Liquidator cleanup, PPE, filters, field gear | 32 candidates, accept 24-30 |
| `items_2.md` | Weapons, ammo, combat roles | 50 candidates, accept 20-30 |
| `items_3.md` | Documents, permits, access goods | 37 candidates, accept 24-30 |
| `items_4.md` | NII samples, slime, medicine, food | 43 candidates, accept 28-34 |
| `items_5.md` | Trade, production, contraband, electronics, resident goods | 45 candidates, accept 28-34 |

Do not implement all candidates blindly. The goal is a large content update with at least 100 useful entries or improvements, not a registry dump.

## Required Pre-Pass

Before five parallel implementation workers edit data, decide whether to add modular registries.

Current risk: `src/data/items.ts`, `src/data/weapons.ts` and `src/data/resources.ts` are shared yellow files. True parallel work will conflict without a pack system.

Recommended integrator pre-pass:

1. Add item pack registration in `src/data/items.ts` or a new `src/data/item_packs/index.ts`.
2. Add weapon pack registration for physical stats/role tiers if needed.
3. Add resource pack or a narrow appender if many resource mappings are expected.
4. Update `scripts/content-audit.mjs` only if static audits need to scan pack files.
5. Add tests proving pack items appear in `ITEMS`, weapon stats merge, ammo resource mapping works and duplicate ids fail loudly.

If this pre-pass is too much for the current turn, run workers sequentially or assign one owner for `src/data/items.ts`.

## Merge Order

1. Shared registry/tests pre-pass.
2. `items_1.md` cleanup/PPE data-only entries.
3. `items_4.md` sampleware/medicine/food entries that do not depend on documents.
4. `items_3.md` documents/access entries, including sample paperwork.
5. `items_5.md` production/trade entries and factory recipes.
6. `items_2.md` weapons/ammo stats after resource and access paths exist.
7. Generic use handlers, events and reachability modules.
8. Documentation fact updates after implementation is verified.

Reason: weapons and ammo create the most executable invariants, so they should land after resource/access support is available.

## Acceptance Gate For Every Item

Reject any candidate that lacks one of these:

- `id`: lowercase snake_case, object key equals `id`.
- Russian `name`.
- One-line Russian `desc` in existing dry game tone.
- Existing `ItemType`; no new item type by default.
- Tags if it participates in documents, samples, contraband, medicine, resources or counterplay.
- Resource mapping or explicit reason for no resource.
- Reachability: spawn room, container, NPC trade, contract, factory, route floor, samosbor aftermath, quest or one-per-run unique source.
- One decision: buy, steal, repair, seal, forge, report, hide, trade, burn, use, bait, save or spend.
- Validation coverage proportional to risk.

## Source Hierarchy

Use this order when sources conflict:

1. Current repo source and current `items.md`.
2. Stable repeated Samosbor motif across archive/wiki pages.
3. Samosbor Fandom/ShoutWiki variants that create a strong gameplay role.
4. Minecraft/Neo adaptations as item texture and survival/crafting vocabulary, not numeric balance.
5. Fanon/weak pages only as rumors, documents, prototypes or unique weird-route content.

Known decisions to preserve:

- `ЧИЖ-3` is treated as a pump shotgun/source variant unless stronger project evidence overrides it.
- `Грабли` are tool-first, weak weapon-second.
- Existing `flamethrower`, `uv_spotlight`, `homemade_pistol`, `toz_shotgun`, `nii_sample_container`, `slime_sample_*` are improved/reframed before duplicate roles are added.

## Conflict Hotspots

- `src/data/items.ts`: `ITEM_TAGS`, `ITEMS`, duplicate ids, object key/id mismatch, long descriptions.
- `src/data/weapons.ts`: `WeaponRoleTier`, role labels, stats, `ammoType`, projectile sprite/type, missing role tiers.
- `src/data/psi.ts`: PSI item/stat parity and description number parity.
- `src/data/resources.ts`: every ammo/resource item must exist; ammo must be explicit and reachable.
- `src/systems/inventory.ts`: ammo labels, document gates, use handlers, equipment labels, durability.
- `src/data/factories.ts`: recipes must have reachable inputs and meaningful outputs.
- `src/data/permits.ts`: document access rules and legal/forged pairs.
- Tests: `tests/data-ids.test.ts`, `tests/inventory-rpg.test.ts`, `tests/events-economy.test.ts`, `tests/economy-trade.test.ts`, `tests/inventory-atomic.test.ts`.

## System Rules

- No content-specific logic in `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.
- No new `FloorLevel`.
- No ordinary NPC refill.
- No per-frame full-world scans.
- No global gas/slime/fluid simulation for item content.
- No renderer-owned gameplay state.
- No save shape changes for data-only items.
- If persistent state is added, bump `SAVE_SHAPE_VERSION`, sanitize current-shape input and add tests.
- Important public facts should use `publishEvent()`.
- Runtime systems must have a cadence, radius, cap, dirty flag or fixed-size buffer.

## Weapon Rules

- Every `ItemType.WEAPON` must have executable stats.
- Every physical weapon needs a role tier.
- Every ranged weapon's `ammoType` must point to an existing item or self-ammo pattern already accepted by tests.
- Every ammo id must be `ItemType.AMMO`, `spawnRooms: []`, `spawnW: 0`, resource-mapped and reachable through a non-generic path.
- Do not add many specialty shells until ammo selection is either supported generically or modeled as separate weapons/launchers.
- Browser validation is required for new projectile/render behavior.

## Economy Rules

- Scarcity-sensitive goods belong in `RESOURCES`: ammo, filters, medicine, fuel, samples, documents, electronics, tools, food/water.
- Legal/illegal pairs should create price and access decisions, not just alternate names.
- Factory outputs should derive resource ids correctly through existing helpers.
- Do not use arbitrary prices copied from wikis. Convert role/scarcity into current `value`, `spawnW`, resource pressure and access path.

## Reachability Review

For each worker output, make a small matrix:

| Item group | Room loot | Containers | Contracts | Factory | NPC trade | Route/POI | Samosbor aftermath |
| --- | --- | --- | --- | --- | --- | --- | --- |

Every accepted item must mark at least one column. `spawnW: 0` items must not be invisible unless they are explicit future stubs, and future stubs should usually be rejected from implementation.

## Dedupe Pass

Before merge:

- Compare every proposed id against `ITEMS`.
- Compare Russian names against existing names.
- Compare role against existing weapons/tools/samples.
- Prefer improving existing ids when the mechanical role is the same.
- Keep unique lore variants only when source/access changes gameplay.

Examples:

- `daily_concentrate`, `white_concentrate`, `grey_briquette` likely need one final choice.
- `sealed_sample_jar` and `nii_sample_container` likely need one base item, not two.
- `wire_bundle` and `wire_coil` likely dedupe.
- `import_toiletpaper` and `toiletpaper` only both survive if trade/vending value differs.
- `eralashnikov_auto` and `ak47` must have distinct access/ammo/role.

## Validation Commands

After each major block:

```bash
git status --short
npm run typecheck
npm run content:audit
npm run test:unit
```

Before final handoff for source changes:

```bash
npm run check
```

Also run when relevant:

```bash
npm run test:generation
npm run check:browser
npm run check:full
```

Use `npm run check:browser` or `npm run check:full` for render, projectile, HUD, input, use interaction or browser behavior changes.

Docs-only planning changes can use:

```bash
git diff --check -- items.md items_1.md items_2.md items_3.md items_4.md items_5.md items_orchestrator.md
```

## Final Report Template

When the orchestrator completes the real implementation, report:

- What changed and why.
- Total new/improved item ids.
- Which existing ids were improved rather than duplicated.
- Where each item group is reachable.
- Which systems were touched: A-Life, factions, economy, quests, events, save/load, localization, render.
- How samosbor interacts with the new content or why it is exempt.
- What cap/cadence/cache/placement-time work prevents frame-time growth.
- Which docs were updated as shipped facts.
- Which checks passed.
