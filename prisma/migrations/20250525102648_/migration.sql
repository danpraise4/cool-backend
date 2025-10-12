/*
  Warnings:

  - You are about to drop the column `media` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "media",
ADD COLUMN     "images" TEXT[];
