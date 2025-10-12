"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queues_1 = require("./queues");
require("./workers/materials.worker");
require("./workers/facilities.worker");
(async () => {
    await queues_1.materialQueue.add('sync-materials', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 6 hours
    await queues_1.facilityQueue.add('sync-facilities', {}, { repeat: { every: 10 * 60 * 1000 } }); // Every 10 minutes
    console.log('Sync jobs scheduled 🚀');
})();
