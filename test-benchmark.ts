import { performance } from 'node:perf_hooks';

const numSites = 1000;
const numContainers = 10000;

interface Container {
    id: number;
}
interface Site {
    containerId: number;
}

const containers: Container[] = Array.from({length: numContainers}, (_, i) => ({id: i}));
const sites: Site[] = Array.from({length: numSites}, (_, i) => ({containerId: Math.floor(Math.random() * numContainers)}));

function baseline() {
    let found = 0;
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const container = containers.find(c => c.id === site.containerId);
        if (container) found++;
    }
    return found;
}

function optimized() {
    let found = 0;
    const map = new Map<number, Container>();
    for (let i = 0; i < containers.length; i++) {
        map.set(containers[i].id, containers[i]);
    }
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const container = map.get(site.containerId);
        if (container) found++;
    }
    return found;
}

const t0 = performance.now();
for (let i = 0; i < 100; i++) baseline();
const t1 = performance.now();
console.log(`Baseline: ${t1 - t0}ms`);

const t2 = performance.now();
for (let i = 0; i < 100; i++) optimized();
const t3 = performance.now();
console.log(`Optimized: ${t3 - t2}ms`);
