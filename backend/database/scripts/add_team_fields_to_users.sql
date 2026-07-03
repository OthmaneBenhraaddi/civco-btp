-- Team management fields on users (run once; ignore errors if columns already exist)
ALTER TABLE `users` ADD COLUMN `cin` VARCHAR(32) NULL AFTER `last_name`;
ALTER TABLE `users` ADD COLUMN `job_title` VARCHAR(100) NULL AFTER `role`;
