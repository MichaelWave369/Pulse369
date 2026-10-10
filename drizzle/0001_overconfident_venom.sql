CREATE TABLE `awards` (
	`owner_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`owner_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`owner_id`, `mission_id`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `mission_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `preset_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `world` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `coach` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `seated` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `room_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `run_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `hr_summary` text;