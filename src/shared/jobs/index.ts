import { materialQueue, facilityQueue, reminderQueue } from './queues';
import './workers/materials.worker';
import './workers/facilities.worker';
import './workers/reminders.worker';

(async () => {
  await materialQueue.add('sync-materials', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes
  await facilityQueue.add('sync-facilities', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes
  
  // Check for due reminders every 5 minutes
  await reminderQueue.add('check-reminders', {}, { 
    repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
    jobId: 'check-reminders-cron' // Unique ID to prevent duplicates
  });

  console.log('Sync jobs scheduled 🚀');
  console.log('Reminder jobs scheduled 🔔');
})();