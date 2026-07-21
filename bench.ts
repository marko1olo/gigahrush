import { World } from './src/core/world.js';
import { Cell } from './src/core/types.js';

function nextContainerIdOld(world: any): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id) || world.containers.some(c => c.id === id)) id++;
  return id;
}

function nextContainerIdNew(world: any): number {
  let id = world.containers.length + 1;
  while (world.containerById.has(id)) id++;
  return id;
}

const mockWorld = {
  containers: Array.from({ length: 10000 }).map((_, i) => ({ id: i + 1 })),
  containerById: new Map(Array.from({ length: 10000 }).map((_, i) => [i + 1, { id: i + 1 }]))
};

const startOld = performance.now();
for (let i = 0; i < 1000; i++) {
  nextContainerIdOld(mockWorld);
}
const endOld = performance.now();
console.log(`Old nextContainerId time: ${endOld - startOld}ms`);

const startNew = performance.now();
for (let i = 0; i < 1000; i++) {
  nextContainerIdNew(mockWorld);
}
const endNew = performance.now();
console.log(`New nextContainerId time: ${endNew - startNew}ms`);
