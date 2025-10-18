-- DropEnum
DROP TYPE "public"."RecyclerScheduleReminder";

-- CreateTable
CREATE TABLE "public"."RecycleReminder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "remindAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,

    CONSTRAINT "RecycleReminder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."RecycleReminder" ADD CONSTRAINT "RecycleReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecycleReminder" ADD CONSTRAINT "RecycleReminder_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."RecycleSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
