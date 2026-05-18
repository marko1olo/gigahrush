export interface D1Result {
  meta?: {
    changes?: number;
    last_row_id?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  GIGA_NET?: D1Database;
}

export interface PagesContext {
  request: Request;
  env: Env;
}

export interface ProgressPayload {
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

const ONLINE_WINDOW_MS = 90_000;
const CHAT_LIMIT = 60;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function requireDb(env: Env): D1Database | Response {
  if (!env.GIGA_NET) return json({ error: 'D1 binding GIGA_NET is not configured' }, 503);
  return env.GIGA_NET;
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 4096) throw new Error('payload too large');
  if (!text) return {};
  const data = JSON.parse(text);
  return data && typeof data === 'object' ? data as Record<string, unknown> : {};
}

export function cleanNetGen(value: unknown): string {
  if (typeof value !== 'string') return '';
  let clean = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  if (clean && !clean.startsWith('NET-')) clean = `NET-${clean}`;
  return /^NET-[A-Z0-9-]{4,28}$/.test(clean) ? clean : '';
}

export function cleanSessionId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const clean = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
  return /^SES-[A-Z0-9-]{4,28}$/.test(clean) ? clean : '';
}

export function cleanMessage(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export function cleanNickname(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f<>`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

export function cleanEventType(value: unknown): 'samosbor' | 'death' | '' {
  return value === 'samosbor' || value === 'death' ? value : '';
}

export function cleanEventKey(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 96);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function normalizeProgress(value: unknown): ProgressPayload {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const floorName = typeof input.floorName === 'string'
    ? input.floorName.replace(/[\u0000-\u001f\u007f<>`\\]/g, '').slice(0, 64)
    : '';
  return {
    floorId: num(input.floorId, 2, 0, 999),
    nickname: cleanNickname(input.nickname),
    floorName,
    samosborCount: num(input.samosborCount, 0, 0, 1_000_000),
    level: num(input.level, 1, 1, 999),
    xp: num(input.xp, 0, 0, 2_000_000_000),
    hp: num(input.hp, 0, 0, 1_000_000),
    maxHp: num(input.maxHp, 100, 1, 1_000_000),
    alive: input.alive === true,
    gameOver: input.gameOver === true,
    gameTime: num(input.gameTime, 0, 0, 2_000_000_000),
    day: num(input.day, 0, 0, 1_000_000),
    hour: num(input.hour, 0, 0, 23),
    minute: num(input.minute, 0, 0, 59),
  };
}

export async function upsertPresence(
  db: D1Database,
  netGen: string,
  sessionId: string,
  progress: ProgressPayload,
  now: number,
): Promise<void> {
  const existingSession = await db
    .prepare('SELECT session_id FROM net_sessions WHERE session_id = ?')
    .bind(sessionId)
    .first<{ session_id: string }>();

  await db.prepare(`
    INSERT INTO net_players (
      net_gen, nickname, created_at, last_seen_at, runs, total_samosbors, deaths,
      best_level, best_samosbor_count, last_floor, progress_json
    )
    VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)
    ON CONFLICT(net_gen) DO UPDATE SET
      nickname = CASE WHEN excluded.nickname != '' THEN excluded.nickname ELSE nickname END,
      last_seen_at = excluded.last_seen_at,
      best_level = max(best_level, excluded.best_level),
      best_samosbor_count = max(best_samosbor_count, excluded.best_samosbor_count),
      last_floor = CASE WHEN excluded.last_floor != '' THEN excluded.last_floor ELSE last_floor END,
      progress_json = excluded.progress_json
  `).bind(
    netGen,
    progress.nickname,
    now,
    now,
    progress.level,
    progress.samosborCount,
    progress.floorName,
    JSON.stringify(progress),
  ).run();

  await db.prepare(`
    INSERT INTO net_sessions (session_id, net_gen, last_seen_at)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      net_gen = excluded.net_gen,
      last_seen_at = excluded.last_seen_at
  `).bind(sessionId, netGen, now).run();

  if (!existingSession) {
    await db.prepare('UPDATE net_players SET runs = runs + 1 WHERE net_gen = ?').bind(netGen).run();
  }
}

export async function readStats(db: D1Database, now: number): Promise<Record<string, number>> {
  const online = await db
    .prepare('SELECT COUNT(*) AS value FROM net_sessions WHERE last_seen_at >= ?')
    .bind(now - ONLINE_WINDOW_MS)
    .first<{ value: number }>();
  const players = await db.prepare('SELECT COUNT(*) AS value FROM net_players').first<{ value: number }>();
  const samosbors = await db
    .prepare("SELECT COUNT(*) AS value FROM net_events WHERE type = 'samosbor'")
    .first<{ value: number }>();
  const deaths = await db
    .prepare("SELECT COUNT(*) AS value FROM net_events WHERE type = 'death'")
    .first<{ value: number }>();
  return {
    onlineUsers: Number(online?.value ?? 0),
    totalPlayers: Number(players?.value ?? 0),
    totalSamosbors: Number(samosbors?.value ?? 0),
    totalDeaths: Number(deaths?.value ?? 0),
    updatedAt: now,
  };
}

export async function readProfile(db: D1Database, netGen: string): Promise<Record<string, unknown> | null> {
  const row = await db.prepare(`
    SELECT net_gen, nickname, created_at, last_seen_at, runs, total_samosbors, deaths,
           best_level, best_samosbor_count, last_floor
    FROM net_players
    WHERE net_gen = ?
  `).bind(netGen).first<Record<string, unknown>>();
  if (!row) return null;
  return {
    netGen: row.net_gen,
    nickname: row.nickname,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    runs: row.runs,
    totalSamosbors: row.total_samosbors,
    deaths: row.deaths,
    bestLevel: row.best_level,
    bestSamosborCount: row.best_samosbor_count,
    lastFloor: row.last_floor,
  };
}

export async function readEvents(db: D1Database): Promise<Record<string, unknown>[]> {
  const result = await db.prepare(`
    SELECT nickname, type, summary, created_at
    FROM net_events
    ORDER BY created_at DESC
    LIMIT 20
  `).all<Record<string, unknown>>();
  return (result.results ?? []).map(row => ({
    eventKey: `${row.created_at}:${row.type}`,
    nickname: row.nickname,
    type: row.type,
    summary: row.summary,
    createdAt: row.created_at,
  }));
}

export async function readChat(db: D1Database, sinceChatId: number): Promise<Record<string, unknown>[]> {
  const since = Number.isFinite(sinceChatId) ? Math.max(0, Math.floor(sinceChatId)) : 0;
  const result = await db.prepare(`
    SELECT c.id, COALESCE(NULLIF(p.nickname, ''), 'Жилец') AS nickname, c.body, c.created_at
    FROM net_chat c
    LEFT JOIN net_players p ON p.net_gen = c.net_gen
    WHERE c.id > ?
    ORDER BY c.id DESC
    LIMIT ?
  `).bind(since, CHAT_LIMIT).all<Record<string, unknown>>();
  return (result.results ?? []).reverse().map(row => ({
    id: row.id,
    nickname: row.nickname,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export function sinceChatIdFromUrl(request: Request): number {
  const raw = new URL(request.url).searchParams.get('sinceChatId') ?? '0';
  const id = Number(raw);
  return Number.isFinite(id) ? Math.max(0, Math.floor(id)) : 0;
}
