/*
  Warnings:

  - You are about to drop the `CharityProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CharityProduct" DROP CONSTRAINT "CharityProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "CharityProduct" DROP CONSTRAINT "CharityProduct_userId_fkey";

-- DropTable
DROP TABLE "CharityProduct";

-- CreateTable
CREATE TABLE "ChartProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChartProduct" ADD CONSTRAINT "ChartProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartProduct" ADD CONSTRAINT "ChartProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
