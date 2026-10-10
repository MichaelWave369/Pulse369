CREATE TABLE `members` (
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`last_seen` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`pose` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`room_id`, `user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_room_created` ON `messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#c1a4ff' NOT NULL,
	`move_goal` integer DEFAULT 60 NOT NULL,
	`session_goal` integer DEFAULT 3 NOT NULL,
	`mindful_goal` integer DEFAULT 18 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`host_id` text NOT NULL,
	`state` text DEFAULT 'lobby' NOT NULL,
	`config` text NOT NULL,
	`start_at` integer,
	`run_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rooms_code` ON `rooms` (`code`);--> statement-breakpoint
CREATE INDEX `idx_rooms_expires` ON `rooms` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`mode` text NOT NULL,
	`seconds` integer NOT NULL,
	`hits` integer NOT NULL,
	`total` integer NOT NULL,
	`combo` integer NOT NULL,
	`score` integer NOT NULL,
	`device` text NOT NULL,
	`completed` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_owner_created` ON `sessions` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`duration` real NOT NULL,
	`bpm` real NOT NULL,
	`offset` real DEFAULT 0 NOT NULL,
	`shared` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tracks_owner` ON `tracks` (`owner_id`);