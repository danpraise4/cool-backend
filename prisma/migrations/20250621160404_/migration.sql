/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Facility` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Facility_id_key" ON "Facility"("id");
