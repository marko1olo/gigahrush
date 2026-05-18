import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { onRequestPost as postChat } from '../functions/api/net/chat';
import { cleanMessage, cleanNickname, type D1Database, type D1PreparedStatement } from '../functions/api/net/common';
import { onRequestPost as postHello } from '../functions/api/net/hello';
import { onRequestGet as getStats } from '../functions/api/net/stats';

interface PlayerRow {
  net_gen: string;
  nickname: string;
  created_at: number;
  last_seen_at: number;
  runs: number;
  total_samosbors: number;
  deaths: number;
  best_level: number;
  best_samosbor_count: number;
  last_floor: string;
  progress_json: string;
}

interface SessionRow {
  session_id: string;
  net_gen: string;
  last_seen_at: number;
}

interface ChatRow {
  id: number;
  net_gen: string;
  body: string;
  created_at: number;
}

class FakeStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(
    private readonly db: FakeD1,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values;
    return this;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return this.db.first(this.query, this.values) as T | null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results?: T[] }> {
    return { results: this.db.all(this.query, this.values) as T[] };
  }

  async run() {
    return this.db.run(this.query, this.values);
  }
}

class FakeD1 implements D1Database {
  players = new Map<string, PlayerRow>();
  sessions = new Map<string, SessionRow>();
  chat: ChatRow[] = [];
  events: Record<string, unknown>[] = [];
  nextChatId = 1;

  prepare(query: string): D1PreparedStatement {
    return new FakeStatement(this, query);
  }

  first(query: string, values: unknown[]): Record<string, unknown> | null {
    if (query.includes('FROM net_sessions WHERE session_id = ?')) {
      return this.sessions.get(String(values[0])) ?? null;
    }
    if (query.includes('COUNT(*) AS value FROM net_sessions')) {
      const cutoff = Number(values[0]);
      return { value: [...this.sessions.values()].filter(row => row.last_seen_at >= cutoff).length };
    }
    if (query.includes('COUNT(*) AS value FROM net_players')) {
      return { value: this.players.size };
    }
    if (query.includes("COUNT(*) AS value FROM net_events WHERE type = 'samosbor'")) {
      return { value: this.events.filter(row => row.type === 'samosbor').length };
    }
    if (query.includes("COUNT(*) AS value FROM net_events WHERE type = 'death'")) {
      return { value: this.events.filter(row => row.type === 'death').length };
    }
    if (query.includes('FROM net_players') && query.includes('WHERE net_gen = ?')) {
      return this.players.get(String(values[0])) ?? null;
    }
    if (query.includes('FROM net_chat') && query.includes('WHERE net_gen = ?')) {
      const netGen = String(values[0]);
      const rows = this.chat.filter(row => row.net_gen === netGen).sort((a, b) => b.id - a.id);
      return rows[0] ? { created_at: rows[0].created_at } : null;
    }
    throw new Error(`Unhandled fake first query: ${query}`);
  }

  all(query: string, values: unknown[]): Record<string, unknown>[] {
    if (query.includes('FROM net_chat')) {
      const since = Number(values[0] ?? 0);
      const limit = Number(values[1] ?? 60);
      return this.chat
        .filter(row => row.id > since)
        .sort((a, b) => b.id - a.id)
        .slice(0, limit)
        .map(row => ({
          ...row,
          nickname: this.players.get(row.net_gen)?.nickname ?? '',
        }));
    }
    if (query.includes('FROM net_events')) {
      return this.events.slice(0, 20);
    }
    throw new Error(`Unhandled fake all query: ${query}`);
  }

  run(query: string, values: unknown[]) {
    if (query.includes('INSERT INTO net_players')) {
      const netGen = String(values[0]);
      const existing = this.players.get(netGen);
      const nickname = String(values[1]);
      const row: PlayerRow = existing ?? {
        net_gen: netGen,
        nickname,
        created_at: Number(values[2]),
        last_seen_at: Number(values[3]),
        runs: 0,
        total_samosbors: 0,
        deaths: 0,
        best_level: Number(values[4]),
        best_samosbor_count: Number(values[5]),
        last_floor: String(values[6]),
        progress_json: String(values[7]),
      };
      row.nickname = nickname || row.nickname;
      row.last_seen_at = Number(values[3]);
      row.best_level = Math.max(row.best_level, Number(values[4]));
      row.best_samosbor_count = Math.max(row.best_samosbor_count, Number(values[5]));
      row.last_floor = String(values[6]) || row.last_floor;
      row.progress_json = String(values[7]);
      this.players.set(netGen, row);
      return { meta: { changes: 1 } };
    }
    if (query.includes('INSERT INTO net_sessions')) {
      this.sessions.set(String(values[0]), {
        session_id: String(values[0]),
        net_gen: String(values[1]),
        last_seen_at: Number(values[2]),
      });
      return { meta: { changes: 1 } };
    }
    if (query.includes('UPDATE net_players SET runs = runs + 1')) {
      const row = this.players.get(String(values[0]));
      if (row) row.runs += 1;
      return { meta: { changes: row ? 1 : 0 } };
    }
    if (query.includes('INSERT INTO net_chat')) {
      const id = this.nextChatId++;
      this.chat.push({
        id,
        net_gen: String(values[0]),
        body: String(values[1]),
        created_at: Number(values[2]),
      });
      return { meta: { changes: 1, last_row_id: id } };
    }
    throw new Error(`Unhandled fake run query: ${query}`);
  }
}

function postRequest(body: Record<string, unknown>): Request {
  return new Request('https://game.test/api/net', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

function identityBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    netGen: 'NET-ABCD-1234',
    sessionId: 'SES-ABCD-1234',
    progress: {
      nickname: 'Жилец',
      floorId: 2,
      floorName: 'Жилая зона',
      samosborCount: 1,
      level: 3,
      xp: 12,
      hp: 90,
      maxHp: 100,
      alive: true,
      gameOver: false,
      gameTime: 123,
      day: 2,
      hour: 8,
      minute: 30,
    },
    ...overrides,
  };
}

function readJsonc(path: string): Record<string, unknown> {
  const text = readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(text) as Record<string, unknown>;
}

function tableColumns(sql: string, table: string): Set<string> {
  const match = new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\);`).exec(sql);
  assert.ok(match, `${table} must exist in base schema`);
  const columns = match[1]
    .split('\n')
    .map(line => /^([a-z_]+)\s/i.exec(line.trim())?.[1] ?? '')
    .filter(Boolean);
  return new Set(columns);
}

function migrationColumns(sql: string): string[] {
  const columns: string[] = [];
  const re = /ALTER TABLE\s+([a-z_]+)\s+ADD COLUMN\s+([a-z_]+)\s/gi;
  for (const match of sql.matchAll(re)) columns.push(`${match[1]}.${match[2]}`);
  return columns;
}

test('Net Sphere Cloudflare config keeps concrete D1 binding and guarded schema script', () => {
  const pkg = readJsonc('package.json');
  const scripts = pkg.scripts as Record<string, string>;
  assert.equal(scripts['cf:schema'], 'node scripts/cloudflare-net-setup.mjs --schema-only');

  const wrangler = readJsonc('wrangler.jsonc');
  assert.equal(wrangler.main, './functions/worker.ts');
  assert.deepEqual(wrangler.assets, {
    directory: './dist',
    binding: 'ASSETS',
    not_found_handling: 'single-page-application',
    run_worker_first: ['/api/*'],
  });
  const databases = wrangler.d1_databases as Record<string, string>[];
  const d1 = databases.find(row => row.binding === 'GIGA_NET');
  assert.ok(d1, 'wrangler.jsonc must expose the GIGA_NET D1 binding');
  assert.equal(d1.database_name, 'gigahrush-net');
  assert.match(d1.database_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  const setup = readFileSync('scripts/cloudflare-net-setup.mjs', 'utf8');
  assert.match(setup, /schemaOnly/);
  assert.match(setup, /applySchema\(\);\s*applyMigrations\(\);/);
});

test('Net Sphere D1 base schema and historical migration stay aligned with API columns', () => {
  const schema = readFileSync('cloudflare/d1/net_sphere.sql', 'utf8');
  const migration = readFileSync('cloudflare/d1/net_sphere_names.sql', 'utf8');
  const required: Record<string, string[]> = {
    net_players: [
      'net_gen', 'nickname', 'created_at', 'last_seen_at', 'runs', 'total_samosbors',
      'deaths', 'best_level', 'best_samosbor_count', 'last_floor', 'progress_json',
    ],
    net_sessions: ['session_id', 'net_gen', 'last_seen_at'],
    net_events: ['event_key', 'net_gen', 'nickname', 'type', 'summary', 'created_at', 'payload_json'],
    net_chat: ['id', 'net_gen', 'body', 'created_at'],
  };

  for (const [table, columns] of Object.entries(required)) {
    const existing = tableColumns(schema, table);
    assert.deepEqual(columns.filter(column => !existing.has(column)), [], `${table} columns must match API use`);
  }

  assert.deepEqual(migrationColumns(migration), [
    'net_players.nickname',
    'net_events.nickname',
    'net_events.summary',
  ]);
  for (const column of migrationColumns(migration)) {
    const [table, name] = column.split('.');
    assert.equal(tableColumns(schema, table).has(name), true, `${column} migration must be present in base schema`);
  }
});

test('Net Sphere endpoints return 503 when D1 binding is missing', async () => {
  const response = await getStats({ request: new Request('https://game.test/api/net/stats'), env: {} });

  assert.equal(response.status, 503);
  assert.equal((await responseJson(response)).error, 'D1 binding GIGA_NET is not configured');
});

test('Net Sphere sanitizers remove unsafe text and truncate bounded fields', () => {
  assert.equal(cleanMessage('  hi\u0000 <b>`x`\\ ok  '), 'hi bx ok');
  assert.equal(cleanMessage('x'.repeat(200)).length, 160);
  assert.equal(cleanNickname('  Вася\u0000 <tag>`\\  '), 'Вася tag');
  assert.equal(cleanNickname('NET-ABCD-1234'), '');
  assert.equal(cleanNickname('я'.repeat(40)).length, 24);
});

test('Net Sphere hello upserts presence and returns profile stats with fake D1', async () => {
  const db = new FakeD1();
  const response = await postHello({ request: postRequest(identityBody()), env: { GIGA_NET: db } });
  const data = await responseJson(response);
  const stats = data.stats as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.equal(stats.onlineUsers, 1);
  assert.equal(stats.totalPlayers, 1);
  assert.equal(profile.netGen, 'NET-ABCD-1234');
  assert.equal(profile.nickname, 'Жилец');
  assert.equal(profile.runs, 1);
  assert.equal(profile.bestLevel, 3);
});

test('Net Sphere chat stores sanitized body and rate-limits same NET-GEN', async () => {
  const realNow = Date.now;
  const db = new FakeD1();

  Date.now = () => 10_000;
  try {
    const first = await postChat({
      request: postRequest(identityBody({ body: ' привет <script>`\\ ' })),
      env: { GIGA_NET: db },
    });
    const firstData = await responseJson(first);
    const chat = firstData.chat as Record<string, unknown>[];

    assert.equal(first.status, 200);
    assert.equal(chat.at(-1)?.body, 'привет script');
    assert.equal(chat.at(-1)?.nickname, 'Жилец');
    assert.equal(chat.at(-1)?.netGen, undefined);

    Date.now = () => 11_000;
    const second = await postChat({
      request: postRequest(identityBody({ body: 'еще' })),
      env: { GIGA_NET: db },
    });

    assert.equal(second.status, 429);
    assert.equal((await responseJson(second)).error, 'слишком часто');
  } finally {
    Date.now = realNow;
  }
});

test('Net Sphere does not expose NET-GEN-shaped legacy nicknames as public names', async () => {
  const db = new FakeD1();
  const now = Date.UTC(2026, 4, 18, 2, 42);
  db.players.set('NET-LEAK-1234', {
    net_gen: 'NET-LEAK-1234',
    nickname: 'NET-LEAK-1234',
    created_at: now,
    last_seen_at: now,
    runs: 1,
    total_samosbors: 0,
    deaths: 1,
    best_level: 1,
    best_samosbor_count: 0,
    last_floor: 'Жилая зона',
    progress_json: '{}',
  });
  db.chat.push({ id: 1, net_gen: 'NET-LEAK-1234', body: 'эхо', created_at: now });
  db.events.push({
    nickname: 'NET-LEAK-1234',
    type: 'death',
    summary: '[NET-LEAK-1234] умер старой строкой',
    created_at: now,
  });

  const response = await getStats({
    request: new Request('https://game.test/api/net/stats?netGen=NET-LEAK-1234'),
    env: { GIGA_NET: db },
  });
  const data = await responseJson(response);
  const profile = data.profile as Record<string, unknown>;
  const chat = data.chat as Record<string, unknown>[];
  const events = data.events as Record<string, unknown>[];

  assert.equal(response.status, 200);
  assert.equal(profile.nickname, 'Жилец');
  assert.equal(chat[0].nickname, 'Жилец');
  assert.equal(events[0].nickname, 'Жилец');
  assert.equal(events[0].summary, '[Жилец] умер 2026-05-18 02:42 UTC');
});
