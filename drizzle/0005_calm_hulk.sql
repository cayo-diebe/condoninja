CREATE TABLE `cn_ninja_upgrades` (
	`user_id` text PRIMARY KEY NOT NULL,
	`earned_at` text NOT NULL,
	`presented_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `cn_users`(`id`) ON UPDATE no action ON DELETE cascade
);
