CREATE TABLE IF NOT EXISTS net_market_impulses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  net_gen TEXT NOT NULL,
  corp_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  magnitude REAL NOT NULL,
  created_at INTEGER NOT NULL,
  event_key TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_net_market_impulses_created
ON net_market_impulses (created_at);

CREATE INDEX IF NOT EXISTS idx_net_market_impulses_corp
ON net_market_impulses (corp_id);

CREATE INDEX IF NOT EXISTS idx_net_market_impulses_event_key
ON net_market_impulses (event_key);

CREATE TABLE IF NOT EXISTS net_market_snapshots (
  corp_id TEXT PRIMARY KEY,
  price REAL NOT NULL,
  last_delta REAL NOT NULL DEFAULT 0,
  volume REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_net_market_snapshots_updated
ON net_market_snapshots (updated_at);
