-- CreateEnum
CREATE TYPE "public"."LocationAccuracy" AS ENUM ('EXACT', 'CITY', 'STATE', 'COUNTRY');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationAccuracy" "public"."LocationAccuracy" NOT NULL DEFAULT 'CITY',
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "shareLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "timezone" TEXT;
