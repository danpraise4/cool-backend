"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facilitiesWorker = void 0;
const bullmq_1 = require("bullmq");
const catch_1 = require("../utils/catch");
const adminservice_1 = __importDefault(require("../../services/admin/adminservice"));
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const adminService = new adminservice_1.default();
exports.facilitiesWorker = new bullmq_1.Worker("facilities", async (job) => {
    job.updateData({ status: "processing" });
    console.log("Processing facilities");
    const facilities = await adminService.getFacilities({
        page: 1,
        limit: 1000,
    });
    for (const facility of facilities.payload.items) {
        await connect_1.default.facility.upsert({
            where: { id: facility.id },
            update: {
                materialUnitPrice: facility.materialUnitPrice,
                workingDays: facility.workingDays,
                rating: facility.rating,
            },
            create: {
                id: facility.id,
                name: facility.name,
                profilePhoto: facility.profilePhoto,
                distanceInMiles: facility.distanceInMiles,
                materialUnitPrice: facility.materialUnitPrice,
                workingDays: facility.workingDays,
                rating: facility.rating,
            },
        });
    }
    job.updateData({ status: "completed" });
}, {
    connection: catch_1.redis,
});
