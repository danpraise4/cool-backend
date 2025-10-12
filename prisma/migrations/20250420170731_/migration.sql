-- CreateEnum
CREATE TYPE "FacilityDays" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Facilites" ADD COLUMN     "days" "FacilityDays"[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "recyclingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "recyclingFeeCurrency" "Currency" NOT NULL DEFAULT 'EUR',
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facilites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
