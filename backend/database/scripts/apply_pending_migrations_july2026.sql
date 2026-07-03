-- Pending migrations through 2026_07_04 (apply via MySQL when artisan is unavailable)
-- Usage: mysql -u root civco_btp < database/scripts/apply_pending_migrations_july2026.sql

SET FOREIGN_KEY_CHECKS=0;

-- 2026_07_01_110000_add_tenant_id_to_users_table
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `tenant_id` BIGINT UNSIGNED NULL AFTER `id`,
  ADD CONSTRAINT `users_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

-- 2026_07_01_120000_add_status_to_users_table
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `is_active`;
UPDATE `users` SET `status` = 'inactive' WHERE `is_active` = 0 AND `status` = 'active';

-- 2026_07_02_100002_add_client_id_to_users_table
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `client_id` BIGINT UNSIGNED NULL AFTER `tenant_id`,
  ADD CONSTRAINT `users_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

-- 2026_07_02_100000_create_project_comments_table
CREATE TABLE IF NOT EXISTS `project_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  INDEX `project_comments_project_id_created_at_index` (`project_id`, `created_at`),
  CONSTRAINT `project_comments_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_comments_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2026_07_02_100001_create_project_media_table
CREATE TABLE IF NOT EXISTS `project_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `uploaded_by_user_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  INDEX `project_media_project_id_created_at_index` (`project_id`, `created_at`),
  CONSTRAINT `project_media_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_media_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_media_uploaded_by_user_id_foreign` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2026_07_03_100000_create_contract_templates_table
CREATE TABLE IF NOT EXISTS `contract_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  INDEX `contract_templates_tenant_id_index` (`tenant_id`),
  CONSTRAINT `contract_templates_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2026_07_03_100001_create_contracts_table
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NULL,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `client_id` BIGINT UNSIGNED NOT NULL,
  `contract_template_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
  `client_signed_at` TIMESTAMP NULL,
  `tenant_signed_at` TIMESTAMP NULL,
  `client_signature_data` LONGTEXT NULL,
  `tenant_signature_data` LONGTEXT NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  INDEX `contracts_project_id_status_index` (`project_id`, `status`),
  INDEX `contracts_client_id_status_index` (`client_id`, `status`),
  CONSTRAINT `contracts_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contracts_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `contracts_contract_template_id_foreign` FOREIGN KEY (`contract_template_id`) REFERENCES `contract_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2026_07_04_100000_logistics_and_printing_policy
ALTER TABLE `tenants`
  ADD COLUMN IF NOT EXISTS `max_official_prints` TINYINT UNSIGNED NOT NULL DEFAULT 2 AFTER `status`;

CREATE TABLE IF NOT EXISTS `dispatch_notes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NULL,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `client_id` BIGINT UNSIGNED NOT NULL,
  `reference_number` VARCHAR(50) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
  `executed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  UNIQUE KEY `dispatch_notes_company_id_reference_number_unique` (`company_id`, `reference_number`),
  CONSTRAINT `dispatch_notes_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dispatch_notes_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dispatch_notes_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `delivery_forms`
  ADD COLUMN IF NOT EXISTS `dispatch_note_id` BIGINT UNSIGNED NULL AFTER `invoice_id`,
  ADD COLUMN IF NOT EXISTS `print_count` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `status`;

UPDATE `delivery_forms` SET `status` = 'signed_and_stamped' WHERE `status` = 'invoiced';

ALTER TABLE `delivery_forms`
  ADD CONSTRAINT `delivery_forms_dispatch_note_id_foreign` FOREIGN KEY (`dispatch_note_id`) REFERENCES `dispatch_notes` (`id`) ON DELETE SET NULL;

ALTER TABLE `invoices`
  ADD COLUMN IF NOT EXISTS `dispatch_note_id` BIGINT UNSIGNED NULL AFTER `quote_id`,
  ADD CONSTRAINT `invoices_dispatch_note_id_foreign` FOREIGN KEY (`dispatch_note_id`) REFERENCES `dispatch_notes` (`id`) ON DELETE SET NULL;

ALTER TABLE `contracts`
  ADD COLUMN IF NOT EXISTS `print_count` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `status`;

SET FOREIGN_KEY_CHECKS=1;

INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
('2026_07_01_110000_add_tenant_id_to_users_table', 99),
('2026_07_01_120000_add_status_to_users_table', 99),
('2026_07_02_100000_create_project_comments_table', 99),
('2026_07_02_100001_create_project_media_table', 99),
('2026_07_02_100002_add_client_id_to_users_table', 99),
('2026_07_03_100000_create_contract_templates_table', 99),
('2026_07_03_100001_create_contracts_table', 99),
('2026_07_04_100000_logistics_and_printing_policy', 99);
