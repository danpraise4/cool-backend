-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CHARITY_PRODUCT', 'SALES_PRODUCT');

-- AlterTable
ALTER TABLE "Materials" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PUBLISHED',
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "media" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "soldToId" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'SALES_PRODUCT',
    "status" "Status" NOT NULL DEFAULT 'PUBLISHED',
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "materialId" TEXT NOT NULL,
    "images" TEXT[],

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_soldToId_fkey" FOREIGN KEY ("soldToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
