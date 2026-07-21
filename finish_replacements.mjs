import fs from 'fs';

const fileList = fs.readFileSync('next_container_ids2.txt', 'utf8').split('\n').filter(Boolean);
const files = [...new Set(fileList.map(line => line.split(':')[0]))];

let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  const original = content;

  // More flexible replacement that catches multi-line or slightly different shapes
  // `while (X.containerById.has(id) || X.containers.some(c => c.id === id)) id++;`
  content = content.replace(/while\s*\(\s*([a-zA-Z0-9_\.]+)\.containerById\.has\s*\(\s*id\s*\)\s*\|\|\s*\1\.containers\.some\s*\(\s*[a-zA-Z0-9_]+\s*=>\s*[a-zA-Z0-9_]+\.id\s*===\s*id\s*\)\s*\)/g, 'while ($1.containerById.has(id))');

  // also look for map_editor.ts where it's a for-loop, maybe no change needed.

  if (content !== original) {
      fs.writeFileSync(file, content);
      totalReplaced++;
  }
}
console.log('Replaced in ' + totalReplaced + ' files');
