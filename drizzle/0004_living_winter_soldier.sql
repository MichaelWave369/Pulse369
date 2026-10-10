CREATE TABLE `custom_missions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`clan_id` text,
	`title` text NOT NULL,
	`activity` text NOT NULL,
	`metric` text NOT NULL,
	`target` integer NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`archived_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_custom_missions_owner` ON `custom_missions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_custom_missions_clan` ON `custom_missions` (`clan_id`);--> statement-breakpoint
ALTER TABLE `sessions` ADD `custom_mission_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `rave_style` text;