/*
  Warnings:

  - You are about to drop the column `materialId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `facilityId` on the `RecycleSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `materialId` on the `RecycleSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `facilityId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the `Facilites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Materials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FacilitesToMaterials` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `material` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facility` to the `RecycleSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `material` to the `RecycleSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facility` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Facilites" DROP CONSTRAINT "Facilites_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Materials" DROP CONSTRAINT "Materials_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_materialId_fkey";

-- DropForeignKey
ALTER TABLE "RecycleSchedule" DROP CONSTRAINT "RecycleSchedule_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "RecycleSchedule" DROP CONSTRAINT "RecycleSchedule_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "_FacilitesToMaterials" DROP CONSTRAINT "_FacilitesToMaterials_A_fkey";

-- DropForeignKey
ALTER TABLE "_FacilitesToMaterials" DROP CONSTRAINT "_FacilitesToMaterials_B_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "materialId",
ADD COLUMN     "material" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RecycleSchedule" DROP COLUMN "facilityId",
DROP COLUMN "materialId",
ADD COLUMN     "facility" TEXT NOT NULL,
ADD COLUMN     "material" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "facilityId",
ADD COLUMN     "facility" TEXT NOT NULL;

-- DropTable
DROP TABLE "Facilites";

-- DropTable
DROP TABLE "Materials";

-- DropTable
DROP TABLE "_FacilitesToMaterials";
