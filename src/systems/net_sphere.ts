import { FloorLevel, type Entity, type GameState } from '../core/types';

type NetSphereStatus = 'idle' | 'syncing' | 'online' | 'offline';
export type NetSphereEventType = 'samosbor' | 'death';

export interface NetSphereStats {
  onlineUsers: number;
  totalPlayers: number;
  totalSamosbors: number;
  totalDeaths: number;
  updatedAt: number;
}

export interface NetSphereProfile {
  netGen: string;
  nickname: string;
  createdAt: number;
  lastSeenAt: number;
  runs: number;
  totalSamosbors: number;
  deaths: number;
  bestLevel: number;
  bestSamosborCount: number;
  lastFloor: string;
}

export interface NetSphereChatLine {
  id: number;
  nickname: string;
  body: string;
  createdAt: number;
}

export interface NetSphereEventLine {
  eventKey: string;
  nickname: string;
  type: NetSphereEventType;
  summary: string;
  createdAt: number;
}

export interface NetSphereSnapshot {
  open: boolean;
  netGen: string;
  sessionId: string;
  nickname: string;
  status: NetSphereStatus;
  statusText: string;
  error: string;
  stats: NetSphereStats | null;
  profile: NetSphereProfile | null;
  chat: readonly NetSphereChatLine[];
  events: readonly NetSphereEventLine[];
  draft: string;
  busy: boolean;
}

interface NetSphereProgress {
  floorId: number;
  nickname: string;
  floorName: string;
  samosborCount: number;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  gameOver: boolean;
  gameTime: number;
  day: number;
  hour: number;
  minute: number;
}

interface NetSphereRuntime {
  open: boolean;
  netGen: string;
  sessionId: string;
  status: NetSphereStatus;
  error: string;
  stats: NetSphereStats | null;
  profile: NetSphereProfile | null;
  chat: NetSphereChatLine[];
  events: NetSphereEventLine[];
  draft: string;
  busy: boolean;
  chatBusy: boolean;
  nextHeartbeatAt: number;
  nextPollAt: number;
  lastChatId: number;
  lastProgress: NetSphereProgress | null;
  bound: boolean;
}

class NetSphereApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'NetSphereApiError';
    this.status = status;
  }
}

const API_ROOT = '/api/net';
const NET_GEN_KEY = 'gigahrush_net_gen';
const SESSION_KEY = 'gigahrush_net_session';
const NET_GEN_NICK_RE = /^NET-[A-Z0-9-]{4,28}$/;
const HEARTBEAT_MS = 30_000;
const OPEN_POLL_MS = 5_000;
const CHAT_LIMIT = 60;
const DRAFT_LIMIT = 160;
const FLOOR_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'Министерство',
  [FloorLevel.KVARTIRY]: 'Квартиры',
  [FloorLevel.LIVING]: 'Жилая зона',
  [FloorLevel.MAINTENANCE]: 'Коллекторы',
  [FloorLevel.HELL]: 'Преисподняя',
  [FloorLevel.VOID]: 'Пустота',
};

const runtime: NetSphereRuntime = {
  open: false,
  netGen: '',
  sessionId: '',
  status: 'idle',
  error: '',
  stats: null,
  profile: null,
  chat: [],
  events: [],
  draft: '',
  busy: false,
  chatBusy: false,
  nextHeartbeatAt: 0,
  nextPollAt: 0,
  lastChatId: 0,
  lastProgress: null,
  bound: false,
};

function storageGet(storage: Storage, key: string): string {
  try {
    return storage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function storageSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be disabled in private contexts; the in-memory id still works.
  }
}

function randomId(prefix: string, groups: number): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(groups * 4);
  crypto.getRandomValues(bytes);
  const parts: string[] = [];
  for (let group = 0; group < groups; group++) {
    let part = '';
    for (let i = 0; i < 4; i++) part += alphabet[bytes[group * 4 + i] % alphabet.length];
    parts.push(part);
  }
  return `${prefix}-${parts.join('-')}`;
}

function cleanNetGen(value: string): string {
  let clean = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  if (clean && !clean.startsWith('NET-')) clean = `NET-${clean}`;
  return /^NET-[A-Z0-9-]{4,28}$/.test(clean) ? clean : '';
}

function ensureIdentity(): void {
  if (!runtime.netGen) {
    runtime.netGen = cleanNetGen(storageGet(localStorage, NET_GEN_KEY)) || randomId('NET', 3);
    storageSet(localStorage, NET_GEN_KEY, runtime.netGen);
  }
  if (!runtime.sessionId) {
    runtime.sessionId = storageGet(sessionStorage, SESSION_KEY) || randomId('SES', 3);
    storageSet(sessionStorage, SESSION_KEY, runtime.sessionId);
  }
}

function cleanOutgoingText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DRAFT_LIMIT);
}

function looksLikeNetGen(value: string): boolean {
  const clean = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  return NET_GEN_NICK_RE.test(clean);
}

function cleanNickname(value: string): string {
  const clean = value
    .replace(/[\u0000-\u001f\u007f<>`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
  return looksLikeNetGen(clean) ? '' : clean;
}

function printableKey(key: string): string {
  if (key.length !== 1) return '';
  if (/[\u0000-\u001f\u007f<>`\\]/.test(key)) return '';
  return key;
}

function statusText(status: NetSphereStatus): string {
  if (status === 'online') return 'СВЯЗЬ ЕСТЬ';
  if (status === 'syncing') return 'СИНХРОНИЗАЦИЯ';
  if (status === 'offline') return 'НЕТ СВЯЗИ';
  return 'ОЖИДАНИЕ';
}

function progressFromState(state: GameState, player: Entity): NetSphereProgress {
  const totalMinutes = Math.floor(state.clock.totalMinutes);
  return {
    floorId: state.currentFloor,
    nickname: cleanNickname(player.name ?? '') || 'Жилец',
    floorName: FLOOR_NAMES[state.currentFloor] ?? `Этаж ${state.currentFloor}`,
    samosborCount: state.samosborCount,
    level: Math.max(1, Math.floor(player.rpg?.level ?? 1)),
    xp: Math.max(0, Math.floor(player.rpg?.xp ?? 0)),
    hp: Math.max(0, Math.floor(player.hp ?? 0)),
    maxHp: Math.max(1, Math.floor(player.maxHp ?? 100)),
    alive: player.alive,
    gameOver: state.gameOver,
    gameTime: Math.max(0, Math.floor(state.time)),
    day: Math.max(0, Math.floor(totalMinutes / 1440)),
    hour: state.clock.hour,
    minute: state.clock.minute,
  };
}

function applyServerPayload(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const data = payload as {
    stats?: NetSphereStats;
    profile?: NetSphereProfile | null;
    chat?: Partial<NetSphereChatLine>[];
    events?: NetSphereEventLine[];
  };
  if (data.stats) runtime.stats = data.stats;
  if (data.profile !== undefined) {
    runtime.profile = data.profile
      ? { ...data.profile, nickname: cleanNickname(data.profile.nickname) || 'Жилец' }
      : data.profile;
  }
  if (Array.isArray(data.chat)) {
    for (const line of data.chat) {
      if (!line || typeof line.id !== 'number' || typeof line.body !== 'string') continue;
      if (runtime.chat.some(existing => existing.id === line.id)) continue;
      runtime.chat.push({
        id: line.id,
        nickname: typeof line.nickname === 'string' ? cleanNickname(line.nickname) || 'Жилец' : 'Жилец',
        body: line.body,
        createdAt: typeof line.createdAt === 'number' ? line.createdAt : 0,
      });
      runtime.lastChatId = Math.max(runtime.lastChatId, line.id);
    }
    if (runtime.chat.length > CHAT_LIMIT) runtime.chat.splice(0, runtime.chat.length - CHAT_LIMIT);
  }
  if (Array.isArray(data.events)) {
    runtime.events = data.events
      .filter(line => line && typeof line.eventKey === 'string' && typeof line.summary === 'string')
      .map(line => ({ ...line, nickname: cleanNickname(line.nickname) || 'Жилец' }))
      .slice(0, 20);
  }
}

function isServerPayload(payload: unknown): boolean {
  return !!payload && typeof payload === 'object' && (payload as { ok?: unknown }).ok === true;
}

function serverErrorMessage(data: unknown, fallback: string): string {
  return data && typeof data === 'object' && 'error' in data ? String(data.error) : fallback;
}

function sendFailureKeepsConnection(err: unknown): boolean {
  return err instanceof NetSphereApiError && err.status >= 400 && err.status < 500;
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new NetSphereApiError(serverErrorMessage(data, `HTTP ${res.status}`), res.status);
  }
  if (!isServerPayload(data)) throw new NetSphereApiError('Cloudflare API недоступен', 502);
  return data;
}

async function heartbeat(state: GameState, player: Entity): Promise<void> {
  if (runtime.busy) return;
  runtime.busy = true;
  runtime.status = runtime.stats ? 'online' : 'syncing';
  runtime.error = '';
  try {
    const data = await postJson('/hello', {
      netGen: runtime.netGen,
      sessionId: runtime.sessionId,
      progress: progressFromState(state, player),
      sinceChatId: runtime.lastChatId,
    });
    applyServerPayload(data);
    runtime.status = 'online';
    runtime.nextHeartbeatAt = performance.now() + HEARTBEAT_MS;
  } catch (err) {
    runtime.status = 'offline';
    runtime.error = err instanceof Error ? err.message : 'cloudflare недоступен';
    runtime.nextHeartbeatAt = performance.now() + 10_000;
  } finally {
    runtime.busy = false;
  }
}

async function pollOpenStats(): Promise<void> {
  if (runtime.busy) return;
  runtime.busy = true;
  runtime.status = runtime.stats ? 'online' : 'syncing';
  runtime.error = '';
  try {
    const query = new URLSearchParams({
      netGen: runtime.netGen,
      sinceChatId: String(runtime.lastChatId),
    });
    const res = await fetch(`${API_ROOT}/stats?${query.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new NetSphereApiError(serverErrorMessage(data, `HTTP ${res.status}`), res.status);
    }
    if (!isServerPayload(data)) throw new NetSphereApiError('Cloudflare API недоступен', 502);
    applyServerPayload(data);
    runtime.status = 'online';
    runtime.nextPollAt = performance.now() + OPEN_POLL_MS;
  } catch (err) {
    runtime.status = 'offline';
    runtime.error = err instanceof Error ? err.message : 'cloudflare недоступен';
    runtime.nextPollAt = performance.now() + 10_000;
  } finally {
    runtime.busy = false;
  }
}

async function sendChat(body: string): Promise<void> {
  const clean = cleanOutgoingText(body);
  if (!clean || runtime.chatBusy) return;
  runtime.chatBusy = true;
  runtime.error = '';
  try {
    const data = await postJson('/chat', {
      netGen: runtime.netGen,
      sessionId: runtime.sessionId,
      body: clean,
      progress: runtime.lastProgress,
      sinceChatId: runtime.lastChatId,
    });
    applyServerPayload(data);
    runtime.status = 'online';
  } catch (err) {
    if (!sendFailureKeepsConnection(err)) runtime.status = 'offline';
    else if (runtime.stats || runtime.profile) runtime.status = 'online';
    runtime.error = err instanceof Error ? err.message : 'сообщение не ушло';
  } finally {
    runtime.chatBusy = false;
  }
}

function submitDraft(): void {
  const draft = runtime.draft.trim();
  runtime.draft = '';
  if (!draft) return;
  if (draft.startsWith('/')) {
    const [command, ...parts] = draft.split(/\s+/);
    const arg = parts.join(' ');
    if (command === '/netgen' || command === '/ген') {
      const next = cleanNetGen(arg);
      if (!next) {
        runtime.error = 'НЕТ-ГЕН: формат NET-XXXX-XXXX-XXXX';
        return;
      }
      runtime.netGen = next;
      runtime.profile = null;
      runtime.chat = [];
      runtime.events = [];
      runtime.lastChatId = 0;
      storageSet(localStorage, NET_GEN_KEY, runtime.netGen);
      runtime.nextHeartbeatAt = 0;
      runtime.nextPollAt = 0;
      return;
    }
    if (command === '/new') {
      runtime.netGen = randomId('NET', 3);
      runtime.profile = null;
      runtime.chat = [];
      runtime.events = [];
      runtime.lastChatId = 0;
      storageSet(localStorage, NET_GEN_KEY, runtime.netGen);
      runtime.nextHeartbeatAt = 0;
      runtime.nextPollAt = 0;
      return;
    }
    if (command === '/clear') {
      runtime.chat = [];
      runtime.lastChatId = 0;
      return;
    }
    runtime.error = 'Команды: /netgen NET-..., /new, /clear';
    return;
  }
  void sendChat(draft);
}

export function bindNetSphereInput(): () => void {
  if (runtime.bound) return () => {};
  runtime.bound = true;
  ensureIdentity();

  const onDown = (e: KeyboardEvent) => {
    if (!runtime.open) {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.code === 'KeyN') {
        openNetSphere();
        e.preventDefault();
      }
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Escape') {
      runtime.open = false;
      e.preventDefault();
      return;
    }
    if (e.code === 'Enter') {
      submitDraft();
      e.preventDefault();
      return;
    }
    if (e.code === 'Backspace') {
      runtime.draft = runtime.draft.slice(0, -1);
      e.preventDefault();
      return;
    }
    const char = printableKey(e.key);
    if (char && runtime.draft.length < DRAFT_LIMIT) {
      runtime.draft += char;
      e.preventDefault();
    }
  };

  const onPaste = (e: ClipboardEvent) => {
    if (!runtime.open) return;
    const text = e.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    runtime.draft = (runtime.draft + cleanOutgoingText(text)).slice(0, DRAFT_LIMIT);
    e.preventDefault();
  };

  document.addEventListener('keydown', onDown);
  document.addEventListener('paste', onPaste);
  return () => {
    runtime.bound = false;
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('paste', onPaste);
  };
}

export function isNetSphereOpen(): boolean {
  return runtime.open;
}

export function openNetSphere(): void {
  ensureIdentity();
  runtime.open = true;
  runtime.nextPollAt = 0;
  runtime.error = '';
  if (document.pointerLockElement) document.exitPointerLock();
}

export function closeNetSphere(): void {
  runtime.open = false;
}

export function tickNetSphere(state: GameState, player: Entity): void {
  ensureIdentity();
  runtime.lastProgress = progressFromState(state, player);
  const now = performance.now();
  if (now >= runtime.nextHeartbeatAt) void heartbeat(state, player);
  if (runtime.open && now >= runtime.nextPollAt) void pollOpenStats();
}

export function reportNetSphereEvent(
  type: NetSphereEventType,
  eventKey: string,
  state: GameState,
  player: Entity,
): void {
  ensureIdentity();
  const payload = {
    netGen: runtime.netGen,
    sessionId: runtime.sessionId,
    type,
    eventKey: `${runtime.netGen}:${eventKey}`,
    progress: progressFromState(state, player),
  };
  void fetch(`${API_ROOT}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).then(async res => {
    const data = await res.json().catch(() => null);
    if (res.ok && isServerPayload(data)) {
      applyServerPayload(data);
      runtime.status = 'online';
      runtime.error = '';
    } else if (data && typeof data === 'object' && 'error' in data) {
      if (res.status >= 500) runtime.status = 'offline';
      runtime.error = String(data.error);
    }
  }).catch(() => {
    runtime.status = 'offline';
  });
}

export function getNetSphereSnapshot(): NetSphereSnapshot {
  ensureIdentity();
  const nickname = cleanNickname(runtime.profile?.nickname ?? '') || cleanNickname(runtime.lastProgress?.nickname ?? '') || 'Жилец';
  return {
    open: runtime.open,
    netGen: runtime.netGen,
    sessionId: runtime.sessionId,
    nickname,
    status: runtime.status,
    statusText: statusText(runtime.status),
    error: runtime.error,
    stats: runtime.stats,
    profile: runtime.profile,
    chat: runtime.chat,
    events: runtime.events,
    draft: runtime.draft,
    busy: runtime.busy || runtime.chatBusy,
  };
}
