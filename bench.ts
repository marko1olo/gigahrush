import { ensureEntityIndex } from './src/systems/entity_index';
import { EntityType, Entity } from './src/core/types';
import { performance } from 'perf_hooks';

const NUM_ENTITIES = 10000;
const ITERATIONS = 10000;
const monsterId = 9999;

const entities: Entity[] = [];
for (let i = 0; i < NUM_ENTITIES; i++) {
  entities.push({
    id: i,
    type: EntityType.NPC,
    x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0, name: 'NPC'
  } as Entity);
}

// Warmup
ensureEntityIndex(entities);

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  entities.find(e => e.id === monsterId);
}
const end1 = performance.now();
const findTime = end1 - start1;

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  ensureEntityIndex(entities).byId.get(monsterId);
}
const end2 = performance.now();
const indexTime = end2 - start2;

console.log(`Array.find(): ${findTime.toFixed(2)}ms`);
console.log(`EntityIndex.byId.get(): ${indexTime.toFixed(2)}ms`);
console.log(`Improvement: ${(findTime / indexTime).toFixed(2)}x faster`);
