import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { databasePath, ensureDataDirs, supportedExtensions } from "./config.ts";

type DbRow = Record<string, unknown>;

let database: DatabaseSync | null = null;

import { allCategorySeeds, categorySeeds, categorySeedValues, categoryUpsertSql } from "./document-categories.ts";


export function getDb() {
  if (database) return database;

  ensureDataDirs();
  const opened = new DatabaseSync(databasePath);
  try {
    opened.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    migrate(opened);
    opened.exec("BEGIN IMMEDIATE");
    try {
      const upsert = opened.prepare(categoryUpsertSql);
      for (const category of allCategorySeeds) upsert.run(...categorySeedValues(category, supportedExtensions));
      opened.exec("COMMIT");
    } catch (error) {
      opened.exec("ROLLBACK");
      throw error;
    }
    database = opened;
    return opened;
  } catch (error) {
    opened.close();
    throw error;
  }
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all() as DbRow[];
  const versions = new Set(applied.map((row) => Number(row.version)));

  if (!versions.has(1)) {
    db.exec("BEGIN");
    try {
      db.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          token_hash TEXT NOT NULL UNIQUE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX sessions_user_idx ON sessions(user_id);
        CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

        CREATE TABLE condominiums (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          cep TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          cnpj TEXT,
          property_type TEXT,
          unit_count INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE memberships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          condominium_id TEXT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
          relationship TEXT NOT NULL,
          unit_identifier TEXT,
          created_at TEXT NOT NULL,
          UNIQUE(user_id, condominium_id)
        );

        CREATE INDEX memberships_condo_idx ON memberships(condominium_id);

        CREATE TABLE onboarding_progress (
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          condominium_id TEXT REFERENCES condominiums(id) ON DELETE SET NULL,
          current_step TEXT NOT NULL CHECK (current_step IN ('welcome', 'condominium', 'documents', 'review')),
          status TEXT NOT NULL CHECK (status IN ('in_progress', 'complete')),
          completed_at TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE document_categories (
          slug TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          description TEXT NOT NULL,
          why_required TEXT NOT NULL,
          group_name TEXT NOT NULL,
          required INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
          minimum_count INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL,
          allowed_extensions TEXT NOT NULL
        );

        CREATE TABLE documents (
          id TEXT PRIMARY KEY,
          condominium_id TEXT NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
          uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          category_slug TEXT NOT NULL REFERENCES document_categories(slug) ON DELETE RESTRICT,
          original_name TEXT NOT NULL,
          storage_key TEXT NOT NULL UNIQUE,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          sha256 TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('stored', 'awaiting_analysis')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(condominium_id, category_slug, sha256)
        );

        CREATE INDEX documents_condo_idx ON documents(condominium_id);
        CREATE INDEX documents_hash_idx ON documents(condominium_id, sha256);
      `);

      const insert = db.prepare(`
        INSERT INTO document_categories
          (slug, label, description, why_required, group_name, required, minimum_count, sort_order, allowed_extensions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const category of categorySeeds) {
        insert.run(
          category.slug,
          category.label,
          category.description,
          category.whyRequired,
          category.groupName,
          category.required,
          category.minimumCount,
          category.sortOrder,
          JSON.stringify(supportedExtensions),
        );
      }

      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        1,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  if (!versions.has(2)) {
    db.exec("BEGIN");
    try {
      db.exec("ALTER TABLE condominiums ADD COLUMN address_number TEXT NOT NULL DEFAULT ''");
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(2, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (!versions.has(3)) {
    // Keep the legacy constrained column intact; the new journey adds an address step.
    db.exec("BEGIN");
    try {
      db.exec("ALTER TABLE onboarding_progress ADD COLUMN journey_step TEXT NOT NULL DEFAULT 'welcome'");
      db.exec("ALTER TABLE onboarding_progress ADD COLUMN address_draft TEXT");
      db.exec("UPDATE onboarding_progress SET journey_step = CASE WHEN current_step = 'condominium' THEN 'address' ELSE current_step END");
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(3, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (!versions.has(5)) {
    db.exec("BEGIN");
    try {
      db.exec(`CREATE TABLE condominium_journeys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        snapshot TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX journeys_user_idx ON condominium_journeys(user_id);
      ALTER TABLE onboarding_progress ADD COLUMN active_journey_id TEXT;
      INSERT INTO condominium_journeys (id, user_id, snapshot, created_at)
        SELECT user_id, user_id, '{}', updated_at FROM onboarding_progress;
      UPDATE onboarding_progress SET active_journey_id = user_id;`);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(5, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  if (!versions.has(4)) {
    db.exec("BEGIN");
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS user_avatars (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        image BLOB NOT NULL,
        version TEXT NOT NULL
      )`);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(4, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (!versions.has(8)) {
    db.exec("BEGIN");
    try {
      db.exec(`CREATE TABLE ninja_upgrades (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        earned_at TEXT NOT NULL,
        presented_at TEXT
      )`);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(8, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  if (!versions.has(7)) {
    db.exec("BEGIN");
    try {
      db.exec(`CREATE TABLE referral_links (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );
      CREATE TABLE user_referrals (
        referred_user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        inviter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referral_code TEXT NOT NULL,
        visited_at TEXT NOT NULL,
        registered_at TEXT NOT NULL,
        CHECK (referred_user_id <> inviter_user_id)
      );
      CREATE INDEX user_referrals_inviter_idx ON user_referrals(inviter_user_id);`);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(7, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  if (!versions.has(6)) {
    db.exec("BEGIN");
    try {
      db.exec(`CREATE TABLE signup_leads (
        email TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(6, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function closeDbForTests() {
  database?.close();
  database = null;
}

export type BatchQuery = { sql: string; args: (string | number | null)[] };
export async function atomicBatch(queries: BatchQuery[]) {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const results = queries.map(({ sql, args }) => db.prepare(sql).run(...args));
    db.exec("COMMIT");
    return results;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
