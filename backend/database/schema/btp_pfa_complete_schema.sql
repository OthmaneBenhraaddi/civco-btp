-- =============================================================================
-- BTP PFA — Complete MySQL Schema
-- =============================================================================
-- Generated from frontend architectural breakdown + Laravel backend models.
--
-- Includes:
--   • Core tenancy, auth, RBAC
--   • Clients, projects (with promoted BTP fields), phases, phase tasks
--   • Quotes, invoices, payments, expenses, documents
--   • Workspace tasks (Tasks page — French model)
--   • Audit log (Historique)
--   • Laravel infrastructure (sessions, cache, jobs, Sanctum)
--
-- Target: MySQL 8.0+ / MariaDB 10.6+
-- Charset: utf8mb4 (supports BÂTIMENT, PAYÉ, etc.)
--
-- Usage:
--   mysql -u root -p < database/schema/btp_pfa_complete_schema.sql
--
-- WARNING: Drops and recreates the database. All data will be lost.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- Database
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `civco_btp`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `civco_btp`;

-- -----------------------------------------------------------------------------
-- Drop tables (child → parent)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `workspace_task_files`;
DROP TABLE IF EXISTS `workspace_tasks`;
DROP TABLE IF EXISTS `project_lots`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `invoice_lines`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `quote_lines`;
DROP TABLE IF EXISTS `quotes`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `progress_snapshots`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `project_phases`;
DROP TABLE IF EXISTS `project_user`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `user_role`;
DROP TABLE IF EXISTS `role_permission`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `company_user`;
DROP TABLE IF EXISTS `companies`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `migrations`;

-- =============================================================================
-- 1. AUTH & LARAVEL INFRASTRUCTURE
-- =============================================================================

CREATE TABLE `users` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name`        VARCHAR(100)    NOT NULL,
  `last_name`         VARCHAR(100)    NOT NULL,
  `email`             VARCHAR(255)    NOT NULL,
  `phone`             VARCHAR(30)     NULL,
  `is_active`         TINYINT(1)      NOT NULL DEFAULT 1,
  `email_verified_at` TIMESTAMP       NULL,
  `password`          VARCHAR(255)    NOT NULL,
  `remember_token`    VARCHAR(100)    NULL,
  `created_at`        TIMESTAMP       NULL,
  `updated_at`        TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email`      VARCHAR(255) NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP    NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id`            VARCHAR(255) NOT NULL,
  `user_id`       BIGINT UNSIGNED NULL,
  `ip_address`    VARCHAR(45)     NULL,
  `user_agent`    TEXT            NULL,
  `payload`       LONGTEXT        NOT NULL,
  `last_activity` INT             NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`),
  CONSTRAINT `sessions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key`        VARCHAR(255) NOT NULL,
  `value`      MEDIUMTEXT   NOT NULL,
  `expiration` BIGINT       NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key`        VARCHAR(255) NOT NULL,
  `owner`      VARCHAR(255) NOT NULL,
  `expiration` BIGINT       NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue`        VARCHAR(255)    NOT NULL,
  `payload`      LONGTEXT        NOT NULL,
  `attempts`     TINYINT UNSIGNED NOT NULL,
  `reserved_at`  INT UNSIGNED    NULL,
  `available_at` INT UNSIGNED    NOT NULL,
  `created_at`   INT UNSIGNED    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id`             VARCHAR(255) NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `total_jobs`     INT          NOT NULL,
  `pending_jobs`   INT          NOT NULL,
  `failed_jobs`    INT          NOT NULL,
  `failed_job_ids` LONGTEXT     NOT NULL,
  `options`        MEDIUMTEXT   NULL,
  `cancelled_at`   INT          NULL,
  `created_at`     INT          NOT NULL,
  `finished_at`    INT          NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`       VARCHAR(255)    NOT NULL,
  `connection` VARCHAR(255)    NOT NULL,
  `queue`      VARCHAR(255)    NOT NULL,
  `payload`    LONGTEXT        NOT NULL,
  `exception`  LONGTEXT        NOT NULL,
  `failed_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`, `queue`, `failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255)    NOT NULL,
  `tokenable_id`   BIGINT UNSIGNED NOT NULL,
  `name`           TEXT            NOT NULL,
  `token`          VARCHAR(64)     NOT NULL,
  `abilities`      TEXT            NULL,
  `last_used_at`   TIMESTAMP       NULL,
  `expires_at`     TIMESTAMP       NULL,
  `created_at`     TIMESTAMP       NULL,
  `updated_at`     TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch`     INT          NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. TENANCY
-- =============================================================================

CREATE TABLE `companies` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(150)    NOT NULL,
  `legal_name`     VARCHAR(200)    NULL,
  `siret`          VARCHAR(14)     NULL,
  `visibility`     VARCHAR(20)     NOT NULL DEFAULT 'private',
  `email`          VARCHAR(150)    NULL,
  `phone`          VARCHAR(30)     NULL,
  `address_line1`  VARCHAR(255)    NULL,
  `address_line2`  VARCHAR(255)    NULL,
  `postal_code`    VARCHAR(20)     NULL,
  `city`           VARCHAR(100)    NULL,
  `country`        CHAR(2)         NOT NULL DEFAULT 'FR',
  `is_active`      TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP       NULL,
  `updated_at`     TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_siret_unique` (`siret`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `company_user` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `is_primary` TINYINT(1)      NOT NULL DEFAULT 0,
  `joined_at`  DATE            NULL,
  `created_at` TIMESTAMP       NULL,
  `updated_at` TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_user_company_id_user_id_unique` (`company_id`, `user_id`),
  KEY `company_user_user_id_foreign` (`user_id`),
  CONSTRAINT `company_user_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_user_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. RBAC (roles & permissions)
-- =============================================================================

CREATE TABLE `permissions` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100)    NOT NULL,
  `slug`       VARCHAR(100)    NOT NULL,
  `module`     VARCHAR(50)     NOT NULL,
  `created_at` TIMESTAMP       NULL,
  `updated_at` TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`  BIGINT UNSIGNED NULL,
  `name`        VARCHAR(100)    NOT NULL,
  `slug`        VARCHAR(100)    NOT NULL,
  `description` VARCHAR(255)    NULL,
  `badge_tone`  VARCHAR(20)     NULL COMMENT 'UI badge color: purple, sky, amber, emerald, slate',
  `is_system`   TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP       NULL,
  `updated_at`  TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_company_id_slug_unique` (`company_id`, `slug`),
  CONSTRAINT `roles_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permission` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id`       BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `created_at`    TIMESTAMP       NULL,
  `updated_at`    TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permission_role_id_permission_id_unique` (`role_id`, `permission_id`),
  KEY `role_permission_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permission_role_id_foreign`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permission_permission_id_foreign`
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_role` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `role_id`    BIGINT UNSIGNED NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP       NULL,
  `updated_at` TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_role_user_id_role_id_company_id_unique` (`user_id`, `role_id`, `company_id`),
  KEY `user_role_role_id_foreign` (`role_id`),
  KEY `user_role_company_id_foreign` (`company_id`),
  CONSTRAINT `user_role_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_role_id_foreign`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. CLIENTS
-- =============================================================================

CREATE TABLE `clients` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`       BIGINT UNSIGNED NOT NULL,
  `name`             VARCHAR(150)    NOT NULL,
  `contact_name`     VARCHAR(150)    NULL,
  `email`            VARCHAR(150)    NULL,
  `phone`            VARCHAR(30)     NULL,
  `address_line1`    VARCHAR(255)    NULL,
  `address_line2`    VARCHAR(255)    NULL,
  `postal_code`      VARCHAR(20)     NULL,
  `city`             VARCHAR(100)    NULL,
  `country`          CHAR(2)         NOT NULL DEFAULT 'FR',
  `notes`            TEXT            NULL,
  `is_active`        TINYINT(1)      NOT NULL DEFAULT 1,
  `client_role_slug` VARCHAR(50)     NOT NULL DEFAULT 'client_extern'
                     COMMENT 'Frontend role badge: super_admin, chef_chantier, client_extern, etc.',
  `created_at`       TIMESTAMP       NULL,
  `updated_at`       TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `clients_company_id_is_active_index` (`company_id`, `is_active`),
  KEY `clients_company_id_name_index` (`company_id`, `name`),
  CONSTRAINT `clients_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. PROJECTS (core + promoted BTP fields from NewProjectModal)
-- =============================================================================

CREATE TABLE `projects` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`          BIGINT UNSIGNED NOT NULL,
  `client_id`           BIGINT UNSIGNED NOT NULL,
  `reference`           VARCHAR(50)     NOT NULL,
  `title`               VARCHAR(200)    NOT NULL,
  `description`         TEXT            NULL COMMENT 'Legacy JSON blob; prefer first-class columns below',
  `description_meta`    JSON            NULL COMMENT 'documents metadata from create modal before upload',
  `status`              VARCHAR(30)     NOT NULL DEFAULT 'draft'
                        COMMENT 'draft|planned|in_progress|on_hold|completed|cancelled',
  `nature`              ENUM('VRD', 'BÂTIMENT') NULL,
  `sector`              ENUM('PRIVÉ', 'PUBLIC') NOT NULL DEFAULT 'PRIVÉ',
  `etat_paiement`       ENUM('PAYÉ', 'NON PAYÉ') NOT NULL DEFAULT 'NON PAYÉ',
  `delais`              VARCHAR(255)    NULL,
  `avancement`          VARCHAR(255)    NULL,
  `start_date`          DATE            NULL COMMENT 'Ordre de service',
  `end_date`            DATE            NULL COMMENT 'Fin des travaux',
  `actual_start_date`   DATE            NULL,
  `actual_end_date`     DATE            NULL,
  `budget`              DECIMAL(15, 2)  NULL,
  `progress_percent`    DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,
  `site_address_line1`  VARCHAR(255)    NULL,
  `site_city`           VARCHAR(100)    NULL,
  `site_postal_code`    VARCHAR(20)     NULL,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_company_id_reference_unique` (`company_id`, `reference`),
  KEY `projects_client_id_foreign` (`client_id`),
  KEY `projects_company_id_status_index` (`company_id`, `status`),
  KEY `projects_company_id_progress_index` (`company_id`, `progress_percent`),
  CONSTRAINT `projects_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `projects_client_id_foreign`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_lots` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `lot_name`   VARCHAR(255)    NOT NULL,
  `sort_order` INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP       NULL,
  `updated_at` TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_lots_project_id_lot_name_unique` (`project_id`, `lot_name`),
  CONSTRAINT `project_lots_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_phases` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`          BIGINT UNSIGNED NOT NULL,
  `name`                VARCHAR(150)    NOT NULL,
  `sort_order`          INT UNSIGNED    NOT NULL DEFAULT 0,
  `planned_start_date`  DATE            NULL,
  `planned_end_date`    DATE            NULL,
  `progress_percent`    DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `project_phases_project_id_sort_order_index` (`project_id`, `sort_order`),
  CONSTRAINT `project_phases_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase tasks (ProjectDetailPage — API model)
CREATE TABLE `tasks` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_phase_id`     BIGINT UNSIGNED NOT NULL,
  `assigned_to_user_id`  BIGINT UNSIGNED NULL,
  `title`                VARCHAR(200)    NOT NULL,
  `description`          TEXT            NULL,
  `status`               VARCHAR(30)     NOT NULL DEFAULT 'todo'
                         COMMENT 'todo|in_progress|done|blocked',
  `progress_percent`     DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,
  `due_date`             DATE            NULL,
  `completed_at`         TIMESTAMP       NULL,
  `sort_order`           INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`           TIMESTAMP       NULL,
  `updated_at`           TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_project_phase_id_sort_order_index` (`project_phase_id`, `sort_order`),
  KEY `tasks_assigned_to_user_id_foreign` (`assigned_to_user_id`),
  KEY `tasks_status_index` (`status`),
  CONSTRAINT `tasks_project_phase_id_foreign`
    FOREIGN KEY (`project_phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_assigned_to_user_id_foreign`
    FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_user` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`  BIGINT UNSIGNED NOT NULL,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `role_label`  VARCHAR(50)     NULL,
  `assigned_at` DATE            NULL,
  `created_at`  TIMESTAMP       NULL,
  `updated_at`  TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_user_project_id_user_id_unique` (`project_id`, `user_id`),
  KEY `project_user_user_id_foreign` (`user_id`),
  CONSTRAINT `project_user_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_user_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `progress_snapshots` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`          BIGINT UNSIGNED NOT NULL,
  `recorded_by_user_id` BIGINT UNSIGNED NOT NULL,
  `percent`             DECIMAL(5, 2)   NOT NULL,
  `comment`             TEXT            NULL,
  `recorded_at`         TIMESTAMP       NOT NULL,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `progress_snapshots_project_id_recorded_at_index` (`project_id`, `recorded_at`),
  KEY `progress_snapshots_recorded_by_user_id_foreign` (`recorded_by_user_id`),
  CONSTRAINT `progress_snapshots_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_snapshots_recorded_by_user_id_foreign`
    FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. WORKSPACE TASKS (TasksPage — French model, separate from phase tasks)
-- =============================================================================

CREATE TABLE `workspace_tasks` (
  `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`              BIGINT UNSIGNED NOT NULL,
  `project_id`              BIGINT UNSIGNED NULL,
  `project_name`            VARCHAR(200)    NOT NULL,
  `nom`                     VARCHAR(200)    NOT NULL,
  `responsable_name`        VARCHAR(150)    NOT NULL,
  `responsable_avatar_url`  VARCHAR(500)    NULL,
  `statut`                  ENUM('en_cours', 'termine', 'bloque', 'non_commence') NOT NULL DEFAULT 'non_commence',
  `priorite`                ENUM('haute', 'moyenne', 'basse') NOT NULL DEFAULT 'moyenne',
  `echeance`                DATE            NOT NULL,
  `budget`                  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `notes`                   TEXT            NULL,
  `last_updated_by_user_id` BIGINT UNSIGNED NULL,
  `last_updated_by_name`    VARCHAR(150)    NULL,
  `created_at`              TIMESTAMP       NULL,
  `updated_at`              TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `workspace_tasks_company_id_statut_index` (`company_id`, `statut`),
  KEY `workspace_tasks_company_id_echeance_index` (`company_id`, `echeance`),
  KEY `workspace_tasks_project_id_foreign` (`project_id`),
  KEY `workspace_tasks_last_updated_by_user_id_foreign` (`last_updated_by_user_id`),
  CONSTRAINT `workspace_tasks_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workspace_tasks_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `workspace_tasks_last_updated_by_user_id_foreign`
    FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `workspace_task_files` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_task_id`  BIGINT UNSIGNED NOT NULL,
  `filename`           VARCHAR(255)    NOT NULL,
  `created_at`         TIMESTAMP       NULL,
  `updated_at`         TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `workspace_task_files_workspace_task_id_index` (`workspace_task_id`),
  CONSTRAINT `workspace_task_files_workspace_task_id_foreign`
    FOREIGN KEY (`workspace_task_id`) REFERENCES `workspace_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. DOCUMENTS
-- =============================================================================

CREATE TABLE `documents` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`          BIGINT UNSIGNED NOT NULL,
  `uploaded_by_user_id` BIGINT UNSIGNED NOT NULL,
  `documentable_type`   VARCHAR(100)    NOT NULL COMMENT 'App\\Models\\Project, etc.',
  `documentable_id`     BIGINT UNSIGNED NOT NULL,
  `original_filename`   VARCHAR(255)    NOT NULL,
  `storage_path`        VARCHAR(500)    NOT NULL,
  `mime_type`           VARCHAR(100)    NOT NULL,
  `file_size`           BIGINT UNSIGNED NOT NULL,
  `category`            VARCHAR(50)     NULL COMMENT 'plan|contract|photo|report|other',
  `status`              VARCHAR(20)     NOT NULL DEFAULT 'active' COMMENT 'active|archived',
  `archived_at`         TIMESTAMP       NULL,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `documents_documentable_type_documentable_id_index` (`documentable_type`, `documentable_id`),
  KEY `documents_company_id_status_index` (`company_id`, `status`),
  KEY `documents_uploaded_by_user_id_foreign` (`uploaded_by_user_id`),
  CONSTRAINT `documents_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_uploaded_by_user_id_foreign`
    FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. QUOTES & INVOICES
-- =============================================================================

CREATE TABLE `quotes` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `client_id`  BIGINT UNSIGNED NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,
  `reference`  VARCHAR(50)     NOT NULL,
  `status`     VARCHAR(30)     NOT NULL DEFAULT 'draft'
               COMMENT 'draft|sent|accepted|rejected|expired',
  `issued_at`  DATE            NULL,
  `valid_until` DATE           NULL,
  `notes`      TEXT            NULL,
  `total_ht`   DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `total_tax`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `total_ttc`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP       NULL,
  `updated_at` TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotes_company_id_reference_unique` (`company_id`, `reference`),
  KEY `quotes_client_id_foreign` (`client_id`),
  KEY `quotes_project_id_foreign` (`project_id`),
  KEY `quotes_company_id_status_index` (`company_id`, `status`),
  CONSTRAINT `quotes_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quotes_client_id_foreign`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `quotes_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quote_lines` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quote_id`        BIGINT UNSIGNED NOT NULL,
  `sort_order`      INT UNSIGNED    NOT NULL DEFAULT 0,
  `description`     VARCHAR(500)    NOT NULL,
  `quantity`        DECIMAL(12, 3)  NOT NULL DEFAULT 1.000,
  `unit_price_ht`   DECIMAL(15, 2)  NOT NULL,
  `tax_rate`        DECIMAL(5, 2)   NOT NULL DEFAULT 20.00,
  `line_total_ht`   DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `line_total_tax`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `line_total_ttc`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `created_at`      TIMESTAMP       NULL,
  `updated_at`      TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `quote_lines_quote_id_sort_order_index` (`quote_id`, `sort_order`),
  CONSTRAINT `quote_lines_quote_id_foreign`
    FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`   BIGINT UNSIGNED NOT NULL,
  `client_id`    BIGINT UNSIGNED NOT NULL,
  `project_id`   BIGINT UNSIGNED NULL,
  `quote_id`     BIGINT UNSIGNED NULL,
  `reference`    VARCHAR(50)     NOT NULL,
  `status`       VARCHAR(30)     NOT NULL DEFAULT 'draft'
                 COMMENT 'draft|sent|partially_paid|paid|overdue|cancelled',
  `issued_at`    DATE            NULL,
  `due_date`     DATE            NULL,
  `notes`        TEXT            NULL,
  `total_ht`     DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `total_tax`    DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `total_ttc`    DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `amount_paid`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `balance_due`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `created_at`   TIMESTAMP       NULL,
  `updated_at`   TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_company_id_reference_unique` (`company_id`, `reference`),
  KEY `invoices_client_id_foreign` (`client_id`),
  KEY `invoices_project_id_foreign` (`project_id`),
  KEY `invoices_quote_id_foreign` (`quote_id`),
  KEY `invoices_company_id_status_index` (`company_id`, `status`),
  KEY `invoices_company_id_due_date_index` (`company_id`, `due_date`),
  CONSTRAINT `invoices_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_client_id_foreign`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `invoices_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_quote_id_foreign`
    FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_lines` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id`      BIGINT UNSIGNED NOT NULL,
  `sort_order`      INT UNSIGNED    NOT NULL DEFAULT 0,
  `description`     VARCHAR(500)    NOT NULL,
  `quantity`        DECIMAL(12, 3)  NOT NULL DEFAULT 1.000,
  `unit_price_ht`   DECIMAL(15, 2)  NOT NULL,
  `tax_rate`        DECIMAL(5, 2)   NOT NULL DEFAULT 20.00,
  `line_total_ht`   DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `line_total_tax`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `line_total_ttc`  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
  `created_at`      TIMESTAMP       NULL,
  `updated_at`      TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_lines_invoice_id_sort_order_index` (`invoice_id`, `sort_order`),
  CONSTRAINT `invoice_lines_invoice_id_foreign`
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id`          BIGINT UNSIGNED NOT NULL,
  `recorded_by_user_id` BIGINT UNSIGNED NULL,
  `amount`              DECIMAL(15, 2)  NOT NULL,
  `paid_at`             DATE            NOT NULL,
  `method`              VARCHAR(30)     NOT NULL
                        COMMENT 'bank_transfer|cash|check|card|other',
  `reference`           VARCHAR(100)    NULL,
  `notes`               TEXT            NULL,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `payments_invoice_id_paid_at_index` (`invoice_id`, `paid_at`),
  KEY `payments_recorded_by_user_id_foreign` (`recorded_by_user_id`),
  CONSTRAINT `payments_invoice_id_foreign`
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_recorded_by_user_id_foreign`
    FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. EXPENSES
-- =============================================================================

CREATE TABLE `expenses` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`          BIGINT UNSIGNED NOT NULL,
  `recorded_by_user_id` BIGINT UNSIGNED NOT NULL,
  `label`               VARCHAR(200)    NOT NULL,
  `category`            VARCHAR(30)     NOT NULL
                        COMMENT 'materials|labor|equipment|subcontractor|other',
  `amount`              DECIMAL(15, 2)  NOT NULL,
  `expense_date`        DATE            NOT NULL,
  `notes`               TEXT            NULL,
  `created_at`          TIMESTAMP       NULL,
  `updated_at`          TIMESTAMP       NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_project_id_expense_date_index` (`project_id`, `expense_date`),
  KEY `expenses_recorded_by_user_id_foreign` (`recorded_by_user_id`),
  CONSTRAINT `expenses_project_id_foreign`
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_recorded_by_user_id_foreign`
    FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. AUDIT LOG (Historique — replaces browser localStorage)
-- =============================================================================

CREATE TABLE `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id`  BIGINT UNSIGNED NOT NULL,
  `user_id`     BIGINT UNSIGNED NULL,
  `actor_label` VARCHAR(200)    NOT NULL COMMENT 'Display name shown in UI, e.g. Admin Demo / Administrateur',
  `action`      ENUM('creation', 'modification', 'suppression') NOT NULL,
  `entity_type` VARCHAR(50)     NULL COMMENT 'client|project|quote|invoice|payment|task|document|expense',
  `entity_id`   BIGINT UNSIGNED NULL,
  `message`     TEXT            NOT NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_company_id_created_at_index` (`company_id`, `created_at` DESC),
  KEY `audit_logs_entity_type_entity_id_index` (`entity_type`, `entity_id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `audit_logs_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 11. REFERENCE DATA — Permissions (matches PermissionSeeder)
-- =============================================================================

INSERT INTO `permissions` (`name`, `slug`, `module`, `created_at`, `updated_at`) VALUES
  ('View dashboard',       'dashboard.view',    'dashboard', NOW(), NOW()),
  ('View users',           'user.view',         'user',      NOW(), NOW()),
  ('Create users',         'user.create',       'user',      NOW(), NOW()),
  ('Update users',         'user.update',       'user',      NOW(), NOW()),
  ('Delete users',         'user.delete',       'user',      NOW(), NOW()),
  ('View roles',           'role.view',         'role',      NOW(), NOW()),
  ('Manage roles',         'role.manage',       'role',      NOW(), NOW()),
  ('View companies',       'company.view',      'company',   NOW(), NOW()),
  ('Manage companies',     'company.manage',    'company',   NOW(), NOW()),
  ('View clients',         'client.view',       'client',    NOW(), NOW()),
  ('Create clients',       'client.create',     'client',    NOW(), NOW()),
  ('Update clients',       'client.update',     'client',    NOW(), NOW()),
  ('Delete clients',       'client.delete',     'client',    NOW(), NOW()),
  ('View projects',        'project.view',      'project',   NOW(), NOW()),
  ('Create projects',      'project.create',    'project',   NOW(), NOW()),
  ('Update projects',      'project.update',    'project',   NOW(), NOW()),
  ('Delete projects',      'project.delete',    'project',   NOW(), NOW()),
  ('View documents',       'document.view',     'document',  NOW(), NOW()),
  ('Upload documents',     'document.upload',   'document',  NOW(), NOW()),
  ('Archive documents',    'document.archive',  'document',  NOW(), NOW()),
  ('View quotes',          'quote.view',        'quote',     NOW(), NOW()),
  ('Manage quotes',        'quote.manage',      'quote',     NOW(), NOW()),
  ('View invoices',        'invoice.view',      'invoice',   NOW(), NOW()),
  ('Manage invoices',      'invoice.manage',    'invoice',   NOW(), NOW()),
  ('Record payments',      'payment.record',    'payment',   NOW(), NOW()),
  ('View expenses',        'expense.view',      'expense',   NOW(), NOW()),
  ('Manage expenses',      'expense.manage',    'expense',   NOW(), NOW()),
  ('View all tasks',       'task.view_all',     'task',      NOW(), NOW()),
  ('View own tasks',       'task.view_own',     'task',      NOW(), NOW()),
  ('Assign tasks',         'task.assign',       'task',      NOW(), NOW()),
  ('Update tasks',         'task.update',       'task',      NOW(), NOW()),
  ('View project budget',  'project.budget',    'project',   NOW(), NOW());

-- =============================================================================
-- 12. REFERENCE DATA — System roles (matches RoleSeeder + RolesPage mock IDs)
-- =============================================================================

INSERT INTO `roles` (`company_id`, `name`, `slug`, `description`, `badge_tone`, `is_system`, `created_at`, `updated_at`) VALUES
  (NULL, 'Administrateur',       'admin',              'Full access within the company',              'purple',  1, NOW(), NOW()),
  (NULL, 'Chef de projet',       'project_manager',    'Project planning and tracking',               'sky',     1, NOW(), NOW()),
  (NULL, 'Commercial',           'commercial',         'Clients and commercial documents',            'amber',   1, NOW(), NOW()),
  (NULL, 'Comptable',            'accountant',         'Billing and financial operations',            'emerald', 1, NOW(), NOW()),
  (NULL, 'Collaborateur',        'collaborator',       'Operational access on assigned work',         'slate',   1, NOW(), NOW()),
  (NULL, 'Super Admin',          'super_admin',        'Full system access (UI mock role)',           'purple',  1, NOW(), NOW()),
  (NULL, 'Chef de chantier',     'chef_chantier',      'Site manager (UI mock role)',                 'amber',   1, NOW(), NOW()),
  (NULL, 'Conducteur de travaux','conducteur_travaux', 'Works supervisor (UI mock role)',             'sky',     1, NOW(), NOW()),
  (NULL, 'Client externe',       'client_extern',      'External client portal role (UI mock role)',  'slate',   1, NOW(), NOW());

-- =============================================================================
-- Schema complete.
-- Run Laravel seeders after import for demo company/user data:
--   php artisan db:seed
-- =============================================================================
