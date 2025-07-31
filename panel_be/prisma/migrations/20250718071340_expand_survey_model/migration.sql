-- AlterTable
ALTER TABLE `Survey` ADD COLUMN `advanced` JSON NULL,
    ADD COLUMN `audit` JSON NULL,
    ADD COLUMN `clientName` VARCHAR(191) NULL,
    ADD COLUMN `confidentiality` VARCHAR(191) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `language` VARCHAR(191) NULL,
    ADD COLUMN `limits` JSON NULL,
    ADD COLUMN `projectCode` VARCHAR(191) NULL,
    ADD COLUMN `qualityControls` JSON NULL,
    ADD COLUMN `rewardType` VARCHAR(191) NULL,
    ADD COLUMN `surveyLinks` JSON NULL,
    ADD COLUMN `surveyType` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SurveyAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `surveyStatus` VARCHAR(191) NOT NULL,
    `responseDuration` INTEGER NULL,
    `qualityFlag` VARCHAR(191) NULL,
    `completionDate` DATETIME(3) NULL,
    `responseId` INTEGER NULL,
    `incentiveGranted` BOOLEAN NULL DEFAULT false,
    `incentiveValue` INTEGER NULL,
    `isRecontactEligible` BOOLEAN NULL DEFAULT false,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `remarksInternal` VARCHAR(191) NULL,
    `clientNotes` VARCHAR(191) NULL,

    INDEX `SurveyAssignment_surveyId_idx`(`surveyId`),
    INDEX `SurveyAssignment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SurveyAssignment` ADD CONSTRAINT `SurveyAssignment_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyAssignment` ADD CONSTRAINT `SurveyAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
