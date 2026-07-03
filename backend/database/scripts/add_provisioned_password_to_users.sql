-- Add encrypted provisioned password storage for super-admin credential reveal.
ALTER TABLE `users`
    ADD COLUMN `provisioned_password` TEXT NULL AFTER `password`;
