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
const logger_1 = __importDefault(require("../../services/logger"));
exports.remindersWorker = new bullmq_1.Worker("reminders", async (job) => {
    job.updateData({ status: "processing" });
    try {
        if (job.name === "check-reminders") {
            await reminder_cron_1.ReminderCron.checkDueReminders();
            job.updateData({ status: "completed" });
            return;
        }
        if (job.name === "send-reminder") {
            const { reminderId } = job.data;
            const reminder = await connect_1.default.recycleReminder.findFirst({
                where: { id: reminderId },
                include: { user: { include: { settings: true } }, schedule: true },
            });
            if (!reminder) {
                logger_1.default.warn({ reminderId }, "reminder not found");
                return;
            }
            if (!reminder.user.settings?.isPushNotificationsEnabled)
                return;
            if (!reminder.user.deviceToken)
                return;
            const scheduleDate = reminder.schedule.dates[0];
            const isDayBefore = reminder.remindAt &&
                scheduleDate &&
                new Date(reminder.remindAt).getDate() === new Date(scheduleDate).getDate() - 1;
            const title = isDayBefore ? "Recycle Reminder - Tomorrow" : "Recycle Reminder - Today";
            const body = isDayBefore
                ? `Don't forget! You have a recycling appointment tomorrow at ${reminder.schedule.facility}`
                : `Your recycling appointment is today at ${reminder.schedule.facility}`;
            await notification_service_1.default.getInstance().emitNotificationToClient(reminder.userId, { title, body }, {
                type: "recycle_reminder",
                scheduleId: reminder.scheduleId,
                reminderId: reminder.id,
            });
            await connect_1.default.notification.create({
                data: {
                    userId: reminder.userId,
                    title,
                    body,
                    link: `/recycle/schedule/${reminder.scheduleId}`,
                },
            });
            await connect_1.default.recycleReminder.update({
                where: { id: reminderId },
                data: { status: app_constants_1.STATUS.COMPLETED },
            });
            job.updateData({ status: "completed" });
        }
    }
    catch (error) {
        logger_1.default.error({ err: error, jobName: job.name }, "reminder job failed");
        job.updateData({
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}, { connection: catch_1.redis });
