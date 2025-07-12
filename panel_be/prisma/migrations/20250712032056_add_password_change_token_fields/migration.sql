-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordChangeExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordChangeToken` VARCHAR(191) NULL;
