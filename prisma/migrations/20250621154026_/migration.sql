/*
  Warnings:

  - You are about to drop the column `abbr` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the `_materialUnitPrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_materialUnitPrice" DROP CONSTRAINT "_materialUnitPrice_A_fkey";

-- DropForeignKey
ALTER TABLE "_materialUnitPrice" DROP CONSTRAINT "_materialUnitPrice_B_fkey";

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "materialUnitPrice" JSONB[];

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "abbr",
DROP COLUMN "price",
DROP COLUMN "unit";

-- DropTable
DROP TABLE "_materialUnitPrice";
