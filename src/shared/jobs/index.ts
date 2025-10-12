import { materialQueue, facilityQueue } from './queues';
import './workers/materials.worker';
import './workers/facilities.worker';

(async () => {
  await materialQueue.add('sync-materials', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 6 hours
  await facilityQueue.add('sync-facilities', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes

  console.log('Sync jobs scheduled 🚀');
})();