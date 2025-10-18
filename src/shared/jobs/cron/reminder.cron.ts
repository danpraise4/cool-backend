import { reminderQueue } from "../queues";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";

export class ReminderCron {
  public static async checkDueReminders() {
    console.log("Checking for due reminders...");

    try {
      // Get current time
      const now = new Date();
      
      // Find reminders that are due (within the next 5 minutes to account for processing time)
      const dueReminders = await prismaClient.recycleReminder.findMany({
        where: {
          remindAt: {
            lte: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
          }
        },
        include: {
          user: {
            include: {
              settings: true
            }
          }
        }
      });

      console.log(`Found ${dueReminders.length} due reminders`);

      // Process each due reminder
      for (const reminder of dueReminders) {
        // Check if user has push notifications enabled
        if (!reminder.user.settings?.isPushNotificationsEnabled) {
          console.log(`Push notifications disabled for user ${reminder.user.id}`);
          continue;
        }

        // Add job to queue
        await reminderQueue.add(
          'send-reminder',
          { reminderId: reminder.id },
          {
            delay: 0, // Send immediately
            attempts: 3, // Retry up to 3 times
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        );

        console.log(`Added reminder job for user ${reminder.user.id}`);
      }

    } catch (error) {
      console.error("Error checking due reminders:", error);
    }
  }
}
