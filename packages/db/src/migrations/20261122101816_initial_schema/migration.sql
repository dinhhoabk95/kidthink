CREATE TABLE `ai_credit_balance` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL UNIQUE,
	`balance` integer DEFAULT 0 NOT NULL,
	`total_granted` integer DEFAULT 0 NOT NULL,
	`total_used` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_ai_credit_balance_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `ai_credit_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`delta` integer NOT NULL,
	`reason` integer NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`feature` text,
	`granted_by_manager_id` integer,
	`grant_reason` text,
	`idempotency_key` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_ai_credit_ledger_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_ai_credit_ledger_granted_by_manager_id_managers_id_fk` FOREIGN KEY (`granted_by_manager_id`) REFERENCES `managers`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `ai_usage_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`feature` text NOT NULL,
	`credits_spent` integer DEFAULT 0 NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cost_usd_micros` integer DEFAULT 0 NOT NULL,
	`moderation_passed` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_ai_usage_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`actor_type` integer NOT NULL,
	`actor_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_data` text,
	`after_data` text,
	`reason` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `child_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`badge_code` text NOT NULL,
	`awarded_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`source_ref` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_badges_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `child_badges_child_profile_id_badge_code_unique` UNIQUE(`child_profile_id`,`badge_code`)
);
--> statement-breakpoint
CREATE TABLE `child_daily_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`date_ict` text NOT NULL,
	`sessions_count` integer DEFAULT 0 NOT NULL,
	`total_play_time_seconds` integer DEFAULT 0 NOT NULL,
	`levels_attempted` integer DEFAULT 0 NOT NULL,
	`levels_completed` integer DEFAULT 0 NOT NULL,
	`skills_touched` integer DEFAULT 0 NOT NULL,
	`stars_earned` integer DEFAULT 0 NOT NULL,
	`extra_time_granted_minutes` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_daily_stats_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `child_daily_stats_child_date_unique` UNIQUE(`child_profile_id`,`date_ict`)
);
--> statement-breakpoint
CREATE TABLE `child_mascot_gear` (
	`child_profile_id` integer PRIMARY KEY,
	`equipped_gear_code` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_mascot_gear_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `child_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`display_name` text NOT NULL,
	`birth_year` integer NOT NULL,
	`avatar_id` text NOT NULL,
	`relationship` integer,
	`current_curriculum_id` integer,
	`daily_play_cap_minutes` integer DEFAULT 60 NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`purge_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `child_session_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`session_uuid` text NOT NULL,
	`game_level_id` integer NOT NULL,
	`template_code` text NOT NULL,
	`completion_status` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`stars_earned` integer DEFAULT 0 NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`retries_count` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_session_summaries_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_child_session_summaries_game_level_id_game_levels_id_fk` FOREIGN KEY (`game_level_id`) REFERENCES `game_levels`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `child_session_summaries_child_session_unique` UNIQUE(`child_profile_id`,`session_uuid`)
);
--> statement-breakpoint
CREATE TABLE `child_sticker_placements` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`theme_code` text NOT NULL,
	`emoji` text NOT NULL,
	`instance_index` integer NOT NULL,
	`norm_x` real NOT NULL,
	`norm_y` real NOT NULL,
	`scale` real DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_sticker_placements_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `uq_child_sticker_placements_item` UNIQUE(`child_profile_id`,`theme_code`,`emoji`,`instance_index`)
);
--> statement-breakpoint
CREATE TABLE `child_stickers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`play_session_id` integer,
	`theme_code` text NOT NULL,
	`emoji` text NOT NULL,
	`label` text NOT NULL,
	`awarded_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_child_stickers_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_child_stickers_play_session_id_play_sessions_id_fk` FOREIGN KEY (`play_session_id`) REFERENCES `play_sessions`(`id`) ON DELETE SET NULL,
	CONSTRAINT `uq_child_stickers_play` UNIQUE(`child_profile_id`,`play_session_id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_collections_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `collections_user_id_name_unique` UNIQUE(`user_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `competencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`color_token` text NOT NULL,
	`icon` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consent_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`consent_type` integer NOT NULL,
	`action` integer DEFAULT 1 NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_consent_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `consent_requirements` (
	`consent_type` integer PRIMARY KEY,
	`reconsent_required_at` integer,
	`notice` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_skill_map` (
	`entity_type` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`skill_id` integer NOT NULL,
	`weight` text NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `content_skill_map_pk` PRIMARY KEY(`entity_type`, `entity_id`, `skill_id`),
	CONSTRAINT `fk_content_skill_map_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `content_tag_map` (
	`entity_type` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `content_tag_map_pk` PRIMARY KEY(`entity_type`, `entity_id`, `tag_id`),
	CONSTRAINT `fk_content_tag_map_tag_id_content_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `content_tags`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `content_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`axis` integer NOT NULL,
	`label` text NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `curricula` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`program_type` integer DEFAULT 1 NOT NULL,
	`target_age_min` integer,
	`target_age_max` integer,
	`duration_weeks` integer DEFAULT 8 NOT NULL,
	`sessions_per_week` integer DEFAULT 3 NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`access_tier` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `curriculum_enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_id` integer NOT NULL,
	`curriculum_id` integer NOT NULL,
	`enrolled_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_curriculum_enrollments_child_id_child_profiles_id_fk` FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_curriculum_enrollments_curriculum_id_curricula_id_fk` FOREIGN KEY (`curriculum_id`) REFERENCES `curricula`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `curriculum_item_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`enrollment_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`curriculum_item_id` integer NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_curriculum_item_progress_enrollment_id_curriculum_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `curriculum_enrollments`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_curriculum_item_progress_child_id_child_profiles_id_fk` FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_curriculum_item_progress_curriculum_item_id_curriculum_items_id_fk` FOREIGN KEY (`curriculum_item_id`) REFERENCES `curriculum_items`(`id`) ON DELETE CASCADE,
	CONSTRAINT `curriculum_item_progress_enrollment_item_unique` UNIQUE(`enrollment_id`,`curriculum_item_id`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`curriculum_id` integer NOT NULL,
	`week_no` integer NOT NULL,
	`session_no` integer NOT NULL,
	`position` integer NOT NULL,
	`entity_type` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_curriculum_items_curriculum_id_curricula_id_fk` FOREIGN KEY (`curriculum_id`) REFERENCES `curricula`(`id`) ON DELETE CASCADE,
	CONSTRAINT `curriculum_items_curriculum_week_session_pos_unique` UNIQUE(`curriculum_id`,`week_no`,`session_no`,`position`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`curriculum_id` integer NOT NULL,
	`week_no` integer NOT NULL,
	`goal` text NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_curriculum_weeks_curriculum_id_curricula_id_fk` FOREIGN KEY (`curriculum_id`) REFERENCES `curricula`(`id`) ON DELETE CASCADE,
	CONSTRAINT `curriculum_weeks_curriculum_id_week_no_unique` UNIQUE(`curriculum_id`,`week_no`)
);
--> statement-breakpoint
CREATE TABLE `custom_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`template_id` text NOT NULL,
	`title` text NOT NULL,
	`instruction` text NOT NULL,
	`content_pack` text NOT NULL,
	`difficulty_params` text NOT NULL,
	`theme_id` text DEFAULT 'farm' NOT NULL,
	`age_min` integer DEFAULT 3 NOT NULL,
	`age_max` integer DEFAULT 6 NOT NULL,
	`skill_ids` text,
	`status` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_custom_games_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `entitlement_keys` (
	`key` text PRIMARY KEY,
	`group` integer NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`is_mvp` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`entitlement_key` text NOT NULL,
	`source` integer NOT NULL,
	`source_ref` text,
	`status` integer DEFAULT 1 NOT NULL,
	`granted_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`expires_at` integer,
	`granted_by_manager_id` integer,
	`grant_reason` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_entitlements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_entitlements_entitlement_key_entitlement_keys_key_fk` FOREIGN KEY (`entitlement_key`) REFERENCES `entitlement_keys`(`key`) ON DELETE RESTRICT,
	CONSTRAINT `fk_entitlements_granted_by_manager_id_managers_id_fk` FOREIGN KEY (`granted_by_manager_id`) REFERENCES `managers`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL,
	`user_id` integer NOT NULL,
	`kind` integer NOT NULL,
	`ref_id` text NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`file_path` text,
	`page_count` integer,
	`expires_at` integer,
	`error` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_export_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `game_level_rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`game_level_id` integer NOT NULL,
	`round_index` integer NOT NULL,
	`instruction` text,
	`instruction_audio_path` text,
	`content_pack` text NOT NULL,
	`difficulty_params` text NOT NULL,
	`difficulty` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_game_level_rounds_game_level_id_game_levels_id_fk` FOREIGN KEY (`game_level_id`) REFERENCES `game_levels`(`id`) ON DELETE CASCADE,
	CONSTRAINT `game_level_rounds_level_index_unique` UNIQUE(`game_level_id`,`round_index`)
);
--> statement-breakpoint
CREATE TABLE `game_levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`template_code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`instruction` text,
	`instruction_audio_path` text,
	`content_pack` text NOT NULL,
	`difficulty_params` text NOT NULL,
	`theme_id` text,
	`age_min` integer,
	`age_max` integer,
	`difficulty` integer,
	`access_tier` integer NOT NULL,
	`thumbnail_emoji` text,
	`skill_dataset_id` integer,
	`projection_ref` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_game_levels_skill_dataset_id_skill_datasets_id_fk` FOREIGN KEY (`skill_dataset_id`) REFERENCES `skill_datasets`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `learning_objectives` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`skill_id` integer NOT NULL,
	`behaviour` text NOT NULL,
	`observable_criteria` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_learning_objectives_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `level_daily_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`level_code` text NOT NULL,
	`date_ict` text NOT NULL,
	`plays_count` integer DEFAULT 0 NOT NULL,
	`completions_count` integer DEFAULT 0 NOT NULL,
	`abandoned_count` integer DEFAULT 0 NOT NULL,
	`avg_duration_seconds` integer DEFAULT 0 NOT NULL,
	`avg_hints_used` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `level_daily_stats_level_date_unique` UNIQUE(`level_code`,`date_ict`)
);
--> statement-breakpoint
CREATE TABLE `library_items` (
	`user_id` integer NOT NULL,
	`entity_type` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`collection_id` integer,
	`note` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `library_items_pk` PRIMARY KEY(`user_id`, `entity_type`, `entity_id`),
	CONSTRAINT `fk_library_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_library_items_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `manager_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`manager_id` integer NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password_hash` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_manager_accounts_manager_id_managers_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `managers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `manager_accounts_provider_account_unique` UNIQUE(`provider_id`,`account_id`),
	CONSTRAINT `manager_accounts_manager_provider_unique` UNIQUE(`manager_id`,`provider_id`)
);
--> statement-breakpoint
CREATE TABLE `manager_passkeys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text,
	`public_key` text NOT NULL,
	`manager_id` integer NOT NULL,
	`credential_id` text NOT NULL UNIQUE,
	`counter` integer DEFAULT 0 NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer DEFAULT false NOT NULL,
	`transports` text,
	`aaguid` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_manager_passkeys_manager_id_managers_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `managers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `manager_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`manager_id` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`auth_method` integer DEFAULT 1 NOT NULL,
	`reauth_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_manager_sessions_manager_id_managers_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `managers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `manager_two_factors` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`manager_id` integer NOT NULL CONSTRAINT `manager_two_factors_manager_unique` UNIQUE,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`verified` integer DEFAULT true,
	`failed_verification_count` integer DEFAULT 0,
	`locked_until` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_manager_two_factors_manager_id_managers_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `managers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `manager_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `managers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`email` text COLLATE NOCASE NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`email_verified` integer DEFAULT true NOT NULL,
	`image` text,
	`role` integer NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`session_version` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mastery_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_profile_id` integer NOT NULL,
	`skill_id` integer NOT NULL,
	`p_learn` text DEFAULT '0.1000' NOT NULL,
	`ema_correct` text DEFAULT '0.5000' NOT NULL,
	`hint_rate` text DEFAULT '0.0000' NOT NULL,
	`attempts_total` integer DEFAULT 0 NOT NULL,
	`best_p_learn` text DEFAULT '0.1000' NOT NULL,
	`params_version` text DEFAULT 'v1' NOT NULL,
	`last_seen_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_mastery_state_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_mastery_state_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE,
	CONSTRAINT `mastery_state_child_skill_unique` UNIQUE(`child_profile_id`,`skill_id`)
);
--> statement-breakpoint
CREATE TABLE `mfa_recovery_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`requested_by_manager_id` integer NOT NULL,
	`reason` text NOT NULL,
	`verification_token_hash` text,
	`verification_token_expires_at` integer,
	`email_verified_at` integer,
	`eligible_at` integer NOT NULL,
	`completed_at` integer,
	`completed_by_manager_id` integer,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_mfa_recovery_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_mfa_recovery_requests_requested_by_manager_id_managers_id_fk` FOREIGN KEY (`requested_by_manager_id`) REFERENCES `managers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_mfa_recovery_requests_completed_by_manager_id_managers_id_fk` FOREIGN KEY (`completed_by_manager_id`) REFERENCES `managers`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`notification_id` integer NOT NULL,
	`channel` integer NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`suppressed_reason` text,
	`provider_message_id` text,
	`dispatched_at` integer,
	`error` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_notification_deliveries_notification_id_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_endpoints` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`provider` integer NOT NULL,
	`client_installation_id` text NOT NULL,
	`token_encrypted` text NOT NULL,
	`token_fingerprint` text NOT NULL UNIQUE,
	`status` integer DEFAULT 1 NOT NULL,
	`last_seen_at` integer,
	`invalidated_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_notification_endpoints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_reads` (
	`notification_id` integer PRIMARY KEY,
	`read_at` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_notification_reads_notification_id_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`recipient_type` integer NOT NULL,
	`recipient_id` integer NOT NULL,
	`template_code` text NOT NULL,
	`payload` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`code` text PRIMARY KEY,
	`name` text NOT NULL,
	`audience` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`offers` text NOT NULL,
	`quotas` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`package_code` text NOT NULL,
	`offer_code` text NOT NULL,
	`amount_vnd` integer NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`status` integer DEFAULT 2 NOT NULL,
	`transfer_note` text UNIQUE,
	`bank_txn_ref` text,
	`proof_path` text,
	`submitted_at` integer,
	`reviewed_at` integer,
	`reviewed_by_manager_id` integer,
	`admin_note` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_payment_orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_payment_orders_package_code_packages_code_fk` FOREIGN KEY (`package_code`) REFERENCES `packages`(`code`) ON DELETE RESTRICT,
	CONSTRAINT `fk_payment_orders_reviewed_by_manager_id_managers_id_fk` FOREIGN KEY (`reviewed_by_manager_id`) REFERENCES `managers`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`order_id` integer,
	`order_uuid` text NOT NULL,
	`amount_vnd` integer NOT NULL,
	`status` text NOT NULL,
	`raw_payload` text,
	`reconciled_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_payment_transactions_order_id_payment_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `payment_orders`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `personal_curricula` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`age_min` integer,
	`age_max` integer,
	`duration_weeks` integer DEFAULT 8 NOT NULL,
	`sessions_per_week` integer DEFAULT 3 NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_personal_curricula_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `personal_curriculum_enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`child_id` integer NOT NULL,
	`personal_curriculum_id` integer NOT NULL,
	`enrolled_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_personal_curriculum_enrollments_child_id_child_profiles_id_fk` FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_personal_curriculum_enrollments_personal_curriculum_id_personal_curricula_id_fk` FOREIGN KEY (`personal_curriculum_id`) REFERENCES `personal_curricula`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `personal_curriculum_item_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`enrollment_id` integer NOT NULL,
	`child_id` integer NOT NULL,
	`personal_curriculum_item_id` integer NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_personal_curriculum_item_progress_enrollment_id_personal_curriculum_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `personal_curriculum_enrollments`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_personal_curriculum_item_progress_child_id_child_profiles_id_fk` FOREIGN KEY (`child_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_personal_curriculum_item_progress_personal_curriculum_item_id_personal_curriculum_items_id_fk` FOREIGN KEY (`personal_curriculum_item_id`) REFERENCES `personal_curriculum_items`(`id`) ON DELETE CASCADE,
	CONSTRAINT `personal_curriculum_item_progress_enrollment_item_unique` UNIQUE(`enrollment_id`,`personal_curriculum_item_id`)
);
--> statement-breakpoint
CREATE TABLE `personal_curriculum_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`personal_curriculum_id` integer NOT NULL,
	`week_no` integer NOT NULL,
	`session_no` integer NOT NULL,
	`position` integer NOT NULL,
	`entity_type` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_personal_curriculum_items_personal_curriculum_id_personal_curricula_id_fk` FOREIGN KEY (`personal_curriculum_id`) REFERENCES `personal_curricula`(`id`) ON DELETE CASCADE,
	CONSTRAINT `personal_curriculum_items_week_session_pos_unique` UNIQUE(`personal_curriculum_id`,`week_no`,`session_no`,`position`)
);
--> statement-breakpoint
CREATE TABLE `play_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`session_uuid` text NOT NULL,
	`child_profile_id` integer,
	`guest_device_id` text,
	`game_level_id` integer NOT NULL,
	`template_code` text NOT NULL,
	`is_preview` integer DEFAULT false NOT NULL,
	`completion_status` integer DEFAULT 1 NOT NULL,
	`access_tier_at_start` integer,
	`layout_seed` integer,
	`stars_earned` integer DEFAULT 0,
	`score` integer DEFAULT 0,
	`duration_seconds` integer DEFAULT 0,
	`started_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_play_sessions_child_profile_id_child_profiles_id_fk` FOREIGN KEY (`child_profile_id`) REFERENCES `child_profiles`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_play_sessions_game_level_id_game_levels_id_fk` FOREIGN KEY (`game_level_id`) REFERENCES `game_levels`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `quota_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`quota_key` text NOT NULL,
	`period_start` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`limit_snapshot` integer NOT NULL,
	`period_end` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_quota_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `quota_usage_user_key_period_unique` UNIQUE(`user_id`,`quota_key`,`period_start`)
);
--> statement-breakpoint
CREATE TABLE `recurring_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`package_code` text NOT NULL,
	`offer_code` text NOT NULL,
	`billing_period` text NOT NULL,
	`price_vnd` integer NOT NULL,
	`auto_renew` integer DEFAULT false NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`current_period_start` integer NOT NULL,
	`current_period_end` integer NOT NULL,
	`next_billing_at` integer,
	`dunning_attempts` integer DEFAULT 0 NOT NULL,
	`last_dunning_at` integer,
	`consent_terms_version` text NOT NULL,
	`consent_snapshot` text,
	`cancelled_at` integer,
	`cancelled_by` text,
	`cancel_reason` text,
	`cancel_note` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_recurring_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recurring_subscriptions_package_code_packages_code_fk` FOREIGN KEY (`package_code`) REFERENCES `packages`(`code`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `skill_daily_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`skill_id` integer NOT NULL,
	`date_ict` text NOT NULL,
	`exposure_count` integer DEFAULT 0 NOT NULL,
	`avg_accuracy_percent` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_skill_daily_stats_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE,
	CONSTRAINT `skill_daily_stats_skill_date_unique` UNIQUE(`skill_id`,`date_ict`)
);
--> statement-breakpoint
CREATE TABLE `skill_datasets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`skill_id` integer NOT NULL,
	`concept_label` text NOT NULL,
	`items` text NOT NULL,
	`relations` text,
	`ordering` text,
	`axes` text,
	`ladder` text,
	`phrasing` text,
	`extends_skill_code` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_skill_datasets_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `skill_prerequisites` (
	`skill_id` integer NOT NULL,
	`prerequisite_id` integer NOT NULL,
	`strength` text DEFAULT '1.00' NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `skill_prerequisites_pk` PRIMARY KEY(`skill_id`, `prerequisite_id`),
	CONSTRAINT `fk_skill_prerequisites_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_skill_prerequisites_prerequisite_id_skills_id_fk` FOREIGN KEY (`prerequisite_id`) REFERENCES `skills`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`strand_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`age_min` integer NOT NULL,
	`age_max` integer NOT NULL,
	`difficulty` integer NOT NULL,
	`thinking_processes` text,
	`what_axis` text,
	`tier` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_skills_strand_id_strands_id_fk` FOREIGN KEY (`strand_id`) REFERENCES `strands`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `strands` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`code` text NOT NULL UNIQUE,
	`competency_id` integer NOT NULL,
	`parent_strand_id` integer,
	`name` text NOT NULL,
	`description` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_strands_competency_id_competencies_id_fk` FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_strands_parent_strand_id_strands_id_fk` FOREIGN KEY (`parent_strand_id`) REFERENCES `strands`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `telemetry_events` (
	`session_uuid` text NOT NULL,
	`seq` integer NOT NULL,
	`child_uuid` text,
	`game_level_id` integer,
	`template_code` text,
	`event_name` text NOT NULL,
	`occurred_at_ms` integer,
	`payload` text,
	`client_timestamp` integer,
	`ingested_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `telemetry_events_pk` PRIMARY KEY(`session_uuid`, `seq`)
);
--> statement-breakpoint
CREATE TABLE `user_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password_hash` text,
	`email_at_provider` text COLLATE NOCASE,
	`email_verified_at_provider` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_user_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `user_accounts_provider_account_unique` UNIQUE(`provider_id`,`account_id`),
	CONSTRAINT `user_accounts_user_provider_unique` UNIQUE(`user_id`,`provider_id`)
);
--> statement-breakpoint
CREATE TABLE `user_passkeys` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text,
	`public_key` text NOT NULL,
	`user_id` integer NOT NULL,
	`credential_id` text NOT NULL UNIQUE,
	`counter` integer DEFAULT 0 NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer DEFAULT false NOT NULL,
	`transports` text,
	`aaguid` text,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_user_passkeys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`auth_method` integer DEFAULT 1 NOT NULL,
	`reauth_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_two_factors` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL CONSTRAINT `user_two_factors_user_unique` UNIQUE,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`verified` integer DEFAULT true,
	`failed_verification_count` integer DEFAULT 0,
	`locked_until` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	CONSTRAINT `fk_user_two_factors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`uuid` text NOT NULL UNIQUE,
	`email` text COLLATE NOCASE NOT NULL UNIQUE,
	`password_hash` text,
	`display_name` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`two_factor_enabled` integer DEFAULT false NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`email_verified_at` integer,
	`session_version` integer DEFAULT 0 NOT NULL,
	`suspended_reason` text,
	`purge_at` integer,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_credit_ledger_user_created` ON `ai_credit_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_credit_ledger_ref` ON `ai_credit_ledger` (`ref_type`,`ref_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_credit_ledger_granted_by_manager` ON `ai_credit_ledger` (`granted_by_manager_id`) WHERE "ai_credit_ledger"."granted_by_manager_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_credit_ledger_idempotency` ON `ai_credit_ledger` (`idempotency_key`) WHERE "ai_credit_ledger"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_ai_usage_log_user_created` ON `ai_usage_log` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_usage_log_feature_created` ON `ai_usage_log` (`feature`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_created` ON `audit_logs` (`actor_type`,`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_entity_created` ON `audit_logs` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action_created` ON `audit_logs` (`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `child_profiles_birth_year_idx` ON `child_profiles` (`birth_year`);--> statement-breakpoint
CREATE INDEX `idx_child_profiles_user_id` ON `child_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_child_profiles_status_purge_at` ON `child_profiles` (`status`,`purge_at`) WHERE "child_profiles"."purge_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_child_profiles_current_curriculum_id` ON `child_profiles` (`current_curriculum_id`) WHERE "child_profiles"."current_curriculum_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_child_session_summaries_game_level_id` ON `child_session_summaries` (`game_level_id`);--> statement-breakpoint
CREATE INDEX `idx_child_session_summaries_session_uuid` ON `child_session_summaries` (`session_uuid`);--> statement-breakpoint
CREATE INDEX `idx_child_stickers_play_session_id` ON `child_stickers` (`play_session_id`) WHERE "child_stickers"."play_session_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_consent_logs_user_type_created` ON `consent_logs` (`user_id`,`consent_type`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_content_skill_map_skill_entity` ON `content_skill_map` (`skill_id`,`entity_type`);--> statement-breakpoint
CREATE INDEX `idx_content_tag_map_tag_entity` ON `content_tag_map` (`tag_id`,`entity_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_curriculum_enrollments_child_active_unique` ON `curriculum_enrollments` (`child_id`) WHERE "status" = 1;--> statement-breakpoint
CREATE INDEX `idx_curriculum_enrollments_child_status` ON `curriculum_enrollments` (`child_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_curriculum_enrollments_curriculum_id` ON `curriculum_enrollments` (`curriculum_id`);--> statement-breakpoint
CREATE INDEX `idx_curriculum_item_progress_child_id` ON `curriculum_item_progress` (`child_id`);--> statement-breakpoint
CREATE INDEX `idx_curriculum_item_progress_item_id` ON `curriculum_item_progress` (`curriculum_item_id`);--> statement-breakpoint
CREATE INDEX `idx_curriculum_item_progress_enrollment_status` ON `curriculum_item_progress` (`enrollment_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_curriculum_items_entity` ON `curriculum_items` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_custom_games_user_status` ON `custom_games` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_custom_games_user_template` ON `custom_games` (`user_id`,`template_id`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_user_status_expires` ON `entitlements` (`user_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_status_expires_at` ON `entitlements` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_entitlement_key` ON `entitlements` (`entitlement_key`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_granted_by_manager` ON `entitlements` (`granted_by_manager_id`) WHERE "entitlements"."granted_by_manager_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_entitlements_user_key_live` ON `entitlements` (`user_id`,`entitlement_key`) WHERE "status" IN (2, 3, 4);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_export_jobs_uuid` ON `export_jobs` (`uuid`);--> statement-breakpoint
CREATE INDEX `idx_export_jobs_user_id` ON `export_jobs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_export_jobs_status` ON `export_jobs` (`status`,`created_at`) WHERE "status" IN (1, 2);--> statement-breakpoint
CREATE INDEX `idx_export_jobs_expires_at` ON `export_jobs` (`expires_at`) WHERE "export_jobs"."expires_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_game_levels_skill_dataset_id` ON `game_levels` (`skill_dataset_id`) WHERE "game_levels"."skill_dataset_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_game_levels_catalog` ON `game_levels` (`access_tier`,`difficulty`,`id`);--> statement-breakpoint
CREATE INDEX `idx_learning_objectives_skill_id` ON `learning_objectives` (`skill_id`);--> statement-breakpoint
CREATE INDEX `idx_library_items_collection_id` ON `library_items` (`collection_id`) WHERE "library_items"."collection_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_library_items_entity` ON `library_items` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_manager_accounts_manager_id` ON `manager_accounts` (`manager_id`);--> statement-breakpoint
CREATE INDEX `idx_manager_passkeys_manager_id` ON `manager_passkeys` (`manager_id`);--> statement-breakpoint
CREATE INDEX `idx_manager_sessions_manager_id` ON `manager_sessions` (`manager_id`);--> statement-breakpoint
CREATE INDEX `idx_manager_two_factors_secret` ON `manager_two_factors` (`secret`);--> statement-breakpoint
CREATE INDEX `idx_manager_verifications_identifier` ON `manager_verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `idx_mastery_state_skill_id` ON `mastery_state` (`skill_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_recovery_requests_user_status` ON `mfa_recovery_requests` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_mfa_recovery_requests_token_hash` ON `mfa_recovery_requests` (`verification_token_hash`) WHERE "mfa_recovery_requests"."verification_token_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_mfa_recovery_requests_requested_by_manager` ON `mfa_recovery_requests` (`requested_by_manager_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_recovery_requests_completed_by_manager` ON `mfa_recovery_requests` (`completed_by_manager_id`) WHERE "mfa_recovery_requests"."completed_by_manager_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notification_deliveries_active_channel` ON `notification_deliveries` (`notification_id`,`channel`);--> statement-breakpoint
CREATE INDEX `idx_notification_deliveries_queued` ON `notification_deliveries` (`status`,`created_at`) WHERE "status" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notification_endpoints_user_installation` ON `notification_endpoints` (`user_id`,`client_installation_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient` ON `notifications` (`recipient_type`,`recipient_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_payment_orders_bank_txn_ref` ON `payment_orders` (`bank_txn_ref`) WHERE "payment_orders"."bank_txn_ref" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_payment_orders_status_submitted_at` ON `payment_orders` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_payment_orders_user_id_status` ON `payment_orders` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payment_orders_status_expires_at` ON `payment_orders` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_payment_orders_package_code` ON `payment_orders` (`package_code`);--> statement-breakpoint
CREATE INDEX `idx_payment_orders_reviewed_by_manager` ON `payment_orders` (`reviewed_by_manager_id`) WHERE "payment_orders"."reviewed_by_manager_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_orders_user_pkg_open` ON `payment_orders` (`user_id`,`package_code`) WHERE "status" IN (1, 2, 3, 4);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payment_transactions_provider_event` ON `payment_transactions` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `idx_payment_transactions_order_id` ON `payment_transactions` (`order_id`) WHERE "payment_transactions"."order_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_payment_transactions_order_uuid` ON `payment_transactions` (`order_uuid`);--> statement-breakpoint
CREATE INDEX `idx_payment_transactions_created_at` ON `payment_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_personal_curricula_user_id` ON `personal_curricula` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_personal_curriculum_enrollments_child_active_unique` ON `personal_curriculum_enrollments` (`child_id`) WHERE "status" = 1;--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_enrollments_child_status` ON `personal_curriculum_enrollments` (`child_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_enrollments_curriculum_id` ON `personal_curriculum_enrollments` (`personal_curriculum_id`);--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_item_progress_child_id` ON `personal_curriculum_item_progress` (`child_id`);--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_item_progress_item_id` ON `personal_curriculum_item_progress` (`personal_curriculum_item_id`);--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_item_progress_status` ON `personal_curriculum_item_progress` (`enrollment_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_personal_curriculum_items_entity` ON `personal_curriculum_items` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_play_sessions_session_uuid` ON `play_sessions` (`session_uuid`);--> statement-breakpoint
CREATE INDEX `idx_play_sessions_game_level_id` ON `play_sessions` (`game_level_id`);--> statement-breakpoint
CREATE INDEX `idx_play_sessions_status_started_at` ON `play_sessions` (`completion_status`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_play_sessions_child_started_at` ON `play_sessions` (`child_profile_id`,`started_at`) WHERE "play_sessions"."child_profile_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_play_sessions_guest_status` ON `play_sessions` (`guest_device_id`,`completion_status`) WHERE "play_sessions"."guest_device_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_recurring_subscriptions_user_status` ON `recurring_subscriptions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_recurring_subscriptions_status_next_billing_at` ON `recurring_subscriptions` (`status`,`next_billing_at`);--> statement-breakpoint
CREATE INDEX `idx_recurring_subscriptions_package_code` ON `recurring_subscriptions` (`package_code`);--> statement-breakpoint
CREATE INDEX `idx_skill_datasets_skill_id` ON `skill_datasets` (`skill_id`);--> statement-breakpoint
CREATE INDEX `idx_skill_prerequisites_prerequisite_id` ON `skill_prerequisites` (`prerequisite_id`);--> statement-breakpoint
CREATE INDEX `idx_skills_strand_id` ON `skills` (`strand_id`);--> statement-breakpoint
CREATE INDEX `idx_strands_competency_id` ON `strands` (`competency_id`);--> statement-breakpoint
CREATE INDEX `idx_strands_parent_strand_id` ON `strands` (`parent_strand_id`);--> statement-breakpoint
CREATE INDEX `idx_telemetry_events_created_at` ON `telemetry_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_telemetry_events_child_uuid` ON `telemetry_events` (`child_uuid`) WHERE "telemetry_events"."child_uuid" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_user_accounts_user_id` ON `user_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_passkeys_user_id` ON `user_passkeys` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_user_id` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_two_factors_secret` ON `user_two_factors` (`secret`);--> statement-breakpoint
CREATE INDEX `idx_user_verifications_identifier` ON `user_verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `idx_users_status_purge_at` ON `users` (`status`,`purge_at`) WHERE "users"."purge_at" IS NOT NULL;
--> statement-breakpoint
CREATE TRIGGER `trg_prevent_consent_logs_update` BEFORE UPDATE ON `consent_logs` BEGIN SELECT RAISE(ABORT, 'BR-DM-05: consent_logs is INSERT-only'); END;
--> statement-breakpoint
CREATE TRIGGER `trg_prevent_consent_logs_delete` BEFORE DELETE ON `consent_logs` BEGIN SELECT RAISE(ABORT, 'BR-DM-05: consent_logs is INSERT-only'); END;
--> statement-breakpoint
CREATE TRIGGER `trg_prevent_audit_logs_update` BEFORE UPDATE ON `audit_logs` BEGIN SELECT RAISE(ABORT, 'BR-DM-05: audit_logs is INSERT-only'); END;
--> statement-breakpoint
CREATE TRIGGER `trg_prevent_audit_logs_delete` BEFORE DELETE ON `audit_logs` BEGIN SELECT RAISE(ABORT, 'BR-DM-05: audit_logs is INSERT-only'); END;
--> statement-breakpoint
CREATE TRIGGER `trg_prevent_completed_play_sessions_update` BEFORE UPDATE ON `play_sessions` WHEN OLD.`completion_status` = 2 BEGIN SELECT RAISE(ABORT, 'BR-SPT-07: Cannot update completed play session'); END;
