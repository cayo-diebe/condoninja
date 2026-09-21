CREATE TABLE `cn_referral_links` (
	`user_id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cn_referral_links_code_unique` ON `cn_referral_links` (`code`);--> statement-breakpoint
CREATE TABLE `cn_user_referrals` (
	`referred_user_id` text PRIMARY KEY NOT NULL,
	`inviter_user_id` text NOT NULL,
	`referral_code` text NOT NULL,
	`visited_at` text NOT NULL,
	`registered_at` text NOT NULL,
	FOREIGN KEY (`referred_user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cn_user_referrals_not_self" CHECK("cn_user_referrals"."referred_user_id" <> "cn_user_referrals"."inviter_user_id")
);
--> statement-breakpoint
CREATE INDEX `cn_user_referrals_inviter_idx` ON `cn_user_referrals` (`inviter_user_id`);