-- AlterTable
ALTER TABLE "RecycleSchedule" ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;
