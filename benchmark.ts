import { performance } from 'perf_hooks';

interface Container {
  id: number;
}

const containers: Container[] = [];
for (let i = 1; i <= 10000; i++) {
  containers.push({ id: i });
}
const containerById = new Map<number, Container>();
for (const c of containers) {
  containerById.set(c.id, c);
}

const ctx = {
  world: {
    containers,
    containerById
  }
};

function nextContainerIdOld(ctx: any): number {
  let id = ctx.world.containers.length + 1;
  while (ctx.world.containerById.has(id) || ctx.world.containers.some((c: any) => c.id === id)) id++;
  return id;
}

function nextContainerIdNew(ctx: any): number {
  let id = ctx.world.containers.length + 1;
  while (ctx.world.containerById.has(id)) id++;
  return id;
}

// Warm up
for (let i = 0; i < 100; i++) {
  nextContainerIdOld(ctx);
  nextContainerIdNew(ctx);
}

// Setup a collision to trigger the loop
ctx.world.containerById.set(ctx.world.containers.length + 1, { id: ctx.world.containers.length + 1 });
ctx.world.containers.push({ id: ctx.world.containers.length + 1 });

const startOld = performance.now();
for (let i = 0; i < 1000; i++) {
  nextContainerIdOld(ctx);
}
const endOld = performance.now();

const startNew = performance.now();
for (let i = 0; i < 1000; i++) {
  nextContainerIdNew(ctx);
}
const endNew = performance.now();

console.log(`Old: ${endOld - startOld}ms`);
console.log(`New: ${endNew - startNew}ms`);
