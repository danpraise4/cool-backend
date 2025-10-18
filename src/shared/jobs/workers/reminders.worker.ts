import { Job, Worker } from "bullmq";
import { redis } from "../utils/catch";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";
import PushService from "../../services/notification/notification.service";
import { ReminderCron } from "../cron/reminder.cron";
import { STATUS } from "../../config/app.constants";

export const remindersWorker = new Worker(
  "reminders",
  async (job: Job) => {
    job.updateData({ status: "processing" });
    console.log("Processing reminder job:", job.name);

    try {
      // Handle different job types
      if (job.name === 'check-reminders') {
        await ReminderCron.checkDueReminders();
        job.updateData({ status: "completed" });
        return;
      }

      if (job.name === 'send-reminder') {
        const { reminderId } = job.data;

        // Get the reminder with user and schedule details
        const reminder = await prismaClient.recycleReminder.findFirst({
          where: { id: reminderId },
          include: {
            user: {
              include: {
                settings: true
              }
            },
            schedule: true
          }
        });

        if (!reminder) {
          console.log(`Reminder ${reminderId} not found`);
          return;
        }

        // Check if user has push notifications enabled
        if (!reminder.user.settings?.isPushNotificationsEnabled) {
          console.log(`Push notifications disabled for user ${reminder.user.id}`);
          return;
        }

        // Check if user has device token
        if (!reminder.user.deviceToken) {
          console.log(`No device token for user ${reminder.user.id}`);
          return;
        }

        // Create notification message
        const scheduleDate = reminder.schedule.dates[0];
        const isDayBefore = reminder.remindAt && scheduleDate && 
          new Date(reminder.remindAt).getDate() === new Date(scheduleDate).getDate() - 1;
        
        const title = isDayBefore 
          ? "Recycle Reminder - Tomorrow" 
          : "Recycle Reminder - Today";
        
        const body = isDayBefore
          ? `Don't forget! You have a recycling appointment tomorrow at ${reminder.schedule.facility}`
          : `Your recycling appointment is today at ${reminder.schedule.facility}`;

        // Send push notification
        const pushService = PushService.getInstance();
        await pushService.emitNotficationToClient(
          reminder.userId,
          { title, body },
          {
            type: "recycle_reminder",
            scheduleId: reminder.scheduleId,
            reminderId: reminder.id
          }
        );

        // Create in-app notification
        await prismaClient.notification.create({
          data: {
            userId: reminder.userId,
            title,
            body,
            link: `/recycle/schedule/${reminder.scheduleId}`
          }
        });

        // Mark reminder as sent (optional - you might want to delete it instead)
        await prismaClient.recycleReminder.update({
          where: { id: reminderId },
          data: {
            status: STATUS.COMPLETED
          }
        });

        console.log(`Reminder sent to user ${reminder.userId}`);
        job.updateData({ status: "completed" });
      }

    } catch (error) {
      console.error(`Error processing reminder job:`, error);
      job.updateData({ status: "failed", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },
  {
    connection: redis,
  }
);
