/*
  Warnings:

  - You are about to drop the column `lastMessageForId` on the `RecycleChatMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecycleChatMessage" DROP CONSTRAINT "RecycleChatMessage_lastMessageForId_fkey";

-- DropIndex
DROP INDEX "RecycleChatMessage_lastMessageForId_key";

-- AlterTable
ALTER TABLE "RecycleChatMessage" DROP COLUMN "lastMessageForId";

-- AddForeignKey
ALTER TABLE "RecycleChat" ADD CONSTRAINT "RecycleChat_lastMessageID_fkey" FOREIGN KEY ("lastMessageID") REFERENCES "RecycleChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
