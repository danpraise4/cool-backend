"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remindersWorker = void 0;
const bullmq_1 = require("bullmq");
const catch_1 = require("../utils/catch");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const notification_service_1 = __importDefault(require("../../services/notification/notification.service"));
const reminder_cron_1 = require("../cron/reminder.cron");
const app_constants_1 = require("../../config/app.constants");
exports.remindersWorker = new bullmq_1.Worker("reminders", async (job) => {
    job.updateData({ status: "processing" });
    console.log("Processing reminder job:", job.name);
    try {
        // Handle different job types
        if (job.name === 'check-reminders') {
            await reminder_cron_1.ReminderCron.checkDueReminders();
            job.updateData({ status: "completed" });
            return;
        }
        if (job.name === 'send-reminder') {
            const { reminderId } = job.data;
            // Get the reminder with user and schedule details
            const reminder = await connect_1.default.recycleReminder.findFirst({
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
            const pushService = notification_service_1.default.getInstance();
            await pushService.emitNotficationToClient(reminder.userId, { title, body }, {
                type: "recycle_reminder",
                scheduleId: reminder.scheduleId,
                reminderId: reminder.id
            });
            // Create in-app notification
            await connect_1.default.notification.create({
                data: {
                    userId: reminder.userId,
                    title,
                    body,
                    link: `/recycle/schedule/${reminder.scheduleId}`
                }
            });
            // Mark reminder as sent (optional - you might want to delete it instead)
            await connect_1.default.recycleReminder.update({
                where: { id: reminderId },
                data: {
                    status: app_constants_1.STATUS.COMPLETED
                }
            });
            console.log(`Reminder sent to user ${reminder.userId}`);
            job.updateData({ status: "completed" });
        }
    }
    catch (error) {
        console.error(`Error processing reminder job:`, error);
        job.updateData({ status: "failed", error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}, {
    connection: catch_1.redis,
});
