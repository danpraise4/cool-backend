"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialsWorker = void 0;
const bullmq_1 = require("bullmq");
const catch_1 = require("../utils/catch");
const adminservice_1 = __importDefault(require("../../services/admin/adminservice"));
const adminservice_utils_1 = require("../../services/admin/adminservice.utils");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const logger_1 = __importDefault(require("../../services/logger"));
const adminService = new adminservice_1.default();
exports.materialsWorker = new bullmq_1.Worker("materials", async (job) => {
    job.updateData({ status: "processing" });
    try {
        const materials = await adminService.getMaterial();
        for (const material of materials.payload) {
            await connect_1.default.material.upsert({
                where: { id: material.id.toString() },
                update: {
                    category: material.category,
                    icon: material.icon,
                },
                create: {
                    id: material.id.toString(),
                    category: material.category,
                    icon: material.icon,
                },
            });
        }
        job.updateData({ status: "completed" });
    }
    catch (err) {
        if (err instanceof adminservice_utils_1.AdminApiError && err.statusCode >= 400 && err.statusCode < 500) {
            logger_1.default.warn({ statusCode: err.statusCode, err }, "materials sync: Admin API client error, not retrying");
            throw new bullmq_1.UnrecoverableError(err.message);
        }
        throw err;
    }
}, { connection: catch_1.redis });
