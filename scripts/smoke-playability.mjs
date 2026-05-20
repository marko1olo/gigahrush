import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const chromePath = process.env.CHROME_BIN
  ?? (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome');
const perfFrameCount = Math.max(0, Math.min(600, Number.parseInt(process.env.SMOKE_PERF_FRAMES ?? '0', 10) || 0));
const smokeScenario = (process.env.SMOKE_SCENARIO ?? '').toLowerCase();
const runThirdWave = envFlag('SMOKE_THIRD_WAVE')
  || smokeScenario === 'third-wave'
  || smokeScenario === 'third_wave'
  || smokeScenario === 'slime-cult'
  || smokeScenario === 'slime_cult';
const runExpedition = envFlag('SMOKE_EXPEDITION')
  || envFlag('SMOKE_LONG')
  || smokeScenario === 'expedition'
  || smokeScenario === 'long';
const runStress = smokeScenario === 'stress' || envFlag('SMOKE_STRESS');
const stressEntities = Math.max(0, Math.min(12000, Number.parseInt(process.env.SMOKE_STRESS_ENTITIES ?? '10000', 10) || 0));

const KEY = {
  enter: ['Enter', 'Enter', 13],
  w: ['KeyW', 'w', 87],
  e: ['KeyE', 'e', 69],
  i: ['KeyI', 'i', 73],
  q: ['KeyQ', 'q', 81],
  backquote: ['Backquote', '`', 192],
  arrowDown: ['ArrowDown', 'ArrowDown', 40],
  space: ['Space', ' ', 32],
};

const DEBUG_INDEX = {
  forceFactionEvent: 17,
  teleportLiving: 24,
  teleportMaintenance: 25,
  smokeExpeditionSetup: 29,
  forceVeretarSamosbor: 30,
};

function envFlag(name) {
  const value = process.env[name];
  if (!value) return false;
  return /^(1|true|yes|on)$/i.test(value);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate a local TCP port')));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`${url} returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function spawnLogged(command, args, name) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  child.stdout.on('data', data => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', data => process.stderr.write(`[${name}] ${data}`));
  return child;
}

function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    const done = () => resolve();
    child.once('exit', done);
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 1500).unref();
    setTimeout(done, 2500).unref();
  });
}

class CdpClient {
  constructor(wsUrl) {
    if (typeof WebSocket === 'undefined') throw new Error('Node WebSocket global is unavailable');
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve(), { once: true });
      this.ws.addEventListener('error', event => reject(new Error(`CDP websocket error: ${event.message ?? 'unknown'}`)), { once: true });
      this.ws.addEventListener('message', event => this.#onMessage(event));
    });
  }

  #onMessage(event) {
    const msg = JSON.parse(String(event.data));
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}: ${msg.error.data ?? ''}`));
      else resolve(msg.result);
      return;
    }
    if (msg.method && this.handlers.has(msg.method)) {
      for (const handler of this.handlers.get(msg.method)) handler(msg.params);
    }
  }

  on(method, handler) {
    const list = this.handlers.get(method) ?? [];
    list.push(handler);
    this.handlers.set(method, list);
  }

  once(method, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const handler = params => {
        clearTimeout(timer);
        const list = this.handlers.get(method) ?? [];
        this.handlers.set(method, list.filter(h => h !== handler));
        resolve(params);
      };
      this.on(method, handler);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  close() {
    this.ws.close();
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function openPage(debugPort, url) {
  const encoded = encodeURIComponent(url);
  try {
    return await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${encoded}`, { method: 'PUT' });
  } catch {
    try {
      return await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${encoded}`);
    } catch {
      const pages = await fetchJson(`http://127.0.0.1:${debugPort}/json/list`);
      const page = pages.find(p => p.type === 'page');
      if (!page) throw new Error('Chrome did not expose a debuggable page target');
      return page;
    }
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(describeException(result.exceptionDetails));
  }
  return result.result.value;
}

async function collectFrameTelemetry(client, frames) {
  if (frames <= 0) return undefined;
  return evaluate(client, `new Promise(resolve => {
    const target = ${frames};
    const samples = [];
    let last = 0;
    function step(t) {
      if (last > 0) samples.push(t - last);
      last = t;
      if (samples.length >= target) {
        const sorted = samples.slice().sort((a, b) => a - b);
        const sum = samples.reduce((acc, v) => acc + v, 0);
        resolve({
          frames: samples.length,
          avgMs: sum / samples.length,
          p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
          maxMs: sorted[sorted.length - 1],
        });
        return;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })`);
}

async function readGameDebug(client) {
  return evaluate(client, `window.__gigahrushSmokeState?.() ?? null`);
}

async function spawnStressPopulation(client, count) {
  return evaluate(client, `window.__gigahrushStressSpawn?.(${JSON.stringify(count)}) ?? null`);
}

async function waitForGameDebug(client, label, predicate, timeoutMs = 2000) {
  const startedAt = Date.now();
  let last = null;
  while (Date.now() - startedAt < timeoutMs) {
    last = await readGameDebug(client);
    if (last && predicate(last)) return last;
    await waitPage(client, 50);
  }
  throw new Error(`${label}: state did not match before timeout; last=${JSON.stringify(last)}`);
}

async function waitPage(client, ms) {
  const timeout = Math.max(0, Math.min(30000, Math.floor(ms)));
  await evaluate(client, `new Promise(resolve => setTimeout(resolve, ${timeout}))`);
}

async function waitFrames(client, frames = 2) {
  const count = Math.max(1, Math.min(20, Math.floor(frames)));
  await evaluate(client, `new Promise(resolve => {
    let left = ${count};
    function step() {
      left--;
      if (left <= 0) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })`);
}

async function dispatchKey(client, type, code, key, windowsVirtualKeyCode) {
  await client.send('Input.dispatchKeyEvent', {
    type,
    code,
    key,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
}

async function tapKey(client, keySpec, holdMs = 45, settleMs = 90) {
  const [code, key, vk] = keySpec;
  await dispatchKey(client, 'rawKeyDown', code, key, vk);
  await waitPage(client, holdMs);
  await dispatchKey(client, 'keyUp', code, key, vk);
  if (settleMs > 0) await waitPage(client, settleMs);
}

async function tapKeyImmediate(client, keySpec, settleMs = 90) {
  const [code, key, vk] = keySpec;
  await dispatchKey(client, 'rawKeyDown', code, key, vk);
  await dispatchKey(client, 'keyUp', code, key, vk);
  if (settleMs > 0) await waitPage(client, settleMs);
}

async function holdKey(client, keySpec, holdMs) {
  const [code, key, vk] = keySpec;
  await dispatchKey(client, 'rawKeyDown', code, key, vk);
  await waitPage(client, holdMs);
  await dispatchKey(client, 'keyUp', code, key, vk);
  await waitFrames(client, 2);
}

async function toggleDebugOverlay(client) {
  await dispatchKey(client, 'keyUp', KEY.backquote[0], KEY.backquote[1], KEY.backquote[2]);
  await waitFrames(client, 2);
  await tapKey(client, KEY.backquote, 120, 160);
  await waitFrames(client, 3);
}

async function tapDebugMenuDown(client) {
  await tapKey(client, KEY.arrowDown, 90, 90);
}

async function tapDebugMenuSelect(client) {
  await tapKey(client, KEY.e, 120, 120);
}

async function selectDebugCommand(client, index, label) {
  let state = await waitForGameDebug(client, `${label} debug menu ready`, value => value.showDebug);
  let guard = 0;
  while (state.debugSel < index && guard++ < index + 8) {
    const before = state.debugSel;
    await tapDebugMenuDown(client);
    state = await waitForGameDebug(
      client,
      `${label} debug move ${before}->${Math.min(index, before + 1)}`,
      value => value.showDebug && value.debugSel > before,
      1500,
    );
  }
  if (state.debugSel !== index) {
    throw new Error(`${label}: expected debugSel ${index}, got ${state.debugSel}`);
  }
  return state;
}

async function clickCanvasCenter(client) {
  const point = await evaluate(client, `(() => {
    const canvas = document.getElementById('game');
    const rect = canvas?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  })()`);
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: point.x,
    y: point.y,
    button: 'none',
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: point.x,
    y: point.y,
    button: 'left',
    buttons: 1,
    clickCount: 1,
  });
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: point.x,
    y: point.y,
    button: 'left',
    buttons: 0,
    clickCount: 1,
  });
  await waitPage(client, 80);
}

async function installInputTrace(client) {
  await evaluate(client, `(() => {
    window.__gigahrushSmokeKeys = [];
    document.addEventListener('keydown', event => {
      window.__gigahrushSmokeKeys.push({
        code: event.code,
        key: event.key,
        trusted: event.isTrusted,
        repeat: event.repeat,
      });
      if (window.__gigahrushSmokeKeys.length > 40) window.__gigahrushSmokeKeys.shift();
    }, true);
  })()`);
}

async function readSmokeDiagnostics(client) {
  return evaluate(client, `(() => ({
    focused: document.hasFocus(),
    readyState: document.readyState,
    pointerLocked: document.pointerLockElement?.id ?? '',
    keys: window.__gigahrushSmokeKeys ?? [],
  }))()`);
}

async function readRepoText(relPath) {
  try {
    return await readFile(path.join(root, relPath), 'utf8');
  } catch (err) {
    if (err?.code === 'ENOENT') return '';
    throw err;
  }
}

function quotedId(text, id) {
  return text.includes(`'${id}'`) || text.includes(`"${id}"`);
}

function hasAll(text, needles) {
  return needles.every(needle => text.includes(needle));
}

function markMissingIds(text, ids, scope, failures) {
  for (const id of ids) {
    if (!quotedId(text, id)) failures.push(`${scope} missing id "${id}"`);
  }
}

async function auditThirdWaveContent() {
  const [
    items,
    resources,
    contracts,
    slimeDefs,
    maintenanceManifest,
    blueGlowSample,
    greenAcidRoom,
    brownSlimeCleanup,
    slimeSamplePost,
    slimeFurnace,
    livingManifest,
    whiteCompulsion,
    factionEventDefs,
    factionEventSystem,
    samosborVariants,
    debugSystem,
  ] = await Promise.all([
    readRepoText('src/data/items.ts'),
    readRepoText('src/data/resources.ts'),
    readRepoText('src/data/contracts.ts'),
    readRepoText('src/data/slime_defs.ts'),
    readRepoText('src/gen/maintenance/content_manifest.ts'),
    readRepoText('src/gen/maintenance/blue_glow_sample.ts'),
    readRepoText('src/gen/maintenance/green_acid_room.ts'),
    readRepoText('src/gen/maintenance/brown_slime_cleanup.ts'),
    readRepoText('src/gen/maintenance/slime_sample_post.ts'),
    readRepoText('src/gen/maintenance/slime_deactivation_furnace.ts'),
    readRepoText('src/gen/living/content_manifest.ts'),
    readRepoText('src/gen/living/white_compulsion_room.ts'),
    readRepoText('src/data/faction_events.ts'),
    readRepoText('src/systems/faction_events.ts'),
    readRepoText('src/data/samosbor_variants.ts'),
    readRepoText('src/systems/debug.ts'),
  ]);

  const failures = [];
  const skips = [];
  const coverage = [];

  if (slimeDefs) {
    markMissingIds(slimeDefs, [
      'slime_brown',
      'slime_green',
      'slime_white',
      'slime_red',
      'slime_black',
      'slime_blue',
      'slime_silver',
      'slime_seroburmaline',
    ], 'SLIME_DEFS', failures);
    markMissingIds(items, [
      'slime_sample_brown',
      'slime_sample_green',
      'slime_sample_white',
      'slime_sample_red',
      'slime_sample_black',
      'slime_sample_blue',
      'slime_sample_silver',
      'slime_sample_seroburmaline',
    ], 'ITEMS slime samples', failures);
    if (!resources.includes('slime_samples')) failures.push('RESOURCES missing "slime_samples"');
    else coverage.push('slime data rail: 8 sample ids + slime_samples resource');
  } else {
    skips.push('slime data rail missing; slime sample content is optional and cannot be audited');
  }

  const sampleRoutes = [];
  function addSampleRoute(id, source, wiredNeedles, requiredNeedles, label) {
    if (!source) {
      skips.push(`${id}: source file missing`);
      return;
    }
    if (!hasAll(maintenanceManifest, wiredNeedles)) {
      skips.push(`${id}: source exists but Maintenance manifest does not wire it`);
      return;
    }
    if (!hasAll(source, requiredNeedles)) {
      failures.push(`${id}: wired source is missing expected route markers`);
      return;
    }
    sampleRoutes.push(label);
    coverage.push(`${id}: ${label}`);
  }

  addSampleRoute(
    'ag62_nii_sample_post',
    slimeSamplePost,
    ['generateSlimeSamplePost', './slime_sample_post'],
    ['nii_sample_container', 'ag62_sample_return', 'slime_sample_brown'],
    'NII sample post container/return path',
  );
  addSampleRoute(
    'ag68_blue_glow_sample',
    blueGlowSample,
    ['generateBlueGlowSample', './blue_glow_sample'],
    ['blue_glow_sample_sealed', 'registerWorldEventObserver', 'blue_glow'],
    'blue glow sealed sample trade/destruction path',
  );
  addSampleRoute(
    'ag64_green_acid_room',
    greenAcidRoom,
    ['generateGreenAcidRoom', './green_acid_room'],
    ['acidSample', 'acid_bottle', 'generateGreenAcidRoom'],
    'green acid sample pickup path',
  );

  if (brownSlimeCleanup && maintenanceManifest.includes('generateBrownSlimeCleanup')) {
    if (!contracts.includes('exp_maint_brown_slime_cleanup')) failures.push('brown cleanup route wired but contract id is missing');
    else coverage.push('ag63_brown_cleanup: room + contract id present');
  } else {
    skips.push('ag63_brown_cleanup: not wired in Maintenance manifest');
  }

  if (slimeFurnace && maintenanceManifest.includes('generateSlimeDeactivationFurnace')) {
    if (!hasAll(slimeFurnace, ['slime_deactivation_furnace', 'deactivated_residue'])) {
      failures.push('ag71_slime_deactivation_furnace wired but missing factory/output markers');
    } else {
      coverage.push('ag71_slime_deactivation_furnace: production cleanup path present');
    }
  } else {
    skips.push('ag71_slime_deactivation_furnace: not wired in Maintenance manifest');
  }

  if (whiteCompulsion && livingManifest.includes('./white_compulsion_room')) {
    coverage.push('ag65_white_compulsion_room: Living zone content registered');
  } else {
    skips.push('ag65_white_compulsion_room: not registered');
  }

  const cultIds = ['cult_liquidator_clash', 'cult_procession', 'black_hand_marks']
    .filter(id => quotedId(factionEventDefs, id));
  if (cultIds.length === 0) {
    skips.push('cult faction events missing; cult conflict browser path skipped');
  } else if (!factionEventSystem.includes('forceFactionEvent')) {
    failures.push(`cult faction events present (${cultIds.join(', ')}) but forceFactionEvent debug hook is missing`);
  } else {
    coverage.push(`cult faction events: ${cultIds.join(', ')}`);
  }

  const rareVariantIds = ['maronary', 'istotit', 'veretar'].filter(id => quotedId(samosborVariants, id));
  const hasDirectVeretarForce = debugSystem.includes("forceNextSamosborVariant('veretar')")
    && debugSystem.includes(`case ${DEBUG_INDEX.forceVeretarSamosbor}:`);
  const hasCycleVariantForce = debugSystem.includes('cycleForcedSamosborVariant') && debugSystem.includes('case 5');
  if (rareVariantIds.length === 0) {
    skips.push('rare samosbor variants missing; rare variant browser path skipped');
  } else if (!hasDirectVeretarForce && !hasCycleVariantForce) {
    failures.push(`rare variants present (${rareVariantIds.join(', ')}) but no debug force command was found`);
  } else {
    coverage.push(`rare samosbor variants: ${rareVariantIds.join(', ')}; force=${hasDirectVeretarForce ? 'veretar command' : 'cycle command'}`);
  }

  const debugHas = index => debugSystem.includes(`case ${index}:`);
  const runtime = {
    sampleRoute: sampleRoutes.length > 0 && debugHas(DEBUG_INDEX.teleportMaintenance),
    sampleRouteLabel: sampleRoutes[0] ?? '',
    cultForce: cultIds.length > 0 && factionEventSystem.includes('forceFactionEvent') && debugHas(DEBUG_INDEX.forceFactionEvent),
    rareForce: rareVariantIds.length > 0 && (hasDirectVeretarForce || hasCycleVariantForce),
    rareForceMode: hasDirectVeretarForce ? 'direct_veretar' : 'cycle',
    recoveryTeleport: debugHas(DEBUG_INDEX.teleportLiving),
  };

  if (sampleRoutes.length > 0 && !debugHas(DEBUG_INDEX.teleportMaintenance)) skips.push(`slime/sample route present but Maintenance teleport debug command is missing (case ${DEBUG_INDEX.teleportMaintenance})`);
  if (cultIds.length > 0 && !debugHas(DEBUG_INDEX.forceFactionEvent)) skips.push(`cult event defs present but force faction debug command is missing (case ${DEBUG_INDEX.forceFactionEvent})`);
  if (!debugHas(DEBUG_INDEX.teleportLiving)) failures.push(`debug recovery teleport to Living (case ${DEBUG_INDEX.teleportLiving}) is missing`);

  return { failures, skips, coverage, runtime };
}

function printThirdWaveAudit(audit) {
  console.log('Third-wave content audit');
  for (const line of audit.coverage) console.log(`- cover: ${line}`);
  for (const line of audit.skips) console.log(`- skip: ${line}`);
  for (const line of audit.failures) console.log(`- fail: ${line}`);
  if (audit.failures.length === 0) console.log('- required rails: ok');
}

async function maybeCaptureFailureScreenshot(client) {
  const target = process.env.SMOKE_SCREENSHOT_ON_FAIL;
  if (!target) return '';
  const result = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.resolve(root, target), Buffer.from(result.data, 'base64'));
  return target;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('CDP screenshot was not a PNG');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Unsupported PNG format bitDepth=${bitDepth} colorType=${colorType}`);
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += len + 12;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = y * stride;
    const prev = y > 0 ? row - stride : -1;
    for (let x = 0; x < stride; x++) {
      const value = raw[src++];
      const left = x >= bpp ? pixels[row + x - bpp] : 0;
      const up = prev >= 0 ? pixels[prev + x] : 0;
      const upLeft = prev >= 0 && x >= bpp ? pixels[prev + x - bpp] : 0;
      let out = value;
      if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + Math.floor((left + up) / 2);
      else if (filter === 4) out = value + paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      pixels[row + x] = out & 255;
    }
  }
  return { width, height, bpp, pixels };
}

function samplePngScene(buffer) {
  const png = decodePng(buffer);
  const x0 = Math.floor(png.width * 0.24);
  const x1 = Math.floor(png.width * 0.76);
  const y0 = Math.floor(png.height * 0.20);
  const y1 = Math.floor(png.height * 0.68);
  let lit = 0;
  let sum = 0;
  for (let y = y0; y < y1; y++) {
    const row = y * png.width * png.bpp;
    for (let x = x0; x < x1; x++) {
      const i = row + x * png.bpp;
      const rgb = png.pixels[i] + png.pixels[i + 1] + png.pixels[i + 2];
      sum += rgb;
      if (rgb > 12) lit++;
    }
  }
  return { sceneLit: lit, sceneSum: sum };
}

async function sampleRunning(client) {
  const sample = await sampleCanvases(client);
  const result = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  return {
    ...sample,
    ...samplePngScene(Buffer.from(result.data, 'base64')),
  };
}

async function sampleCanvases(client) {
  return evaluate(client, `(() => {
    const game = document.getElementById('game');
    const hud = document.getElementById('hud');
    const hctx = hud?.getContext('2d');
    const sample2d = (ctx, x, y, w, h) => {
      if (!ctx || w <= 0 || h <= 0) return { lit: 0, sum: 0 };
      const data = ctx.getImageData(x, y, w, h).data;
      let lit = 0;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const rgb = data[i] + data[i + 1] + data[i + 2];
        sum += rgb;
        if (rgb > 8) lit++;
      }
      return { lit, sum };
    };
    const hudW = hud?.width ?? 0;
    const hudH = hud?.height ?? 0;
    const hudCenterW = Math.min(360, hudW);
    const hudCenterH = Math.min(240, hudH);
    const hudCenterX = Math.max(0, Math.floor((hudW - hudCenterW) / 2));
    const hudCenterY = Math.max(0, Math.floor((hudH - hudCenterH) / 2));
    const hudCorner = sample2d(hctx, 0, 0, Math.min(192, hudW), Math.min(192, hudH));
    const hudCenter = sample2d(hctx, hudCenterX, hudCenterY, hudCenterW, hudCenterH);
    const gl = game?.getContext('webgl2') || game?.getContext('webgl');
    let webglLit = 0;
    let webglSum = 0;
    let webglError = '';
    if (gl && game instanceof HTMLCanvasElement) {
      try {
        const sw = 160;
        const sh = 90;
        const off = document.createElement('canvas');
        off.width = sw;
        off.height = sh;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(game, 0, 0, sw, sh);
        const pixels = octx.getImageData(0, 0, sw, sh).data;
        for (let i = 0; i < pixels.length; i += 4) {
          const rgb = pixels[i] + pixels[i + 1] + pixels[i + 2];
          webglSum += rgb;
          if (rgb > 8) webglLit++;
        }
      } catch (err) {
        webglError = String(err?.message ?? err);
      }
    }
    return {
      readyState: document.readyState,
      gameCanvas: game instanceof HTMLCanvasElement,
      hudCanvas: hud instanceof HTMLCanvasElement,
      gameWidth: game?.width ?? 0,
      gameHeight: game?.height ?? 0,
      hudLit: hudCorner.lit,
      hudSum: hudCorner.sum,
      hudCenterLit: hudCenter.lit,
      hudCenterSum: hudCenter.sum,
      webgl: Boolean(gl),
      webglLit,
      webglSum,
      webglError,
      bodyChildren: document.body.children.length,
    };
  })()`);
}

function requireTitleTelemetry(sample, failures) {
  if (!sample.gameCanvas || !sample.hudCanvas) failures.push('missing game or HUD canvas');
  if (sample.gameWidth < 640 || sample.gameHeight < 360) failures.push(`unexpected canvas size ${sample.gameWidth}x${sample.gameHeight}`);
  if (sample.hudLit < 10) failures.push(`title/HUD canvas appears blank (${sample.hudLit} lit samples)`);
}

function requireRunningTelemetry(sample, label, failures) {
  if (sample.readyState !== 'complete') failures.push(`${label}: document not complete: ${sample.readyState}`);
  if (!sample.gameCanvas || !sample.hudCanvas) failures.push(`${label}: missing game or HUD canvas`);
  if (!sample.webgl) failures.push(`${label}: WebGL context was not available`);
  if (sample.webglError) failures.push(`${label}: WebGL readPixels failed: ${sample.webglError}`);
  if (sample.hudLit < 10) failures.push(`${label}: HUD appears blank (${sample.hudLit} lit samples)`);
  if ((sample.sceneLit ?? 0) < 500) failures.push(`${label}: composited scene appears blank (${sample.sceneLit ?? 0} lit samples)`);
  if (sample.bodyChildren < 1) failures.push(`${label}: document body is empty`);
}

function requirePanelTelemetry(before, after, label, failures) {
  const delta = Math.abs(after.hudCenterSum - before.hudCenterSum);
  const required = Math.max(25000, Math.floor(before.hudCenterSum * 0.005));
  if (delta < required) {
    failures.push(`${label}: expected a visible HUD panel brightness change (beforeSum=${before.hudCenterSum}, afterSum=${after.hudCenterSum}, delta=${delta}, required>=${required})`);
  }
}

async function runDebugCommand(client, index, label, failures, options = {}) {
  const repeat = Math.max(1, Math.min(12, Math.floor(options.repeat ?? 1)));
  const closesOverlay = options.closesOverlay === true;
  const settleMs = Math.max(0, Math.min(8000, Math.floor(options.settleMs ?? 500)));
  const before = await sampleCanvases(client);
  await toggleDebugOverlay(client);
  await waitForGameDebug(client, `${label} debug open`, state => state.showDebug);
  const debugPanel = await sampleCanvases(client);
  requirePanelTelemetry(before, debugPanel, `${label} debug overlay`, failures);
  await selectDebugCommand(client, index, label);
  for (let i = 0; i < repeat; i++) await tapDebugMenuSelect(client);
  if (!closesOverlay) {
    await toggleDebugOverlay(client);
    await waitForGameDebug(client, `${label} debug close`, state => !state.showDebug);
  } else {
    await waitForGameDebug(client, `${label} debug action close`, state => !state.showDebug);
  }
  if (settleMs > 0) await waitPage(client, settleMs);
  await waitFrames(client, 2);
}

async function forceRareVariant(client, audit, failures) {
  if (audit.runtime.rareForceMode === 'direct_veretar') {
    await runDebugCommand(client, DEBUG_INDEX.forceVeretarSamosbor, 'force veretar samosbor', failures, { settleMs: 400 });
    return;
  }
  const before = await sampleCanvases(client);
  await toggleDebugOverlay(client);
  await waitForGameDebug(client, 'cycle rare samosbor debug open', state => state.showDebug);
  const debugPanel = await sampleCanvases(client);
  requirePanelTelemetry(before, debugPanel, 'cycle rare samosbor debug overlay', failures);
  await selectDebugCommand(client, 5, 'cycle rare samosbor');
  for (let i = 0; i < 8; i++) await tapDebugMenuSelect(client);
  await toggleDebugOverlay(client);
  await waitForGameDebug(client, 'cycle rare samosbor debug close', state => !state.showDebug);
}

function describeException(details) {
  const remote = details?.exception;
  const base = remote?.description ?? remote?.value ?? details?.text ?? 'unknown exception';
  const frames = details?.stackTrace?.callFrames ?? [];
  if (frames.length === 0) return String(base);
  const top = frames.slice(0, 3).map(f => `${f.functionName || '<anon>'}@${f.url}:${f.lineNumber + 1}:${f.columnNumber + 1}`).join(' <- ');
  return `${base} (${top})`;
}

function isExpectedOptionalNetSphereMiss(entry) {
  return entry?.url?.includes('/api/net/')
    && entry.text?.includes('404')
    && entry.text?.includes('Failed to load resource');
}

async function main() {
  const previewPort = await freePort();
  const debugPort = await freePort();
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'gigahrush-chrome-'));
  const gameUrl = `http://127.0.0.1:${previewPort}/?smoke=1`;
  let preview;
  let chrome;
  let client;
  const failures = [];
  let thirdWaveAudit;

  try {
    if (runThirdWave) {
      thirdWaveAudit = await auditThirdWaveContent();
      printThirdWaveAudit(thirdWaveAudit);
      for (const failure of thirdWaveAudit.failures) failures.push(`third-wave audit: ${failure}`);
    }

    preview = spawnLogged('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], 'preview');
    await waitForHttp(gameUrl, 15000);

    chrome = spawnLogged(chromePath, [
      '--headless=new',
      '--disable-background-networking',
      '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--window-size=1280,720',
      'about:blank',
    ], 'chrome');
    await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, 15000);

    const page = await openPage(debugPort, gameUrl);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    await client.send('Page.bringToFront').catch(() => undefined);
    client.on('Runtime.exceptionThrown', params => failures.push(`exception: ${describeException(params.exceptionDetails)}`));
    client.on('Runtime.consoleAPICalled', params => {
      if (params.type === 'error' || params.type === 'assert') failures.push(`console.${params.type}: ${params.args?.map(a => a.value ?? a.description).join(' ')}`);
    });
    client.on('Log.entryAdded', params => {
      const entry = params.entry;
      if (entry?.level !== 'error') return;
      if (entry.url?.includes('favicon') && entry.text?.includes('404')) return;
      if (isExpectedOptionalNetSphereMiss(entry)) return;
      failures.push(`log.error: ${entry.text}${entry.url ? ` (${entry.url})` : ''}`);
    });

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Log.enable');
    const loaded = client.once('Page.loadEventFired', 15000).catch(() => undefined);
    await client.send('Page.navigate', { url: gameUrl });
    await loaded;

    const steps = [];
    const runStep = async (name, fn) => {
      const startedAt = Date.now();
      try {
        const value = await fn();
        steps.push(`${name}: ok ${Date.now() - startedAt}ms`);
        return value;
      } catch (err) {
        steps.push(`${name}: failed ${Date.now() - startedAt}ms`);
        failures.push(`${name}: ${err?.message ?? err}`);
        return undefined;
      }
    };

    await runStep('title paint', async () => {
      await waitPage(client, 1000);
      await installInputTrace(client);
      const title = await sampleCanvases(client);
      requireTitleTelemetry(title, failures);
      return title;
    });

    let running;
    await runStep('start and move', async () => {
      await clickCanvasCenter(client);
      await tapKeyImmediate(client, KEY.enter);
      await waitPage(client, 500);
      await tapKey(client, KEY.e, 90, 200);
      await waitPage(client, 1800);
      await holdKey(client, KEY.w, 350);
      running = await sampleRunning(client);
      requireRunningTelemetry(running, 'after movement', failures);
      return running;
    });

    await runStep('inventory panel', async () => {
      const before = running ?? await sampleCanvases(client);
      await tapKey(client, KEY.i);
      await waitForGameDebug(client, 'inventory panel open', state => state.showInventory);
      await waitFrames(client, 2);
      const inventory = await sampleCanvases(client);
      requirePanelTelemetry(before, inventory, 'inventory panel', failures);
      await tapKey(client, KEY.i);
      await waitForGameDebug(client, 'inventory panel close', state => !state.showInventory);
      await waitFrames(client, 2);
      running = await sampleRunning(client);
      requireRunningTelemetry(running, 'after inventory close', failures);
      return inventory;
    });

    if (runThirdWave && thirdWaveAudit) {
      if (thirdWaveAudit.runtime.sampleRoute) {
        await runStep('third-wave slime/sample floor generation', async () => {
          await runDebugCommand(client, DEBUG_INDEX.teleportMaintenance, 'teleport maintenance for slime/sample route', failures, { closesOverlay: true, settleMs: 3500 });
          running = await sampleRunning(client);
          requireRunningTelemetry(running, `after Maintenance sample route (${thirdWaveAudit.runtime.sampleRouteLabel})`, failures);
          return running;
        });
      } else {
        console.log('Third-wave slime/sample browser route skipped: no wired sample route with Maintenance debug teleport');
      }

      if (thirdWaveAudit.runtime.cultForce) {
        await runStep('third-wave cult/faction force', async () => {
          await runDebugCommand(client, DEBUG_INDEX.forceFactionEvent, 'force cult/faction event', failures, { repeat: 4, settleMs: 700 });
          running = await sampleRunning(client);
          requireRunningTelemetry(running, 'after forced faction events', failures);
          return running;
        });
      } else {
        console.log('Third-wave cult browser route skipped: no forceable cult/faction event path');
      }

      if (thirdWaveAudit.runtime.rareForce) {
        await runStep('third-wave rare samosbor force', async () => {
          await forceRareVariant(client, thirdWaveAudit, failures);
          await waitPage(client, 2600);
          running = await sampleRunning(client);
          requireRunningTelemetry(running, 'during forced rare samosbor variant', failures);
          return running;
        });
      } else {
        console.log('Third-wave rare variant browser route skipped: no forceable rare variant');
      }

      if (thirdWaveAudit.runtime.recoveryTeleport) {
        await runStep('third-wave recovery return', async () => {
          await runDebugCommand(client, DEBUG_INDEX.teleportLiving, 'return to Living after third-wave path', failures, { closesOverlay: true, settleMs: 3500 });
          await holdKey(client, KEY.w, 260);
          running = await sampleRunning(client);
          requireRunningTelemetry(running, 'after third-wave recovery return', failures);
          return running;
        });
      }
    }

    if (runExpedition) {
      await runStep('debug expedition setup', async () => {
        await runDebugCommand(client, DEBUG_INDEX.smokeExpeditionSetup, 'smoke expedition setup', failures, { settleMs: 250 });
        running = await sampleRunning(client);
        requireRunningTelemetry(running, 'after debug setup', failures);
        return running;
      });

      await runStep('shoot action', async () => {
        await holdKey(client, KEY.space, 260);
        await waitPage(client, 450);
        running = await sampleRunning(client);
        requireRunningTelemetry(running, 'after shoot action', failures);
        return running;
      });

      await runStep('quest panel after contract', async () => {
        const before = running ?? await sampleCanvases(client);
        await tapKey(client, KEY.q, 120, 160);
        await waitForGameDebug(client, 'quest panel open', state => state.showQuests);
        await waitFrames(client, 2);
        const questPanel = await sampleCanvases(client);
        requirePanelTelemetry(before, questPanel, 'quest panel after contract', failures);
        await tapKey(client, KEY.q, 120, 160);
        await waitForGameDebug(client, 'quest panel close', state => !state.showQuests);
        await waitFrames(client, 2);
        return questPanel;
      });

      await runStep('lift interaction', async () => {
        await tapKey(client, KEY.e);
        await waitPage(client, 3500);
        await waitFrames(client, 2);
        running = await sampleRunning(client);
        requireRunningTelemetry(running, 'after lift interaction', failures);
        return running;
      });
    }

    if (runStress) {
      await runStep(`stress target ${stressEntities} AI actors`, async () => {
        const before = await readGameDebug(client);
        const beforeAi = before?.liveAiCount ?? 0;
        const spawnCount = Math.max(0, stressEntities - beforeAi);
        const after = await spawnStressPopulation(client, spawnCount);
        if (!after) throw new Error('stress hook is not installed');
        if (after.liveAiCount < stressEntities) {
          failures.push(`stress liveAiCount ${after.liveAiCount} < target ${stressEntities}`);
        }
        if (before && spawnCount > 0 && after.liveAiCount - before.liveAiCount < Math.floor(spawnCount * 0.95)) {
          failures.push(`stress spawned too few AI actors: before=${before.liveAiCount}, after=${after.liveAiCount}, requestedSpawn=${spawnCount}, target=${stressEntities}`);
        }
        await waitPage(client, 1400);
        running = await sampleRunning(client);
        requireRunningTelemetry(running, `after stress target ${stressEntities}`, failures);
        return running;
      });
    }

    if (failures.length > 0) {
      const diagnostics = await readSmokeDiagnostics(client).catch(err => ({ error: err?.message ?? String(err) }));
      const screenshot = await maybeCaptureFailureScreenshot(client).catch(err => `capture failed: ${err?.message ?? err}`);
      const screenshotText = screenshot ? `\nScreenshot: ${screenshot}` : '';
      throw new Error(`Smoke playability failed:\n${failures.map(f => `- ${f}`).join('\n')}\nSteps:\n${steps.map(s => `- ${s}`).join('\n')}\nDiagnostics:\n${JSON.stringify(diagnostics, null, 2)}${screenshotText}`);
    }

    const perf = await collectFrameTelemetry(client, perfFrameCount);
    if (runStress && perf) {
      const liveAi = running?.liveAiCount ?? stressEntities;
      const p95Limit = liveAi >= 10000 ? 50 : 33;
      if (perf.p95Ms > p95Limit) {
        throw new Error(`Stress perf failed: p95FrameMs=${perf.p95Ms.toFixed(2)} > ${p95Limit} for ${liveAi} live AI actors`);
      }
      if (perf.maxMs > 200) {
        throw new Error(`Stress perf failed: maxFrameMs=${perf.maxMs.toFixed(2)} > 200 for ${stressEntities} AI actors`);
      }
    }
    const perfText = perf
      ? `; frames=${perf.frames}, avgFrameMs=${perf.avgMs.toFixed(2)}, p95FrameMs=${perf.p95Ms.toFixed(2)}, maxFrameMs=${perf.maxMs.toFixed(2)}`
      : '';
    const scenarioText = runExpedition ? '; expedition=on' : '; expedition=off';
    const thirdWaveText = runThirdWave ? '; thirdWave=on' : '; thirdWave=off';
    const stressText = runStress ? `; stress=${stressEntities}` : '; stress=off';
    console.log(`Smoke playability passed at ${gameUrl}${scenarioText}${thirdWaveText}${stressText}; hudLit=${running.hudLit}, hudCenterLit=${running.hudCenterLit}, sceneLit=${running.sceneLit}${perfText}`);
  } finally {
    client?.close();
    await stopProcess(chrome);
    await stopProcess(preview);
    await rm(profileDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
