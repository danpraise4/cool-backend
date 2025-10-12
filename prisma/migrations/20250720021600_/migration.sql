-- CreateEnum
CREATE TYPE "RecyclerScheduleReminder" AS ENUM ('IN_1_WEEK', 'IN_3_DAYS', 'IN_2_WEEKS', 'IN_1_HOURS', 'IN_1_MONTH', 'IN_15_MINUTES');

-- AlterTable
ALTER TABLE "RecycleSchedule" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;
