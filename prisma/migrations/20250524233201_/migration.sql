/*
  Warnings:

  - A unique constraint covering the columns `[lastMessageID]` on the table `RecycleChat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RecycleChat" ADD COLUMN     "lastMessageID" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RecycleChat_lastMessageID_key" ON "RecycleChat"("lastMessageID");
