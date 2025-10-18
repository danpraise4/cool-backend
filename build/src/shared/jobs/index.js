"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queues_1 = require("./queues");
require("./workers/materials.worker");
require("./workers/facilities.worker");
require("./workers/reminders.worker");
(async () => {
    await queues_1.materialQueue.add('sync-materials', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes
    await queues_1.facilityQueue.add('sync-facilities', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes
    // Check for due reminders every 5 minutes
    await queues_1.reminderQueue.add('check-reminders', {}, {
        repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
        jobId: 'check-reminders-cron' // Unique ID to prevent duplicates
    });
    console.log('Sync jobs scheduled 🚀');
    console.log('Reminder jobs scheduled 🔔');
})();
