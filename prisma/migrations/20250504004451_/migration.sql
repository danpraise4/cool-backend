/*
  Warnings:

  - Added the required column `type` to the `RecycleSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecycleScheduleType" AS ENUM ('PICKUP', 'DROP_OFF');

-- AlterTable
ALTER TABLE "RecycleSchedule" ADD COLUMN     "type" "RecycleScheduleType" NOT NULL;
