-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePhoto" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "workingDays" TEXT[],
    "distanceInMiles" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "abbr" TEXT,
    "price" JSONB NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_materialUnitPrice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_materialUnitPrice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_materialUnitPrice_B_index" ON "_materialUnitPrice"("B");

-- AddForeignKey
ALTER TABLE "_materialUnitPrice" ADD CONSTRAINT "_materialUnitPrice_A_fkey" FOREIGN KEY ("A") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_materialUnitPrice" ADD CONSTRAINT "_materialUnitPrice_B_fkey" FOREIGN KEY ("B") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
