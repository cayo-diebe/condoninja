CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`city` text NOT NULL,
	`condominium` text,
	`consent_version` text NOT NULL,
	`consented_at` integer NOT NULL,
	`cancel_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_email_unique` ON `leads` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_cancel_hash_unique` ON `leads` (`cancel_hash`);