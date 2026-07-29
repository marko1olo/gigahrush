const n = 1000;
const inv = Array.from({length: n}, (_, i) => ({ defId: `item_${i}`, count: 1 }));
const slot = inv[999];
const start = performance.now();
for (let i = 0; i < 100000; i++) {
  // indexOf time:
  inv.indexOf(slot);
}
const end = performance.now();
console.log(`indexOf time: ${end - start} ms`);

const inv2 = Array.from({length: n}, (_, i) => ({ defId: `item_${i}`, count: 1 }));
const slot2 = inv2[999];
const set = new Set(inv2);
const start2 = performance.now();
for (let i = 0; i < 100000; i++) {
  set.has(slot2);
}
const end2 = performance.now();
console.log(`Set.has time: ${end2 - start2} ms`);

const inv3 = Array.from({length: 10}, (_, i) => ({ defId: `item_${i}`, count: 1 }));
const slot3 = inv3[9];
const start3 = performance.now();
for (let i = 0; i < 100000; i++) {
  inv3.indexOf(slot3);
}
const end3 = performance.now();
console.log(`indexOf time (10 items): ${end3 - start3} ms`);

const start4 = performance.now();
for (let i = 0; i < 100000; i++) {
  const s = new Set(inv3);
  s.has(slot3);
}
const end4 = performance.now();
console.log(`Set.has time (10 items, inline instantiation): ${end4 - start4} ms`);
