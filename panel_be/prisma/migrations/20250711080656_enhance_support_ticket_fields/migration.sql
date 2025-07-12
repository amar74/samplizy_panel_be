/*
  Warnings:

  - Added the required column `category` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `SupportTicket` ADD COLUMN `category` VARCHAR(191) NOT NULL,
    ADD COLUMN `priority` VARCHAR(191) NOT NULL;
