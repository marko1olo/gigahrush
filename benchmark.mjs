const CONTENT_TAG = 'maintenance_pressovik';

function pressTagsOriginal(extra = []) {
  const tags = [CONTENT_TAG, 'monster', 'press', 'timing', 'production'];
  for (const tag of extra) if (!tags.includes(tag)) tags.push(tag);
  return tags;
}

function pressTagsOptimized(extra = []) {
  const baseTags = [CONTENT_TAG, 'monster', 'press', 'timing', 'production'];
  const tagSet = new Set(baseTags);
  for (const tag of extra) {
    tagSet.add(tag);
  }
  return Array.from(tagSet);
}

// Generate some data
const smallExtra = ['extra1', 'extra2', 'press', 'monster'];
const largeExtra = [];
for (let i = 0; i < 1000; i++) {
  largeExtra.push(`tag_${i % 100}`);
}

function runBenchmark(fn, data, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(data);
  }
  const end = performance.now();
  return end - start;
}

const iterations = 100000;

console.log('--- Small Data ---');
const originalSmall = runBenchmark(pressTagsOriginal, smallExtra, iterations);
const optimizedSmall = runBenchmark(pressTagsOptimized, smallExtra, iterations);
console.log(`Original: ${originalSmall.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedSmall.toFixed(2)}ms`);

console.log('\n--- Large Data ---');
const originalLarge = runBenchmark(pressTagsOriginal, largeExtra, 10000);
const optimizedLarge = runBenchmark(pressTagsOptimized, largeExtra, 10000);
console.log(`Original: ${originalLarge.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedLarge.toFixed(2)}ms`);
