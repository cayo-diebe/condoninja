CREATE TABLE `condominium_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`condominium_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`condominium_id`) REFERENCES `condominiums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `customer_profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `condominium_memberships_condo_user_unique` ON `condominium_memberships` (`condominium_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `condominium_memberships_user_idx` ON `condominium_memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `condominiums` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`cep` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`relationship` text NOT NULL,
	`unit` text,
	`onboarding_status` text DEFAULT 'documents' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`condominium_id` text NOT NULL,
	`uploaded_by_user_id` text NOT NULL,
	`category` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`condominium_id`) REFERENCES `condominiums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `customer_profiles`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_documents_storage_key_unique` ON `customer_documents` (`storage_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `customer_documents_condo_type_hash_unique` ON `customer_documents` (`condominium_id`,`document_type`,`sha256`);--> statement-breakpoint
CREATE INDEX `customer_documents_condo_idx` ON `customer_documents` (`condominium_id`);--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
