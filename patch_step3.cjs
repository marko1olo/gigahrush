const fs = require('fs');

let content = fs.readFileSync('src/gen/kvartiry/index.ts', 'utf8');

const helpers = `
function populateEntities(world: World, entities: Entity[], nextId: number): number {
  // Phase 9: Spawn NPCs (whole-floor natural baseline)
  const nid = { v: nextId };
  seedNpcPopulation(world, entities, nid, Faction.CITIZEN, CITIZEN_PROFILE);
  seedNpcPopulation(world, entities, nid, Faction.WILD, WILD_PROFILE);
  seedNpcPopulation(world, entities, nid, Faction.LIQUIDATOR, LIQUIDATOR_PROFILE, Occupation.HUNTER);
  nextId = nid.v;

  // Phase 10: Spawn items (ballots scattered everywhere)
  for (let i = 0; i < 500; i++) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * W);
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.FLOOR) continue;
      entities.push({
        id: nextId++, type: EntityType.ITEM_DROP,
        x: x + 0.5, y: y + 0.5, angle: 0, pitch: 0,
        alive: true, speed: 0, sprite: Spr.ITEM_DROP,
        inventory: [{ defId: 'ballot', count: rng(1, 3) }],
      });
      break;
    }
  }

  // Phase 11: Manifest-owned named NPCs
  nextId = spawnKvartiryNamedNpcs(world, entities, nextId);
  return nextId;
}

function locateSpawnPoint(world: World): { spawnX: number; spawnY: number } {
  // Phase 12: Find spawn point
  let spawnX = W / 2 + 0.5, spawnY = W / 2 + 0.5;
  for (let r = 0; r < 50; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const ci = world.idx(world.wrap(Math.floor(W / 2) + dx), world.wrap(Math.floor(W / 2) + dy));
        if (world.cells[ci] === Cell.FLOOR) {
          spawnX = world.wrap(Math.floor(W / 2) + dx) + 0.5;
          spawnY = world.wrap(Math.floor(W / 2) + dy) + 0.5;
          r = 999;
          break;
        }
      }
    }
  }
  return { spawnX, spawnY };
}

`;

content = content.replace(
  "function initBaseGrid(world: World)",
  helpers + "function initBaseGrid(world: World)"
);

const searchStartPhase9 = "  // ── Phase 9: Spawn NPCs (whole-floor natural baseline)";
const searchEndPhase13 = "  // ── Phase 13: Manifest-owned permanent themed rooms ──────────";

const idxStartPhase9 = content.indexOf(searchStartPhase9);
const idxEndPhase13 = content.indexOf(searchEndPhase13);

if (idxStartPhase9 !== -1 && idxEndPhase13 !== -1) {
  const replacementPhase9 = `  nextId = populateEntities(world, entities, nextId);

  const spawnPt = locateSpawnPoint(world);
  spawnX = spawnPt.spawnX;
  spawnY = spawnPt.spawnY;

`;
  content = content.substring(0, idxStartPhase9) + replacementPhase9 + content.substring(idxEndPhase13);
  fs.writeFileSync('src/gen/kvartiry/index.ts', content);
  console.log('Success');
} else {
  console.log('Failed to find Phase 9-12 replace block');
}
