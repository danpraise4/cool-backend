/*
  Warnings:

  - Added the required column `senderID` to the `RecycleChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecycleChatMessage" ADD COLUMN     "senderID" TEXT NOT NULL;
