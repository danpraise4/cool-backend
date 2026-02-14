"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCron = void 0;
const queues_1 = require("../queues");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
class ReminderCron {
    static async checkDueReminders() {
        console.log("Checking for due reminders...");
        try {
            // Get current time
            const now = new Date();
            // Find reminders that are due (within the next 5 minutes to account for processing time)
            const dueReminders = await connect_1.default.recycleReminder.findMany({
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
                await queues_1.reminderQueue.add('send-reminder', { reminderId: reminder.id }, {
                    delay: 0, // Send immediately
                    attempts: 3, // Retry up to 3 times
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                });
                console.log(`Added reminder job for user ${reminder.user.id}`);
            }
        }
        catch (error) {
            console.error("Error checking due reminders:", error);
        }
    }
}
exports.ReminderCron = ReminderCron;
