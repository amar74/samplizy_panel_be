-- AlterTable
ALTER TABLE `Vendor` ADD COLUMN `emailVerificationExpires` DATETIME(3) NULL,
    ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL;
