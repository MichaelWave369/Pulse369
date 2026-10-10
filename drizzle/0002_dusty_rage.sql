CREATE TABLE `clan_credits` (
	`session_id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`seconds` integer NOT NULL,
	`mode` text NOT NULL,
	`completed` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_clan_credits_created` ON `clan_credits` (`clan_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `clan_members` (
	`clan_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`clan_id`, `user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_clan_members_user` ON `clan_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `clan_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`clan_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_clan_messages_created` ON `clan_messages` (`clan_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `clans` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`leader_id` text NOT NULL,
	`color` text NOT NULL,
	`move_goal` integer DEFAULT 180 NOT NULL,
	`mindful_goal` integer DEFAULT 60 NOT NULL,
	`session_goal` integer DEFAULT 12 NOT NULL,
	`timezone` text DEFAULT 'America/Los_Angeles' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_clans_code` ON `clans` (`code`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `clan_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `clan_id` text;