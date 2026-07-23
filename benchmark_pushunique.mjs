import { performance } from 'perf_hooks';

function pushUniqueArray(out, tag) {
  if (tag && !out.includes(tag)) out.push(tag);
}

function pushUniqueSet(out, tag) {
  if (tag) out.add(tag);
}

function benchArray() {
  const tags = [];
  for (let i = 0; i < 200; i++) {
    pushUniqueArray(tags, `tag_${i % 100}`);
  }
  return tags;
}

function benchSet() {
  const tags = new Set();
  for (let i = 0; i < 200; i++) {
    pushUniqueSet(tags, `tag_${i % 100}`);
  }
  return Array.from(tags);
}

const startA = performance.now();
for (let i = 0; i < 10000; i++) benchArray();
const endA = performance.now();
console.log(`Array: ${endA - startA} ms`);

const startS = performance.now();
for (let i = 0; i < 10000; i++) benchSet();
const endS = performance.now();
console.log(`Set: ${endS - startS} ms`);
