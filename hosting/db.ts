import { bindings } from "./bindings";
import { allCategorySeeds, categorySeedValues, categoryUpsertSql } from "../lib/document-categories";
import { supportedExtensions } from "./config";

// A separate namespace preserves records left by the previous published app.
const tables = /\b(users|sessions|condominiums|memberships|onboarding_progress|document_categories|documents|condominium_journeys|user_avatars|signup_leads|referral_links|user_referrals|ninja_upgrades)\b/g;
const sqlForSite = (sql: string) => sql.replace(tables, "cn_$1");
let seedPromise: Promise<unknown> | undefined;
async function ensureCategories() {
  if (!seedPromise) {
    seedPromise = bindings.DB.batch(allCategorySeeds.map(category =>
      bindings.DB.prepare(sqlForSite(categoryUpsertSql)).bind(...categorySeedValues(category, supportedExtensions)),
    )).catch(error => {
      seedPromise = undefined;
      throw error;
    });
  }
  await seedPromise;
}
export function getDb() {
  return { prepare(sql: string) {
    const prepare = (args: unknown[]) => bindings.DB.prepare(sqlForSite(sql)).bind(...args);
    return {
      async get(...args: unknown[]) { await ensureCategories(); return (await prepare(args).first()) ?? undefined; },
      async all(...args: unknown[]) { await ensureCategories(); return (await prepare(args).all()).results; },
      async run(...args: unknown[]) { await ensureCategories(); return prepare(args).run(); },
    };
  } };
}
export type BatchQuery = { sql: string; args: (string | number | null)[] };
export async function atomicBatch(queries: BatchQuery[]) {
  await ensureCategories();
  return bindings.DB.batch(queries.map(q => bindings.DB.prepare(sqlForSite(q.sql)).bind(...q.args)));
}
export const nowIso = () => new Date().toISOString();
export const newId = () => crypto.randomUUID();
