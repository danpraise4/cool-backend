"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCron = void 0;
const queues_1 = require("../queues");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const logger_1 = __importDefault(require("../../services/logger"));
class ReminderCron {
    static async checkDueReminders() {
        const now = new Date();
        const dueReminders = await connect_1.default.recycleReminder.findMany({
            where: { remindAt: { lte: new Date(now.getTime() + 5 * 60 * 1000) } },
            include: { user: { include: { settings: true } } },
        });
        logger_1.default.info({ count: dueReminders.length }, "due reminders found");
        for (const reminder of dueReminders) {
            if (!reminder.user.settings?.isPushNotificationsEnabled)
                continue;
            await queues_1.reminderQueue.add("send-reminder", { reminderId: reminder.id }, {
                delay: 0,
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
            });
        }
    }
}
exports.ReminderCron = ReminderCron;
