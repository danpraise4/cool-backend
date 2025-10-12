-- DropIndex
DROP INDEX "Admin_email_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Facilites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PUBLISHED',
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Facilites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FacilitesToMaterials" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FacilitesToMaterials_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FacilitesToMaterials_B_index" ON "_FacilitesToMaterials"("B");

-- AddForeignKey
ALTER TABLE "Facilites" ADD CONSTRAINT "Facilites_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacilitesToMaterials" ADD CONSTRAINT "_FacilitesToMaterials_A_fkey" FOREIGN KEY ("A") REFERENCES "Facilites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FacilitesToMaterials" ADD CONSTRAINT "_FacilitesToMaterials_B_fkey" FOREIGN KEY ("B") REFERENCES "Materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
