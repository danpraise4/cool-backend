-- CreateTable
CREATE TABLE "Materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "media" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Materials_adminId_idx" ON "Materials"("adminId");

-- AddForeignKey
ALTER TABLE "Materials" ADD CONSTRAINT "Materials_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
