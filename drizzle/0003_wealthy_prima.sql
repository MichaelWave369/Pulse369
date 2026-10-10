CREATE TABLE `journey_enrollments` (
	`owner_id` text NOT NULL,
	`journey_id` text NOT NULL,
	`next_step` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`owner_id`, `journey_id`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `journey_id` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `journey_step` integer;