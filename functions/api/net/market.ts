import {
  type D1Database,
  type MarketImpulsePayload,
  type PagesContext,
  cleanEventKey,
  cleanNetGen,
  cleanSessionId,
  json,
  normalizeMarketImpulses,
  normalizeProgress,
  readBody,
  readMarketSnapshot,
  requireDb,
  upsertPresence,
} from './common';

const MARKET_DELTA_SCALE = 0.25;

function snapshotLimitFromUrl(request: Request): number {
  const raw = new URL(request.url).searchParams.get('limit') ?? '64';
  const limit = Number(raw);
  return Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 64;
}

function basePriceForCorp(corpId: string): number {
  let hash = 0;
  for (let i = 0; i < corpId.length; i++) hash = (hash * 33 + corpId.charCodeAt(i)) >>> 0;
  return 80 + (hash % 81);
}

function clampMarketFloat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value * 100) / 100));
}

function scopedEventKey(netGen: string, eventKey: string): string {
  const prefix = `${netGen}:`;
  return eventKey.startsWith(prefix) ? eventKey : cleanEventKey(`${prefix}${eventKey}`);
}

function impulseDelta(impulse: MarketImpulsePayload): number {
  return clampMarketFloat(impulse.magnitude * MARKET_DELTA_SCALE, -25, 25);
}

async function applyMarketImpulse(
  db: D1Database,
  netGen: string,
  impulse: MarketImpulsePayload,
  now: number,
): Promise<void> {
  const eventKey = scopedEventKey(netGen, impulse.eventKey);
  const inserted = await db.prepare(`
    INSERT OR IGNORE INTO net_market_impulses (net_gen, corp_id, kind, magnitude, created_at, event_key)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(netGen, impulse.corpId, impulse.kind, impulse.magnitude, now, eventKey).run();
  if ((inserted.meta?.changes ?? 0) <= 0) return;

  const delta = impulseDelta(impulse);
  const volume = clampMarketFloat(Math.abs(impulse.magnitude), 0, 1_000_000_000);
  const initialPrice = clampMarketFloat(basePriceForCorp(impulse.corpId) + delta, 1, 99999);
  await db.prepare(`
    INSERT INTO net_market_snapshots (corp_id, price, last_delta, volume, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(corp_id) DO UPDATE SET
      price = min(99999, max(1, round((net_market_snapshots.price + excluded.last_delta) * 100) / 100)),
      last_delta = excluded.last_delta,
      volume = min(1000000000, round((net_market_snapshots.volume + excluded.volume) * 100) / 100),
      updated_at = excluded.updated_at
  `).bind(impulse.corpId, initialPrice, delta, volume, now).run();
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const db = requireDb(context.env);
  if (db instanceof Response) return db;

  const market = await readMarketSnapshot(db, snapshotLimitFromUrl(context.request));
  return json({ ok: true, market });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const db = requireDb(context.env);
  if (db instanceof Response) return db;

  try {
    const body = await readBody(context.request);
    const netGen = cleanNetGen(body.netGen);
    const sessionId = cleanSessionId(body.sessionId);
    if (!netGen || !sessionId) return json({ error: 'bad identity' }, 400);

    const now = Date.now();
    await upsertPresence(db, netGen, sessionId, normalizeProgress(body.progress), now);
    const impulses = normalizeMarketImpulses(body.impulses);
    for (const impulse of impulses) await applyMarketImpulse(db, netGen, impulse, now);

    return json({ ok: true, market: await readMarketSnapshot(db, snapshotLimitFromUrl(context.request)) });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'bad request' }, 400);
  }
}
