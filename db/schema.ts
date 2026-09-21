// Preserve the published Site's immutable migration history and existing records.
export * from "./legacy-schema";
import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { check } from "drizzle-orm/sqlite-core";

export const appUsers = sqliteTable("cn_users", {
  id: text().primaryKey(), name: text().notNull(), email: text().notNull(), password_hash: text().notNull(), created_at: text().notNull(),
}, t => [uniqueIndex("cn_users_email_unique").on(t.email)]);
export const appSessions = sqliteTable("cn_sessions", {
  id: text().primaryKey(), token_hash: text().notNull(), user_id: text().notNull().references(() => appUsers.id, { onDelete: "cascade" }), expires_at: text().notNull(), created_at: text().notNull(),
}, t => [uniqueIndex("cn_sessions_token_unique").on(t.token_hash), index("cn_sessions_user_idx").on(t.user_id), index("cn_sessions_expiry_idx").on(t.expires_at)]);
export const appCondominiums = sqliteTable("cn_condominiums", {
  id: text().primaryKey(), name: text().notNull(), address: text().notNull(), address_number: text().notNull().default(""), cep: text().notNull(), city: text().notNull(), state: text().notNull(), cnpj: text(), property_type: text(), unit_count: integer(), created_at: text().notNull(), updated_at: text().notNull(),
});
export const appMemberships = sqliteTable("cn_memberships", {
  id: text().primaryKey(), user_id: text().notNull().references(() => appUsers.id, { onDelete: "cascade" }), condominium_id: text().notNull().references(() => appCondominiums.id, { onDelete: "cascade" }), role: text().notNull(), relationship: text().notNull(), unit_identifier: text(), created_at: text().notNull(),
}, t => [uniqueIndex("cn_memberships_user_condo_unique").on(t.user_id, t.condominium_id), index("cn_memberships_condo_idx").on(t.condominium_id)]);
export const appOnboarding = sqliteTable("cn_onboarding_progress", {
  user_id: text().primaryKey().references(() => appUsers.id, { onDelete: "cascade" }), condominium_id: text().references(() => appCondominiums.id, { onDelete: "set null" }), current_step: text().notNull(), status: text().notNull(), completed_at: text(), updated_at: text().notNull(), journey_step: text().notNull().default("welcome"), address_draft: text(), active_journey_id: text(),
});
export const appJourneys = sqliteTable("cn_condominium_journeys", {
  id: text().primaryKey(), user_id: text().notNull().references(() => appUsers.id, { onDelete: "cascade" }), snapshot: text().notNull(), created_at: text().notNull(),
}, t => [index("cn_journeys_user_idx").on(t.user_id)]);
export const appCategories = sqliteTable("cn_document_categories", {
  slug: text().primaryKey(), label: text().notNull(), description: text().notNull(), why_required: text().notNull(), group_name: text().notNull(), required: integer().notNull().default(0), minimum_count: integer().notNull().default(1), sort_order: integer().notNull(), allowed_extensions: text().notNull(),
});
export const appDocuments = sqliteTable("cn_documents", {
  id: text().primaryKey(), condominium_id: text().notNull().references(() => appCondominiums.id, { onDelete: "cascade" }), uploaded_by: text().notNull().references(() => appUsers.id, { onDelete: "restrict" }), category_slug: text().notNull().references(() => appCategories.slug, { onDelete: "restrict" }), original_name: text().notNull(), storage_key: text().notNull(), mime_type: text().notNull(), size_bytes: integer().notNull(), sha256: text().notNull(), status: text().notNull(), created_at: text().notNull(), updated_at: text().notNull(),
}, t => [uniqueIndex("cn_documents_storage_unique").on(t.storage_key), uniqueIndex("cn_documents_duplicate_unique").on(t.condominium_id, t.category_slug, t.sha256), index("cn_documents_condo_idx").on(t.condominium_id)]);
export const appAvatars = sqliteTable("cn_user_avatars", {
  user_id: text().primaryKey().references(() => appUsers.id, { onDelete: "cascade" }), storage_key: text().notNull(), version: text().notNull(),
});
export const appSignupLeads = sqliteTable("cn_signup_leads", { email: text().primaryKey(), source: text().notNull(), created_at: text().notNull() });
export const appNinjaUpgrades = sqliteTable("cn_ninja_upgrades", {
  user_id: text().primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  earned_at: text().notNull(), presented_at: text(),
});

export const appReferralLinks = sqliteTable("cn_referral_links", {
  user_id: text().primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  code: text().notNull(), created_at: text().notNull(),
}, t => [uniqueIndex("cn_referral_links_code_unique").on(t.code)]);

export const appUserReferrals = sqliteTable("cn_user_referrals", {
  referred_user_id: text().primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  inviter_user_id: text().notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  referral_code: text().notNull(), visited_at: text().notNull(), registered_at: text().notNull(),
}, t => [index("cn_user_referrals_inviter_idx").on(t.inviter_user_id), check("cn_user_referrals_not_self", sql`${t.referred_user_id} <> ${t.inviter_user_id}`)]);
