-- CreateEnum
CREATE TYPE "RecycleScheduleStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RecycleSchedule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dates" TIMESTAMP(3)[],
    "userId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "status" "RecycleScheduleStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "RecycleSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecycleSchedule" ADD CONSTRAINT "RecycleSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycleSchedule" ADD CONSTRAINT "RecycleSchedule_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facilites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecycleSchedule" ADD CONSTRAINT "RecycleSchedule_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
