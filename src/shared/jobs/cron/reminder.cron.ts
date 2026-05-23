import { reminderQueue } from "../queues";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";
import logger from "../../services/logger";

export class ReminderCron {
  public static async checkDueReminders() {
    const now = new Date();
    const dueReminders = await prismaClient.recycleReminder.findMany({
      where: { remindAt: { lte: new Date(now.getTime() + 5 * 60 * 1000) } },
      include: { user: { include: { settings: true } } },
    });

    logger.info({ count: dueReminders.length }, "due reminders found");

    for (const reminder of dueReminders) {
      if (!reminder.user.settings?.isPushNotificationsEnabled) continue;

      await reminderQueue.add(
        "send-reminder",
        { reminderId: reminder.id },
        {
          delay: 0,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        }
      );
    }
  }
}
