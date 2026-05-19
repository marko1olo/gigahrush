import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const outDir = path.resolve(root, 'itch');
const distHtml = path.resolve(root, 'dist', 'index.html');
const itchHtml = path.resolve(outDir, 'index.html');
const itchZip = path.resolve(outDir, 'gigahrush-itch.zip');
const itchNotes = path.resolve(outDir, 'ITCH_UPLOAD_NOTES.txt');
const uploadNotes = `Required itch.io HTML5 settings:
- Kind of game: HTML
- Upload: itch/gigahrush-itch.zip
- File setting: This file will be played in the browser
- Embed option for mobile: Mobile Friendly enabled
- Launch mode: Click to launch in fullscreen
- Scrollbars: disabled

Why: itch.io runs HTML5 games inside an iframe. On mobile, Mobile Friendly makes itch.io launch the game into a fullscreen/fill-window viewport. The game canvas is built to resize to that viewport.
The in-game FULL control requests browser fullscreen only where it is safe; from embedded mobile hosts it opens the direct game page. iPhone/WebKit forced fullscreen is disabled because it can reload the web view. The ZIP includes PWA manifest, icons, and service worker metadata for standalone launch.
`;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < crcTable.length; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c >>> 0;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function header(size) {
  return Buffer.alloc(size);
}

async function collectFiles(dir, prefix = '') {
  const entries = [];
  const items = await readdir(dir, { withFileTypes: true });
  items.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    const abs = path.join(dir, item.name);
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      entries.push(...await collectFiles(abs, rel));
    } else if (item.isFile()) {
      entries.push({ abs, rel });
    }
  }
  return entries;
}

async function zipFiles(entries, target) {
  const chunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of entries) {
    const data = await readFile(entry.abs);
    const meta = await stat(entry.abs);
    const compressed = deflateRawSync(data, { level: 9 });
    const name = Buffer.from(entry.rel, 'utf8');
    const crc = crc32(data);
    const { time, date } = dosDateTime(meta.mtime);
    const flags = 0x0800;
    const method = 8;

    const local = header(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    const central = header(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    chunks.push(local, name, compressed);
    centralChunks.push(central, name);
    offset += local.length + name.length + compressed.length;
  }

  const centralOffset = offset;
  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = header(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  await writeFile(target, Buffer.concat([...chunks, ...centralChunks, end]));
}

async function zipSingleFile(source, archiveName, target) {
  const data = await readFile(source);
  const meta = await stat(source);
  const compressed = deflateRawSync(data, { level: 9 });
  const name = Buffer.from(archiveName, 'utf8');
  const crc = crc32(data);
  const { time, date } = dosDateTime(meta.mtime);
  const flags = 0x0800;
  const method = 8;

  const local = header(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(flags, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);

  const centralOffset = local.length + name.length + compressed.length;
  const central = header(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(flags, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(date, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(0, 42);

  const end = header(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  await writeFile(target, Buffer.concat([local, name, compressed, central, name, end]));
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
await run(npm, ['run', 'build']);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await copyFile(distHtml, itchHtml);
await writeFile(itchNotes, uploadNotes);
const distFiles = await collectFiles(path.resolve(root, 'dist'));
if (distFiles.length <= 1) {
  await zipSingleFile(itchHtml, 'index.html', itchZip);
} else {
  await zipFiles(distFiles, itchZip);
}

const htmlSize = (await stat(itchHtml)).size;
const zipSize = (await stat(itchZip)).size;
console.log(`Itch.io build ready:`);
console.log(`- ${path.relative(root, itchHtml)} (${htmlSize} bytes)`);
console.log(`- ${path.relative(root, itchZip)} (${zipSize} bytes, upload this ZIP)`);
console.log(`- ${path.relative(root, itchNotes)} (required project settings)`);
