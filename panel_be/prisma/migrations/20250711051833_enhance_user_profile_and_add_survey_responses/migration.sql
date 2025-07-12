/*
  Warnings:

  - You are about to drop the column `userId` on the `Survey` table. All the data in the column will be lost.
  - Added the required column `category` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDuration` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reward` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Survey` DROP FOREIGN KEY `Survey_userId_fkey`;

-- DropIndex
DROP INDEX `Survey_userId_fkey` ON `Survey`;

-- AlterTable
ALTER TABLE `Survey` DROP COLUMN `userId`,
    ADD COLUMN `category` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdById` INTEGER NOT NULL,
    ADD COLUMN `estimatedDuration` INTEGER NOT NULL,
    ADD COLUMN `questions` JSON NULL,
    ADD COLUMN `reward` INTEGER NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `targetAudience` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `children` INTEGER NULL,
    ADD COLUMN `education` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL DEFAULT 'prefer_not_to_say',
    ADD COLUMN `householdSize` INTEGER NULL,
    ADD COLUMN `income` VARCHAR(191) NULL,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `maritalStatus` VARCHAR(191) NULL,
    ADD COLUMN `profileCompletion` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalPoints` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SurveyResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyId` INTEGER NOT NULL,
    `respondentId` INTEGER NOT NULL,
    `responses` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `timeSpent` INTEGER NULL,
    `pointsEarned` INTEGER NOT NULL DEFAULT 0,
    `isQualified` BOOLEAN NOT NULL DEFAULT true,
    `disqualificationReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SurveyResponse_surveyId_fkey`(`surveyId`),
    INDEX `SurveyResponse_respondentId_fkey`(`respondentId`),
    UNIQUE INDEX `SurveyResponse_surveyId_respondentId_key`(`surveyId`, `respondentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserActivity_userId_fkey`(`userId`),
    INDEX `UserActivity_type_fkey`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Survey_createdById_fkey` ON `Survey`(`createdById`);

-- AddForeignKey
ALTER TABLE `Survey` ADD CONSTRAINT `Survey_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyResponse` ADD CONSTRAINT `SurveyResponse_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyResponse` ADD CONSTRAINT `SurveyResponse_respondentId_fkey` FOREIGN KEY (`respondentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivity` ADD CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
