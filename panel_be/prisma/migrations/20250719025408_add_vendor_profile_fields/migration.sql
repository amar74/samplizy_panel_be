-- AlterTable
ALTER TABLE `Vendor` ADD COLUMN `annualRevenue` VARCHAR(191) NULL,
    ADD COLUMN `businessInformation` VARCHAR(191) NULL,
    ADD COLUMN `numberOfEmployees` INTEGER NULL,
    ADD COLUMN `otherDocuments` VARCHAR(191) NULL,
    ADD COLUMN `panelBook` VARCHAR(191) NULL,
    ADD COLUMN `panelRegistrationDetails` VARCHAR(191) NULL,
    ADD COLUMN `previousProjects` LONGTEXT NULL,
    ADD COLUMN `servicesOffered` LONGTEXT NULL,
    ADD COLUMN `whyPartnerWithUs` LONGTEXT NULL,
    ADD COLUMN `yearsInBusiness` INTEGER NULL;
