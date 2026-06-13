import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

// sql.js is loaded as a CommonJS external dep so its internal __dirname
// resolves correctly to node_modules/sql.js/dist/ — no locateFile needed.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require('sql.js');

type SqlJsDatabase = any;
type Param = string | number | null | boolean;

let db: SqlJsDatabase;
let dbFilePath: string;

// ─── Initialization ───────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  const userDataDir = app.getPath('userData');
  fs.mkdirSync(userDataDir, { recursive: true });
  dbFilePath = join(userDataDir, 'memorize.db');

  // Resolve the wasm file from node_modules (multiple candidate paths for
  // different environments: dev, packaged with asar, packaged without asar)
  const SQL = await initSqlJs({
    locateFile: (filename: string) => {
      const candidates = [
        join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', filename),
        join(process.resourcesPath ?? '', 'node_modules', 'sql.js', 'dist', filename),
        join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', filename),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      // Fallback — let sql.js resolve relative to its own directory
      return join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', filename);
    },
  });

  if (fs.existsSync(dbFilePath)) {
    const buffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');
  createSchema();
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function createSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      salt          TEXT    NOT NULL,
      avatar_color  TEXT    NOT NULL DEFAULT '#6366f1',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      token      TEXT    NOT NULL UNIQUE,
      expires_at TEXT    NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS folders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      name       TEXT    NOT NULL,
      color      TEXT    NOT NULL DEFAULT '#6366f1',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      folder_id   INTEGER,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      color       TEXT    NOT NULL DEFAULT '#6366f1',
      tags        TEXT    NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id     INTEGER NOT NULL,
      card_type   TEXT    NOT NULL DEFAULT 'standard',
      front       TEXT    NOT NULL,
      back        TEXT    NOT NULL,
      options     TEXT    NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      deck_id       INTEGER NOT NULL,
      started_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      ended_at      TEXT,
      cards_studied INTEGER NOT NULL DEFAULT 0,
      cards_correct INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (deck_id) REFERENCES decks(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS card_reviews (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      card_id     INTEGER NOT NULL,
      session_id  INTEGER NOT NULL,
      result      TEXT    NOT NULL,
      reviewed_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)    REFERENCES users(id)           ON DELETE CASCADE,
      FOREIGN KEY (card_id)    REFERENCES cards(id)           ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES study_sessions(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_streaks (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL UNIQUE,
      current_streak   INTEGER NOT NULL DEFAULT 0,
      longest_streak   INTEGER NOT NULL DEFAULT 0,
      last_study_date  TEXT,
      total_study_days INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  persist();
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function persist(): void {
  const data: Uint8Array = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/** Run a SELECT and return all matching rows as typed objects. */
export function query<T>(sql: string, params: Param[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

/** Run a SELECT and return the first row or null. */
export function queryOne<T>(sql: string, params: Param[] = []): T | null {
  return query<T>(sql, params)[0] ?? null;
}

/** Run a write statement (INSERT / UPDATE / DELETE) and persist. */
export function run(sql: string, params: Param[] = []): void {
  db.run(sql, params);
  persist();
}

/** Run a write and return the auto-generated row ID. */
export function insert(sql: string, params: Param[] = []): number {
  db.run(sql, params);
  const result = db.exec('SELECT last_insert_rowid()');
  const id = (result[0]?.values[0]?.[0] as number) ?? 0;
  persist();
  return id;
}
