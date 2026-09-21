CREATE TABLE `mobilization_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`group_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `mobilization_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mobilization_events_group_idx` ON `mobilization_events` (`group_id`);--> statement-breakpoint
CREATE TABLE `mobilization_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`condo_name` text NOT NULL,
	`district` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`address` text,
	`estimated_units` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobilization_groups_slug_unique` ON `mobilization_groups` (`slug`);--> statement-breakpoint
CREATE TABLE `mobilization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `mobilization_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobilization_members_group_email_unique` ON `mobilization_members` (`group_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `mobilization_members_group_phone_unique` ON `mobilization_members` (`group_id`,`phone`);--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `request_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `request_limits_expiry_idx` ON `request_limits` (`expires_at`);