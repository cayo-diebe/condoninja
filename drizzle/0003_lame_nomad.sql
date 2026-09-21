CREATE TABLE `cn_user_avatars` (
	`user_id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`version` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cn_document_categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`why_required` text NOT NULL,
	`group_name` text NOT NULL,
	`required` integer DEFAULT 0 NOT NULL,
	`minimum_count` integer DEFAULT 1 NOT NULL,
	`sort_order` integer NOT NULL,
	`allowed_extensions` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cn_condominiums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`address_number` text DEFAULT '' NOT NULL,
	`cep` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`cnpj` text,
	`property_type` text,
	`unit_count` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cn_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`condominium_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`category_slug` text NOT NULL,
	`original_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`condominium_id`) REFERENCES `cn_condominiums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_slug`) REFERENCES `cn_document_categories`(`slug`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cn_documents_storage_unique` ON `cn_documents` (`storage_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `cn_documents_duplicate_unique` ON `cn_documents` (`condominium_id`,`category_slug`,`sha256`);--> statement-breakpoint
CREATE INDEX `cn_documents_condo_idx` ON `cn_documents` (`condominium_id`);--> statement-breakpoint
CREATE TABLE `cn_condominium_journeys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cn_journeys_user_idx` ON `cn_condominium_journeys` (`user_id`);--> statement-breakpoint
CREATE TABLE `cn_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`condominium_id` text NOT NULL,
	`role` text NOT NULL,
	`relationship` text NOT NULL,
	`unit_identifier` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`condominium_id`) REFERENCES `cn_condominiums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cn_memberships_user_condo_unique` ON `cn_memberships` (`user_id`,`condominium_id`);--> statement-breakpoint
CREATE INDEX `cn_memberships_condo_idx` ON `cn_memberships` (`condominium_id`);--> statement-breakpoint
CREATE TABLE `cn_onboarding_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`condominium_id` text,
	`current_step` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL,
	`journey_step` text DEFAULT 'welcome' NOT NULL,
	`address_draft` text,
	`active_journey_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`condominium_id`) REFERENCES `cn_condominiums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `cn_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cn_sessions_token_unique` ON `cn_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `cn_sessions_user_idx` ON `cn_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `cn_sessions_expiry_idx` ON `cn_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `cn_signup_leads` (
	`email` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cn_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cn_users_email_unique` ON `cn_users` (`email`);