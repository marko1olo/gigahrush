# Status MONSTER_03_OCHEREDNIK

Date: 2026-05-18
Status: implemented, validation blocked by unrelated dirty-worktree TypeScript errors.

## Preflight

- Extracted `AGENT_PROMPT id="MONSTER_03_OCHEREDNIK"` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md` section for `ocherednik`, `AGENTS.md`, and required source files.
- Baseline command:

```txt
$ npm run typecheck
> gigahrush@1.0.0 typecheck
> tsc --noEmit
Exit: 0
```

## Implementation

- Added `src/gen/kvartiry/ocherednik.ts`.
- Integrated it through `src/gen/kvartiry/content_manifest.ts`.
- Encounter content:
  - bounded Kvartiry POI: `Коридор неподвижной очереди`;
  - internal choke wall with a lit side route;
  - named NELYUD leader `Первый номер`;
  - citizen witnesses, a liquidator observer, ration-paper trail, and queue containers;
  - noncombat coupon route through `kv_ocherednik_show_coupon`;
  - exposure route through `kv_ocherednik_expose_leader`;
  - violent route through `kv_ocherednik_fight_through`, with witnessed quest event and negative citizen relation delta.

## Validation

Post-implementation `npm run typecheck` first result:

```txt
$ npm run typecheck
> gigahrush@1.0.0 typecheck
> tsc --noEmit
src/gen/void/perestanovshchik.ts(5,3): error TS6133: 'Cell' is declared but its value is never read.
src/gen/void/perestanovshchik.ts(31,7): error TS6133: 'TAGS' is declared but its value is never read.
Exit: 2
```

`npm run check` result:

```txt
$ npm run check
> gigahrush@1.0.0 check
> npm run typecheck && npm run test:unit && npm run build
> gigahrush@1.0.0 typecheck
> tsc --noEmit
src/gen/living/golos_za_dveryu.ts(72,5): error TS2353: Object literal may only specify known properties, and 'weapon' does not exist in type 'PlotNpcDef'.
Exit: 2
```

Final re-run of `npm run typecheck` result:

```txt
$ npm run typecheck
> gigahrush@1.0.0 typecheck
> tsc --noEmit
src/gen/living/plombirovshchik.ts(413,30): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.
Exit: 2
```

The failing files are outside the MONSTER_03 write scope and were not modified here.

Additional focused runtime check:

```txt
$ npx tsx -e "import('./src/gen/kvartiry/index.ts').then(({ generateKvartiry }) => { const out = generateKvartiry(); console.log(JSON.stringify({ room: out.world.rooms.some(r => r.name === 'Коридор неподвижной очереди'), leader: out.entities.some(e => e.name === 'Первый номер') })); })"
[ZONE_CONTENT] duplicate zone HUD #62 while registering "Порог знакомого голоса"
[ZONE_CONTENT] duplicate zone HUD #62 while registering "Белая Прислушка"
[ZONE_CONTENT] duplicate zone HUD #62 while registering "Пломбировщик: локальная пломба двери"
{"room":true,"leader":true}
Exit: 0
```
