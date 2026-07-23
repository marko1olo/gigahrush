import { performance } from 'perf_hooks';

// Simulate CaravanLaneDef
const def = {
  id: 'lane_1',
  tariffResourceIds: Array.from({length: 50}, (_, i) => `res_${i}`),
  resourceDeltas: Array.from({length: 100}, (_, i) => ({ resourceId: `res_${i % 50}`, count: 1 })),
  corpIds: Array.from({length: 20}, (_, i) => `corp_${i}`)
};
const extra = Array.from({length: 30}, (_, i) => `extra_${i}`);

// Old functions
function uniqueResourceIdsOld(def) {
  const ids = [];
  for (const id of def.tariffResourceIds) {
    if (!ids.includes(id)) ids.push(id);
  }
  for (const delta of def.resourceDeltas) {
    if (!ids.includes(delta.resourceId)) ids.push(delta.resourceId);
  }
  return ids;
}

function caravanTagsOld(def, extra = []) {
  const tags = ['caravan', 'tariff', 'supply_lane', def.id];
  for (const resourceId of uniqueResourceIdsOld(def)) if (!tags.includes(resourceId)) tags.push(resourceId);
  for (const corpId of def.corpIds ?? []) {
    const tag = `corp_${corpId}`;
    if (!tags.includes(tag)) tags.push(tag);
  }
  for (const tag of extra) if (tag && !tags.includes(tag)) tags.push(tag);
  return tags;
}

// New functions
function uniqueResourceIdsNew(def) {
  const ids = new Set();
  for (const id of def.tariffResourceIds) {
    ids.add(id);
  }
  for (const delta of def.resourceDeltas) {
    ids.add(delta.resourceId);
  }
  return Array.from(ids);
}

function caravanTagsNew(def, extra = []) {
  const tags = new Set(['caravan', 'tariff', 'supply_lane', def.id]);
  for (const resourceId of uniqueResourceIdsNew(def)) tags.add(resourceId);
  for (const corpId of def.corpIds ?? []) {
    tags.add(`corp_${corpId}`);
  }
  for (const tag of extra) {
    if (tag) tags.add(tag);
  }
  return Array.from(tags);
}

// Benchmark
const iterations = 10000;

const startOld = performance.now();
for (let i = 0; i < iterations; i++) {
  caravanTagsOld(def, extra);
}
const endOld = performance.now();

const startNew = performance.now();
for (let i = 0; i < iterations; i++) {
  caravanTagsNew(def, extra);
}
const endNew = performance.now();

console.log(`Old: ${(endOld - startOld).toFixed(2)}ms`);
console.log(`New: ${(endNew - startNew).toFixed(2)}ms`);
