import { performance } from 'perf_hooks';
import { readFileSync } from 'fs';

// Extract the eventTags function logic to benchmark it
const BASE_TAGS = ['player', 'inventory', 'maronary', 'contraband', 'evidence'];

function shavingDef() {
  return { tags: Array.from({length: 100}, (_, i) => `def_tag_${i}`) };
}

function eventTagsOriginal(...extra) {
  const tags = [...BASE_TAGS, ...extra];
  const def = shavingDef();
  for (const tag of def?.tags ?? []) if (!tags.includes(tag)) tags.push(tag);
  return tags;
}

function eventTagsOptimized(...extra) {
  const tags = [...BASE_TAGS, ...extra];
  const tagSet = new Set(tags);
  const def = shavingDef();
  for (const tag of def?.tags ?? []) {
    if (!tagSet.has(tag)) {
      tagSet.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

function eventTagsSetOnly(...extra) {
  const tagsSet = new Set([...BASE_TAGS, ...extra]);
  const def = shavingDef();
  for (const tag of def?.tags ?? []) tagsSet.add(tag);
  return Array.from(tagsSet);
}

function benchmark(fn, name) {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const extra = Array.from({length: 100}, (_, i) => `extra_tag_${i}`);
    fn(...extra);
  }
  const end = performance.now();
  console.log(`${name}: ${end - start} ms`);
}

benchmark(eventTagsOriginal, 'Original');
benchmark(eventTagsOptimized, 'Optimized');
benchmark(eventTagsSetOnly, 'Set Only');
