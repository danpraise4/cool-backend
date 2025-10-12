-- CreateEnum
CREATE TYPE "RecycleChatAttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "RecycleChatType" AS ENUM ('WITH_FACILITY', 'WITH_SELLER');

-- CreateTable
CREATE TABLE "RecycleChat" (
    "id" TEXT NOT NULL,
    "chatID" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "withUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "RecycleChatType" NOT NULL,

    CONSTRAINT "RecycleChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecycleChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readBy" TEXT[],
    "message" TEXT NOT NULL,
    "recycleChatId" TEXT NOT NULL,
    "lastMessageForId" TEXT,
    "attachment" TEXT,

    CONSTRAINT "RecycleChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecycleChatAttachment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "RecycleChatAttachmentType" NOT NULL,

    CONSTRAINT "RecycleChatAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecycleChatMessage_recycleChatId_key" ON "RecycleChatMessage"("recycleChatId");

-- CreateIndex
CREATE UNIQUE INDEX "RecycleChatMessage_lastMessageForId_key" ON "RecycleChatMessage"("lastMessageForId");

-- AddForeignKey
ALTER TABLE "RecycleChatMessage" ADD CONSTRAINT "RecycleChatMessage_recycleChatId_fkey" FOREIGN KEY ("recycleChatId") REFERENCES "RecycleChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycleChatMessage" ADD CONSTRAINT "RecycleChatMessage_lastMessageForId_fkey" FOREIGN KEY ("lastMessageForId") REFERENCES "RecycleChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycleChatAttachment" ADD CONSTRAINT "RecycleChatAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "RecycleChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
