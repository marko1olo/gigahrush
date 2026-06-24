import { performance } from 'node:perf_hooks';
import { World } from './src/ecs/world.js';
import { registerRouteCue, ProceduralFloorSpec, WildRewardSite } from './src/gen/procedural_floor.js';

// Setup mock objects and run a benchmark on `registerWildMajorityRewardCues` logic
const numContainers = 10000;
const numSites = 1000;

const mockWorld: any = {
    containers: Array.from({length: numContainers}, (_, i) => ({
        id: i,
        x: i,
        y: i,
        roomId: i,
        zoneId: i,
        name: `container_${i}`
    })),
    routeCues: []
};

function mockRegisterRouteCue(world: any, cue: any) {
    world.routeCues.push(cue);
}

const mockSpec: any = {
    majorityId: 'wild',
    key: 'test',
    baseFloor: 0,
    geometryId: 'geom_1',
    anomalyId: 'anom_1',
    seed: 12345
};

const sites: any[] = Array.from({length: numSites}, (_, i) => ({
    containerId: Math.floor(Math.random() * numContainers),
    markerX: i,
    markerY: i,
    sourceRoom: { id: i },
    room: { id: i }
}));

function originalFunction(world: any, spec: any, sites: any[]) {
    if (spec.majorityId !== 'wild' || sites.length === 0) return;
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const container = world.containers.find((c: any) => c.id === site.containerId);
        if (!container) continue;
        mockRegisterRouteCue(world, {
            id: `procedural_${spec.key}_wild_reward_${container.id}`,
            x: site.markerX + 0.5,
            y: site.markerY + 0.5,
            targetX: container.x + 0.5,
            targetY: container.y + 0.5,
            floor: spec.baseFloor,
            roomId: site.sourceRoom.id,
            targetRoomId: container.roomId,
            zoneId: container.zoneId,
            label: 'дикая закладка',
            hint: 'следы ведут в тупик с добычей и засадой',
            targetName: container.name,
            color: '#d99137',
            // ... tags etc omitted for speed
            toneSeed: (spec.seed ^ container.id * 1667 ^ site.room.id * 919) >>> 0,
        });
    }
}

function optimizedFunction(world: any, spec: any, sites: any[]) {
    if (spec.majorityId !== 'wild' || sites.length === 0) return;

    // Create map for O(1) lookups
    const containerMap = new Map();
    for (let i = 0; i < world.containers.length; i++) {
        const c = world.containers[i];
        containerMap.set(c.id, c);
    }

    for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const container = containerMap.get(site.containerId);
        if (!container) continue;
        mockRegisterRouteCue(world, {
            id: `procedural_${spec.key}_wild_reward_${container.id}`,
            x: site.markerX + 0.5,
            y: site.markerY + 0.5,
            targetX: container.x + 0.5,
            targetY: container.y + 0.5,
            floor: spec.baseFloor,
            roomId: site.sourceRoom.id,
            targetRoomId: container.roomId,
            zoneId: container.zoneId,
            label: 'дикая закладка',
            hint: 'следы ведут в тупик с добычей и засадой',
            targetName: container.name,
            color: '#d99137',
            // ... tags etc omitted for speed
            toneSeed: (spec.seed ^ container.id * 1667 ^ site.room.id * 919) >>> 0,
        });
    }
}

let t0 = performance.now();
for (let i = 0; i < 100; i++) {
    mockWorld.routeCues = [];
    originalFunction(mockWorld, mockSpec, sites);
}
let t1 = performance.now();
console.log(`Original: ${t1 - t0}ms`);

t0 = performance.now();
for (let i = 0; i < 100; i++) {
    mockWorld.routeCues = [];
    optimizedFunction(mockWorld, mockSpec, sites);
}
t1 = performance.now();
console.log(`Optimized: ${t1 - t0}ms`);
