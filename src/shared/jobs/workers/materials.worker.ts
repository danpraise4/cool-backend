import { Job, UnrecoverableError, Worker } from "bullmq";
import { redis } from "../utils/catch";
import AdminService from "../../services/admin/adminservice";
import { AdminApiError } from "../../services/admin/adminservice.utils";
import client from "../../../infastructure/database/postgreSQL/connect";
import logger from "../../services/logger";

const adminService = new AdminService();

export const materialsWorker = new Worker(
  "materials",
  async (job: Job) => {
    job.updateData({ status: "processing" });

    try {
      const materials = await adminService.getMaterial();

      for (const material of (materials as any).payload) {
        await client.material.upsert({
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
    } catch (err) {
      if (err instanceof AdminApiError && err.statusCode >= 400 && err.statusCode < 500) {
        logger.warn({ statusCode: err.statusCode, err }, "materials sync: Admin API client error, not retrying");
        throw new UnrecoverableError(err.message);
      }
      throw err;
    }
  },
  { connection: redis }
);
