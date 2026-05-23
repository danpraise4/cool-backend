import { Job, Worker } from "bullmq";
import { redis } from "../utils/catch";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";
import PushService from "../../services/notification/notification.service";
import { ReminderCron } from "../cron/reminder.cron";
import { STATUS } from "../../config/app.constants";
import logger from "../../services/logger";

export const remindersWorker = new Worker(
  "reminders",
  async (job: Job) => {
    job.updateData({ status: "processing" });

    try {
      if (job.name === "check-reminders") {
        await ReminderCron.checkDueReminders();
        job.updateData({ status: "completed" });
        return;
      }

      if (job.name === "send-reminder") {
        const { reminderId } = job.data;

        const reminder = await prismaClient.recycleReminder.findFirst({
          where: { id: reminderId },
          include: { user: { include: { settings: true } }, schedule: true },
        });

        if (!reminder) {
          logger.warn({ reminderId }, "reminder not found");
          return;
        }

        if (!reminder.user.settings?.isPushNotificationsEnabled) return;
        if (!reminder.user.deviceToken) return;

        const scheduleDate = reminder.schedule.dates[0];
        const isDayBefore =
          reminder.remindAt &&
          scheduleDate &&
          new Date(reminder.remindAt).getDate() === new Date(scheduleDate).getDate() - 1;

        const title = isDayBefore ? "Recycle Reminder - Tomorrow" : "Recycle Reminder - Today";
        const body = isDayBefore
          ? `Don't forget! You have a recycling appointment tomorrow at ${reminder.schedule.facility}`
          : `Your recycling appointment is today at ${reminder.schedule.facility}`;

        await PushService.getInstance().emitNotificationToClient(reminder.userId, { title, body }, {
          type: "recycle_reminder",
          scheduleId: reminder.scheduleId,
          reminderId: reminder.id,
        });

        await prismaClient.notification.create({
          data: {
            userId: reminder.userId,
            title,
            body,
            link: `/recycle/schedule/${reminder.scheduleId}`,
          },
        });

        await prismaClient.recycleReminder.update({
          where: { id: reminderId },
          data: { status: STATUS.COMPLETED },
        });

        job.updateData({ status: "completed" });
      }
    } catch (error) {
      logger.error({ err: error, jobName: job.name }, "reminder job failed");
      job.updateData({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
  { connection: redis }
);
