import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseName = 'gigahrush-net';
const binding = 'GIGA_NET';
const configPath = resolve('wrangler.jsonc');
const schemaPaths = [
  'cloudflare/d1/net_sphere.sql',
  'cloudflare/d1/net_sphere_market.sql',
];
const schemaOnly = process.argv.includes('--schema-only');

function run(args, options = {}) {
  return execFileSync('wrangler', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
}

function ensureLogin() {
  try {
    const out = run(['whoami']);
    if (/not authenticated|not logged|CLOUDFLARE_API_TOKEN/i.test(out)) throw new Error(out);
  } catch {
    console.error('Cloudflare auth is required. Run `npx wrangler login` in an interactive terminal, or set CLOUDFLARE_API_TOKEN for non-interactive setup.');
    process.exit(1);
  }
}

function listDatabases() {
  let out = '';
  try {
    out = run(['d1', 'list', '--json']);
  } catch {
    console.error('Could not list D1 databases. Check Cloudflare auth: `npx wrangler login` or CLOUDFLARE_API_TOKEN.');
    process.exit(1);
  }
  const data = JSON.parse(out);
  return Array.isArray(data) ? data : [];
}

function databaseId(row) {
  if (!row || typeof row !== 'object') return '';
  return String(row.uuid ?? row.id ?? row.database_id ?? '');
}

function ensureDatabase() {
  let db = listDatabases().find(row => row.name === databaseName);
  if (db) return databaseId(db);

  console.log(`Creating D1 database ${databaseName}...`);
  run(['d1', 'create', databaseName], { stdio: 'inherit' });
  db = listDatabases().find(row => row.name === databaseName);
  const id = databaseId(db);
  if (!id) {
    console.error(`Created ${databaseName}, but could not read its database_id.`);
    process.exit(1);
  }
  return id;
}

function readConfig() {
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`Cannot read ${configPath}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function writeConfig(config) {
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function ensureBinding(id) {
  const config = readConfig();
  const d1 = Array.isArray(config.d1_databases) ? config.d1_databases : [];
  const next = d1.filter(row => row && row.binding !== binding);
  next.push({
    binding,
    database_name: databaseName,
    database_id: id,
  });
  config.d1_databases = next;
  writeConfig(config);
}

function applySchema() {
  for (const schemaPath of schemaPaths) {
    console.log(`Applying ${schemaPath} to ${databaseName}...`);
    run(['d1', 'execute', databaseName, '--remote', '--file', schemaPath, '--yes'], { stdio: 'inherit' });
  }
}

function tableColumns(table) {
  const out = run(['d1', 'execute', databaseName, '--remote', '--json', '--command', `PRAGMA table_info(${table})`]);
  const data = JSON.parse(out);
  const rows = Array.isArray(data) ? data.flatMap(item => item.results ?? []) : [];
  return new Set(rows.map(row => row.name).filter(Boolean));
}

function ensureColumn(table, column, definition) {
  const columns = tableColumns(table);
  if (columns.has(column)) return;
  console.log(`Adding ${table}.${column}...`);
  run(['d1', 'execute', databaseName, '--remote', '--command', `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`], { stdio: 'inherit' });
}

function applyMigrations() {
  ensureColumn('net_players', 'nickname', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('net_events', 'nickname', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('net_events', 'summary', "TEXT NOT NULL DEFAULT ''");
  run(['d1', 'execute', databaseName, '--remote', '--command', 'CREATE INDEX IF NOT EXISTS idx_net_events_created ON net_events (created_at)'], { stdio: 'inherit' });
}

ensureLogin();
const id = schemaOnly ? '' : ensureDatabase();
if (!schemaOnly) ensureBinding(id);
applySchema();
applyMigrations();
console.log(schemaOnly
  ? `Cloudflare Net Sphere schema is ready: ${databaseName}`
  : `Cloudflare Net Sphere is ready: ${binding} -> ${databaseName} (${id})`);
