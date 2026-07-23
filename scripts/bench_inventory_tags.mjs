import { performance } from 'perf_hooks';

const ITEM_TAGS = {
  test_item: Array.from({ length: 50 }, (_, i) => `tag_${i}`)
};

const def = {
  type: 'weapon',
  tags: Array.from({ length: 50 }, (_, i) => `def_tag_${i}`)
};

const defId = 'test_item';

function oldWay() {
  const tags = ['player', 'inventory', def?.type !== undefined ? `item_type_${def.type}` : 'item'];
  for (const tag of ITEM_TAGS[defId] ?? []) if (!tags.includes(tag)) tags.push(tag);
  for (const tag of def?.tags ?? []) if (!tags.includes(tag)) tags.push(tag);
  return tags;
}

function newWay() {
  const tagsSet = new Set(['player', 'inventory', def?.type !== undefined ? `item_type_${def.type}` : 'item']);
  for (const tag of ITEM_TAGS[defId] ?? []) tagsSet.add(tag);
  for (const tag of def?.tags ?? []) tagsSet.add(tag);
  const tags = Array.from(tagsSet);
  return tags;
}

const N = 100000;

console.log("Warming up...");
for (let i = 0; i < 10000; i++) {
  oldWay();
  newWay();
}

console.log("Running old way...");
const startOld = performance.now();
for (let i = 0; i < N; i++) {
  oldWay();
}
const endOld = performance.now();
const timeOld = endOld - startOld;
console.log(`Old way: ${timeOld.toFixed(2)} ms`);

console.log("Running new way...");
const startNew = performance.now();
for (let i = 0; i < N; i++) {
  newWay();
}
const endNew = performance.now();
const timeNew = endNew - startNew;
console.log(`New way: ${timeNew.toFixed(2)} ms`);
console.log(`Improvement: ${((timeOld - timeNew) / timeOld * 100).toFixed(2)}%`);
