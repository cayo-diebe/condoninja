import { createHmac } from "node:crypto";
import { getDb, newId, nowIso, atomicBatch, type BatchQuery } from "./db";
import { authSecret } from "./config";
import { splitLegacyAddress } from "./address";
import { isRetiredDocumentCategory } from "./document-categories";
import type {
  CategoryProgress,
  CondominiumRecord,
  DocumentCategory,
  DocumentRecord,
  MembershipRole,
  OnboardingRecord,
  OnboardingStep,
  UserRecord,
} from "./types";
import type { CondominiumInput, RegistrationInput } from "./validation";
import type { Referral } from "./referrals";

type Row = Record<string, unknown>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashToken(token: string) {
  return createHmac("sha256", authSecret).update(token).digest("hex");
}

export async function createUser(input: RegistrationInput, passwordHash: string, referral?: Referral | null) {
  const user: UserRecord = {
    id: newId(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
  };
  const timestamp = nowIso();
  await atomicBatch([
    { sql: "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", args: [user.id, user.name, user.email, passwordHash, timestamp] },
    { sql: "INSERT INTO onboarding_progress (user_id, current_step, status, updated_at, active_journey_id) VALUES (?, 'welcome', 'in_progress', ?, ?)", args: [user.id, timestamp, user.id] },
    { sql: "INSERT INTO condominium_journeys (id, user_id, snapshot, created_at) VALUES (?, ?, '{}', ?)", args: [user.id, user.id, timestamp] },
    ...(referral ? [{
      sql: `INSERT INTO user_referrals (referred_user_id, inviter_user_id, referral_code, visited_at, registered_at)
        SELECT ?, user_id, code, ?, ? FROM referral_links WHERE code = ? AND user_id <> ?`,
      args: [user.id, referral.visitedAt, timestamp, referral.code, user.id],
    }, {
      sql: `INSERT INTO ninja_upgrades (user_id, earned_at)
        SELECT inviter_user_id, registered_at FROM user_referrals WHERE referred_user_id = ?
        ON CONFLICT(user_id) DO NOTHING`,
      args: [user.id],
    }] : []),
  ]);
  return user;
}

// The active working row remains compatible with existing onboarding operations.
// Switching atomically archives it and restores the selected independent journey.
export async function listCondominiumJourneys(userId: string) {
  const db = getDb();
  const active = (await db.prepare("SELECT * FROM onboarding_progress WHERE user_id = ?").get(userId)) as Row;
  return Promise.all(((await db.prepare("SELECT * FROM condominium_journeys WHERE user_id = ? ORDER BY created_at, id").all(userId)) as Row[]).map(async journey => {
    const selected = journey.id === active.active_journey_id;
    const progress = selected ? active : JSON.parse(String(journey.snapshot)) as Row;
    const draft = progress.address_draft ? JSON.parse(String(progress.address_draft)) : null;
    const condo = progress.condominium_id ? (await db.prepare("SELECT c.* FROM condominiums c JOIN memberships m ON m.condominium_id = c.id WHERE c.id = ? AND m.user_id = ?").get(String(progress.condominium_id), userId)) as Row | undefined : undefined;
    return { id: String(journey.id), selected, complete: progress.status === "complete", name: String(draft?.name || condo?.name || "Novo condomínio"), address: String(draft?.address || condo?.address || ""), number: String(draft?.addressNumber || condo?.address_number || ""), city: String(draft?.city || condo?.city || ""), state: String(draft?.state || condo?.state || "") };
  }));
}

export async function selectCondominiumJourney(userId: string, journeyId?: string) {
  const db = getDb();
    const current = (await db.prepare("SELECT * FROM onboarding_progress WHERE user_id = ?").get(userId)) as Row;
    const target = journeyId ? (await db.prepare("SELECT * FROM condominium_journeys WHERE id = ? AND user_id = ?").get(journeyId, userId)) as Row | undefined : undefined;
    if (journeyId && !target) throw new Error("JOURNEY_NOT_FOUND");
    if (journeyId === current.active_journey_id) return getOnboarding(userId);
    const queries: BatchQuery[] = [{ sql: "UPDATE condominium_journeys SET snapshot = ? WHERE id = ? AND user_id = ?", args: [JSON.stringify(current), String(current.active_journey_id), userId] }];
    const id = journeyId ?? newId();
    const next: Row = target ? JSON.parse(String(target.snapshot)) : { condominium_id: null, journey_step: "welcome", status: "in_progress", completed_at: null, address_draft: null };
    if (next.condominium_id && !(await hasCondominiumAccess(userId, String(next.condominium_id)))) throw new Error("JOURNEY_NOT_FOUND");
    if (!target) queries.push({ sql: "INSERT INTO condominium_journeys (id, user_id, snapshot, created_at) VALUES (?, ?, ?, ?)", args: [id, userId, JSON.stringify(next), nowIso()] });
    queries.push({ sql: "UPDATE onboarding_progress SET active_journey_id = ?, condominium_id = ?, journey_step = ?, status = ?, completed_at = ?, address_draft = ?, updated_at = ? WHERE user_id = ?", args: [id, next.condominium_id as string | null, String(next.journey_step), String(next.status), next.completed_at as string | null, next.address_draft as string | null, nowIso(), userId] });
    await atomicBatch(queries);
    return (await getOnboarding(userId));
}

export async function getUserByEmail(email: string) {
  return (await getDb().prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email))) as
    | (UserRecord & { password_hash: string })
    | undefined;
}

export async function getUserById(id: string) {
  const row = (await getDb().prepare("SELECT id, name, email FROM users WHERE id = ?").get(id)) as Row | undefined;
  return row ? ({ id: String(row.id), name: String(row.name), email: String(row.email) } satisfies UserRecord) : null;
}

export async function createSession(userId: string, tokenHash: string, expiresAt: string) {
  (await getDb()
    .prepare("INSERT INTO sessions (id, token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(newId(), tokenHash, userId, expiresAt, nowIso()));
}

export async function getSessionUser(tokenHash: string) {
  const row = (await getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at, a.version AS avatar_version
       FROM sessions s JOIN users u ON u.id = s.user_id
       LEFT JOIN user_avatars a ON a.user_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, nowIso())) as Row | undefined;

  if (!row) return null;
  return {
    user: { id: String(row.id), name: String(row.name), email: String(row.email), avatarVersion: row.avatar_version ? String(row.avatar_version) : undefined } satisfies UserRecord,
    expiresAt: String(row.expires_at),
  };
}

export async function deleteSession(tokenHash: string) {
  (await getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash));
}

export async function deleteExpiredSessions() {
  (await getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso()));
}

function mapCondominium(row: Row | undefined): CondominiumRecord | null {
  if (!row || row.condominium_id === null || row.condominium_id === undefined) return null;
  const savedAddress = String(row.address ?? "");
  const savedNumber = String(row.address_number ?? "");
  const legacyAddress = savedNumber ? null : splitLegacyAddress(savedAddress);
  return {
    id: String(row.condominium_id ?? row.id),
    name: String(row.condominium_name ?? ""),
    address: legacyAddress?.street ?? savedAddress,
    addressNumber: savedNumber || legacyAddress?.number || "",
    cep: String(row.cep ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    cnpj: row.cnpj ? String(row.cnpj) : null,
    propertyType: row.property_type ? String(row.property_type) : null,
    unitCount: row.unit_count === null || row.unit_count === undefined ? null : Number(row.unit_count),
  };
}

export async function getOnboarding(userId: string): Promise<OnboardingRecord> {
  const row = (await getDb()
    .prepare(
      `SELECT p.journey_step AS current_step, p.address_draft, p.status, p.completed_at,
              m.relationship, m.unit_identifier,
              c.id AS condominium_id, c.name AS condominium_name, c.address, c.address_number, c.cep,
              c.city, c.state, c.cnpj, c.property_type, c.unit_count
       FROM onboarding_progress p
       LEFT JOIN condominiums c ON c.id = p.condominium_id
       LEFT JOIN memberships m ON m.user_id = p.user_id AND m.condominium_id = p.condominium_id
       WHERE p.user_id = ?`,
    )
    .get(userId)) as Row | undefined;

  return {
    step: (row?.current_step as OnboardingStep | undefined) ?? "welcome",
    addressDraft: row?.address_draft ? JSON.parse(String(row.address_draft)) : null,
    status: (row?.status as OnboardingRecord["status"] | undefined) ?? "in_progress",
    condominium: mapCondominium(row),
    relationship: row?.relationship ? String(row.relationship) : null,
    unitIdentifier: row?.unit_identifier ? String(row.unit_identifier) : null,
    completedAt: row?.completed_at ? String(row.completed_at) : null,
  };
}

export async function advanceOnboarding(userId: string, step: OnboardingStep) {
  const onboarding = (await getOnboarding(userId));
  if (onboarding.status === "complete") return onboarding;

  const steps: OnboardingStep[] = ["welcome", "address", "condominium", "documents", "review"];
  const currentIndex = steps.indexOf(onboarding.step);
  const targetIndex = steps.indexOf(step);
  const movingBack = targetIndex <= currentIndex;
  const movingForward = targetIndex === currentIndex + 1 && (
    (step === "address" && currentIndex === 0) ||
    (step === "condominium" && currentIndex === 1 && Boolean(onboarding.addressDraft || onboarding.condominium)) ||
    (step === "documents" && currentIndex === 2 && Boolean(onboarding.condominium)) ||
    (step === "review" && currentIndex === 3)
  );

  if (!movingBack && !movingForward) {
    const error = new Error("ONBOARDING_STEP_LOCKED");
    throw error;
  }

  (await getDb()
    .prepare("UPDATE onboarding_progress SET journey_step = ?, updated_at = ? WHERE user_id = ?")
    .run(step, nowIso(), userId));
}

export async function saveCondominium(userId: string, input: CondominiumInput) {
  const db = getDb();
  const current = await db.prepare("SELECT condominium_id, status FROM onboarding_progress WHERE user_id = ?").get(userId) as Row | undefined;
  const currentCondoId = current?.condominium_id ? String(current.condominium_id) : null;
  if (currentCondoId && !await hasCondominiumAccess(userId, currentCondoId)) throw new Error("JOURNEY_NOT_FOUND");
  const condoId = currentCondoId ?? newId();
  const timestamp = nowIso();
  const queries: BatchQuery[] = [];
  if (currentCondoId) {
    queries.push({ sql: "UPDATE condominiums SET name = ?, address = ?, address_number = ?, cep = ?, city = ?, state = ?, cnpj = ?, property_type = ?, unit_count = ?, updated_at = ? WHERE id = ?",
      args: [input.name, input.address, input.addressNumber, input.cep, input.city, input.state, input.cnpj || null, input.propertyType || null, input.unitCount, timestamp, condoId] });
    queries.push({ sql: "UPDATE memberships SET relationship = ?, unit_identifier = ? WHERE user_id = ? AND condominium_id = ?",
      args: [input.relationship, input.unitIdentifier || null, userId, condoId] });
  } else {
    queries.push({ sql: "INSERT INTO condominiums (id, name, address, address_number, cep, city, state, cnpj, property_type, unit_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [condoId, input.name, input.address, input.addressNumber, input.cep, input.city, input.state, input.cnpj || null, input.propertyType || null, input.unitCount, timestamp, timestamp] });
    queries.push({ sql: "INSERT INTO memberships (id, user_id, condominium_id, role, relationship, unit_identifier, created_at) VALUES (?, ?, ?, 'owner', ?, ?, ?)",
      args: [newId(), userId, condoId, input.relationship, input.unitIdentifier || null, timestamp] });
  }
  queries.push({ sql: "UPDATE onboarding_progress SET condominium_id = ?, journey_step = ?, address_draft = NULL, updated_at = ? WHERE user_id = ?",
    args: [condoId, current?.status === "complete" ? "review" : "documents", timestamp, userId] });
  await atomicBatch(queries);
  return getOnboarding(userId);
}

export async function saveAddressDraft(userId: string, input: NonNullable<OnboardingRecord["addressDraft"]>) {
  await getDb().prepare("UPDATE onboarding_progress SET address_draft = ?, journey_step = 'condominium', updated_at = ? WHERE user_id = ? AND status = 'in_progress'").run(JSON.stringify(input), nowIso(), userId);
  return getOnboarding(userId);
}

export async function saveCondominiumName(userId: string, name: string, addressNumber?: string) {
  const current = (await getOnboarding(userId));
  if (current.addressDraft && current.status !== "complete") {
    (await getDb().prepare("UPDATE onboarding_progress SET address_draft = ?, updated_at = ? WHERE user_id = ?")
      .run(JSON.stringify({ ...current.addressDraft, name, ...(addressNumber ? { addressNumber } : {}) }), nowIso(), userId));
  } else if (current.condominium && (await hasCondominiumAccess(userId, current.condominium.id))) {
    (await getDb().prepare("UPDATE condominiums SET name = ?, address_number = ?, updated_at = ? WHERE id = ?")
      .run(name, addressNumber || current.condominium.addressNumber, nowIso(), current.condominium.id));
  } else {
    return false;
  }
  return true;
}

export async function completeOnboarding(userId: string) {
  const timestamp = nowIso();
  (await getDb()
    .prepare(
      "UPDATE onboarding_progress SET journey_step = 'review', status = 'complete', completed_at = ?, updated_at = ? WHERE user_id = ?",
    )
    .run(timestamp, timestamp, userId));
  return (await getOnboarding(userId));
}

export async function getCondominiumIdForUser(userId: string) {
  const row = (await getDb().prepare("SELECT condominium_id FROM onboarding_progress WHERE user_id = ?").get(userId)) as
    | Row
    | undefined;
  return row?.condominium_id ? String(row.condominium_id) : null;
}

export async function hasCondominiumAccess(userId: string, condominiumId: string) {
  const row = (await getDb()
    .prepare("SELECT 1 AS allowed FROM memberships WHERE user_id = ? AND condominium_id = ?")
    .get(userId, condominiumId)) as Row | undefined;
  return Boolean(row);
}

export async function listCategories() {
  const rows = (await getDb().prepare("SELECT * FROM document_categories ORDER BY sort_order").all()) as Row[];
  return rows.map((row) =>
    ({
      slug: String(row.slug),
      archived: isRetiredDocumentCategory(String(row.slug)),
      label: String(row.label),
      description: String(row.description),
      whyRequired: String(row.why_required),
      groupName: String(row.group_name),
      required: Boolean(row.required),
      minimumCount: Number(row.minimum_count),
      sortOrder: Number(row.sort_order),
      allowedExtensions: JSON.parse(String(row.allowed_extensions)) as string[],
    }) satisfies DocumentCategory,
  );
}

export async function getCategory(categorySlug: string) {
  const row = (await getDb().prepare("SELECT * FROM document_categories WHERE slug = ?").get(categorySlug)) as Row | undefined;
  if (!row) return null;
  return {
    slug: String(row.slug),
    archived: isRetiredDocumentCategory(String(row.slug)),
    label: String(row.label),
    description: String(row.description),
    whyRequired: String(row.why_required),
    groupName: String(row.group_name),
    required: Boolean(row.required),
    minimumCount: Number(row.minimum_count),
    sortOrder: Number(row.sort_order),
    allowedExtensions: JSON.parse(String(row.allowed_extensions)) as string[],
  } satisfies DocumentCategory;
}

function mapDocument(row: Row) {
  return {
    id: String(row.id),
    categorySlug: String(row.category_slug),
    categoryLabel: String(row.category_label),
    groupName: String(row.group_name),
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    status: String(row.status) as DocumentRecord["status"],
    uploadedAt: String(row.created_at),
    uploadedBy: String(row.uploaded_by),
  } satisfies DocumentRecord;
}

export async function listDocumentsForUser(userId: string) {
  const condominiumId = (await getCondominiumIdForUser(userId));
  if (!condominiumId) return [];
  const rows = (await getDb()
    .prepare(
      `SELECT d.*, c.label AS category_label, c.group_name
       FROM documents d JOIN document_categories c ON c.slug = d.category_slug
       JOIN memberships m ON m.condominium_id = d.condominium_id
       WHERE d.condominium_id = ? AND m.user_id = ?
       ORDER BY c.sort_order, d.created_at DESC`,
    )
    .all(condominiumId, userId)) as Row[];
  return rows.map(mapDocument);
}

export async function getCategoryProgressForUser(userId: string) {
  const documents = (await listDocumentsForUser(userId));
  return (await listCategories()).map((category) => {
    const categoryDocuments = documents.filter((doc) => doc.categorySlug === category.slug);
    return {
      ...category,
      documents: categoryDocuments,
      satisfied: categoryDocuments.length >= category.minimumCount,
    } satisfies CategoryProgress;
  }).filter(category => !category.archived || category.documents.length > 0);
}

export async function getDocumentByIdForUser(userId: string, documentId: string) {
  const row = (await getDb()
    .prepare(
      `SELECT d.*, c.label AS category_label, c.group_name
       FROM documents d JOIN document_categories c ON c.slug = d.category_slug
       JOIN memberships m ON m.condominium_id = d.condominium_id
       WHERE d.id = ? AND m.user_id = ?`,
    )
    .get(documentId, userId)) as Row | undefined;
  if (!row) return null;
  return { ...mapDocument(row), storageKey: String(row.storage_key), condominiumId: String(row.condominium_id) };
}

export async function findDuplicateDocument(userId: string, categorySlug: string, sha256: string, targetCondominiumId?: string) {
  const condominiumId = targetCondominiumId ?? (await getCondominiumIdForUser(userId));
  if (!condominiumId || !(await hasCondominiumAccess(userId, condominiumId))) return null;
  const row = (await getDb()
    .prepare(
      `SELECT d.*, c.label AS category_label, c.group_name
       FROM documents d JOIN document_categories c ON c.slug = d.category_slug
       WHERE d.condominium_id = ? AND d.category_slug = ? AND d.sha256 = ?`,
    )
    .get(condominiumId, categorySlug, sha256)) as Row | undefined;
  return row ? mapDocument(row) : null;
}

export async function insertDocument(input: {
  id: string;
  userId: string;
  condominiumId?: string;
  categorySlug: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}) {
  const condominiumId = input.condominiumId ?? (await getCondominiumIdForUser(input.userId));
  if (!condominiumId || !(await hasCondominiumAccess(input.userId, condominiumId))) {
    throw new Error("Condominium access required");
  }
  const timestamp = nowIso();
  (await getDb()
    .prepare(
      `INSERT INTO documents
       (id, condominium_id, uploaded_by, category_slug, original_name, storage_key, mime_type, size_bytes, sha256, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_analysis', ?, ?)`,
    )
    .run(
      input.id,
      condominiumId,
      input.userId,
      input.categorySlug,
      input.originalName,
      input.storageKey,
      input.mimeType,
      input.sizeBytes,
      input.sha256,
      timestamp,
      timestamp,
    ));
  return (await getDocumentByIdForUser(input.userId, input.id));
}

export async function deleteDocumentForUser(userId: string, documentId: string) {
  const document = (await getDocumentByIdForUser(userId, documentId));
  if (!document) return null;
  const category = (await getCategory(document.categorySlug));
  // Check the required minimum and remove atomically, including concurrent requests.
  const removed = await getDb().prepare(`DELETE FROM documents WHERE id = ? AND condominium_id = ?
    AND (? = 0 OR (SELECT COUNT(*) FROM documents WHERE condominium_id = ? AND category_slug = ? AND id <> ?) >= ?)
    RETURNING id`).get(documentId, document.condominiumId, category?.required ? 1 : 0, document.condominiumId, document.categorySlug, documentId, category?.minimumCount ?? 1);
  if (!removed) throw new Error("REQUIRED_DOCUMENT");
  return document;
}

export async function getDashboardData(userId: string) {
  const onboarding = (await getOnboarding(userId));
  const allProgress = (await getCategoryProgressForUser(userId));
  const progress = allProgress.filter(category => !category.archived);
  const required = progress.filter((category) => category.required);
  const satisfiedRequired = required.filter((category) => category.satisfied).length;
  const documents = allProgress.reduce((sum, category) => sum + category.documents.length, 0);
  return {
    onboarding,
    progress,
    requiredSatisfied: satisfiedRequired,
    requiredTotal: required.length,
    documentCount: documents,
    readyForAnalysis: required.length > 0 && satisfiedRequired === required.length,
  };
}

export async function getMembershipRole(userId: string, condominiumId: string): Promise<MembershipRole | null> {
  const row = (await getDb()
    .prepare("SELECT role FROM memberships WHERE user_id = ? AND condominium_id = ?")
    .get(userId, condominiumId)) as Row | undefined;
  return row?.role ? (String(row.role) as MembershipRole) : null;
}
