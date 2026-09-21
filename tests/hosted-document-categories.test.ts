import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allCategorySeeds, categorySeedValues, categoryUpsertSql } from "../lib/document-categories";

const d1 = vi.hoisted(() => ({ prepare: vi.fn(), batch: vi.fn() }));
vi.mock("../hosting/bindings", () => ({ bindings: { DB: d1 } }));
let db: DatabaseSync;

function prepare(sql: string) {
  const statement = db.prepare(sql);
  let args: SQLInputValue[] = [];
  return {
    bind(...values: SQLInputValue[]) { args = values; return this; },
    async first() { return statement.get(...args) ?? null; },
    async all() { return { results: statement.all(...args) }; },
    async run() { return statement.run(...args); },
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE cn_document_categories (
    slug TEXT PRIMARY KEY, label TEXT NOT NULL, description TEXT NOT NULL, why_required TEXT NOT NULL,
    group_name TEXT NOT NULL, required INTEGER NOT NULL, minimum_count INTEGER NOT NULL,
    sort_order INTEGER NOT NULL, allowed_extensions TEXT NOT NULL
  )`);
  d1.prepare.mockImplementation(prepare);
  d1.batch.mockImplementation(async (statements: ReturnType<typeof prepare>[]) => {
    db.exec("BEGIN");
    try {
      const result = await Promise.all(statements.map(statement => statement.run()));
      db.exec("COMMIT");
      return result;
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
});
afterEach(() => db.close());

describe("hosted catalogue refresh", () => {
  it("updates existing labels even when row counts match, sharing one atomic seed across reads", async () => {
    const seed = db.prepare(categoryUpsertSql.replaceAll("document_categories", "cn_document_categories"));
    for (const category of allCategorySeeds) seed.run(...categorySeedValues({ ...category, label: "Old label" }, ["pdf"]));
    const { getDb } = await import("../hosting/db");
    const [rows, financial] = await Promise.all([
      getDb().prepare("SELECT * FROM document_categories").all(),
      getDb().prepare("SELECT * FROM document_categories WHERE slug = ?").get("financial_statements"),
    ]);
    expect(rows).toHaveLength(11);
    expect(financial).toMatchObject({ label: "Demonstrativos ou balancetes (últimos 24 meses)" });
    expect(d1.batch).toHaveBeenCalledTimes(1);
    expect(await getDb().prepare("SELECT * FROM document_categories WHERE slug = ?").get("bank_statements"))
      .toMatchObject({ group_name: "Arquivos anteriores", required: 0 });
    expect(d1.batch).toHaveBeenCalledTimes(1);
  });

  it("retries a failed seed instead of caching the failure forever", async () => {
    d1.batch.mockRejectedValueOnce(new Error("temporary D1 failure"));
    const { getDb } = await import("../hosting/db");
    await expect(getDb().prepare("SELECT * FROM document_categories").all()).rejects.toThrow("temporary D1 failure");
    expect(await getDb().prepare("SELECT * FROM document_categories").all()).toHaveLength(11);
    expect(d1.batch).toHaveBeenCalledTimes(2);
  });
});
