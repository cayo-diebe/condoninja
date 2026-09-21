import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    city: text('city').notNull(),
    condominium: text('condominium'),
    consentVersion: text('consent_version').notNull(),
    consentedAt: integer('consented_at').notNull(),
    cancelHash: text('cancel_hash').notNull(),
  },
  (table) => [
    uniqueIndex('leads_email_unique').on(table.email),
    uniqueIndex('leads_cancel_hash_unique').on(table.cancelHash),
  ],
);

export const mobilizationGroups = sqliteTable(
  'mobilization_groups',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    condoName: text('condo_name').notNull(),
    district: text('district').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    address: text('address'),
    estimatedUnits: integer('estimated_units'),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [uniqueIndex('mobilization_groups_slug_unique').on(t.slug)],
);

export const mobilizationMembers = sqliteTable(
  'mobilization_members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => mobilizationGroups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    consentAt: text('consent_at').notNull(),
    createdAt: text('created_at').notNull(),
    status: text('status').notNull().default('active'),
    role: text('role').notNull().default('member'),
  },
  (t) => [
    uniqueIndex('mobilization_members_group_email_unique').on(
      t.groupId,
      t.email,
    ),
    uniqueIndex('mobilization_members_group_phone_unique').on(
      t.groupId,
      t.phone,
    ),
  ],
);

export const mobilizationEvents = sqliteTable(
  'mobilization_events',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    groupId: text('group_id').references(() => mobilizationGroups.id, {
      onDelete: 'cascade',
    }),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('mobilization_events_group_idx').on(t.groupId)],
);

export const privacyRequests = sqliteTable('privacy_requests', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').notNull().default('open'),
});

export const requestLimits = sqliteTable(
  'request_limits',
  {
    key: text('key').primaryKey(),
    hits: integer('hits').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('request_limits_expiry_idx').on(t.expiresAt)],
);

export const customerProfiles = sqliteTable('customer_profiles', {
  userId: text('user_id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const condominiums = sqliteTable('condominiums', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  cep: text('cep').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  relationship: text('relationship').notNull(),
  unit: text('unit'),
  onboardingStatus: text('onboarding_status').notNull().default('documents'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const condominiumMemberships = sqliteTable(
  'condominium_memberships',
  {
    id: text('id').primaryKey(),
    condominiumId: text('condominium_id')
      .notNull()
      .references(() => condominiums.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => customerProfiles.userId, { onDelete: 'cascade' }),
    role: text('role').notNull().default('owner'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('condominium_memberships_condo_user_unique').on(
      t.condominiumId,
      t.userId,
    ),
    index('condominium_memberships_user_idx').on(t.userId),
  ],
);

export const customerDocuments = sqliteTable(
  'customer_documents',
  {
    id: text('id').primaryKey(),
    condominiumId: text('condominium_id')
      .notNull()
      .references(() => condominiums.id, { onDelete: 'cascade' }),
    uploadedByUserId: text('uploaded_by_user_id')
      .notNull()
      .references(() => customerProfiles.userId),
    category: text('category').notNull(),
    documentType: text('document_type').notNull(),
    fileName: text('file_name').notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256').notNull(),
    status: text('status').notNull().default('received'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('customer_documents_storage_key_unique').on(t.storageKey),
    uniqueIndex('customer_documents_condo_type_hash_unique').on(
      t.condominiumId,
      t.documentType,
      t.sha256,
    ),
    index('customer_documents_condo_idx').on(t.condominiumId),
  ],
);
