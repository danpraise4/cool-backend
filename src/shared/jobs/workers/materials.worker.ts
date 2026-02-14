import { Job, UnrecoverableError, Worker } from "bullmq";
import { redis } from "../utils/catch";
import AdminService from "../../services/admin/adminservice";
import { AdminApiError } from "../../services/admin/adminservice.utils";
import client from "../../../infastructure/database/postgreSQL/connect";

const adminService = new AdminService();

export const materialsWorker = new Worker(
  "materials",
  async (job: Job) => {
    job.updateData({ status: "processing" });
    console.log("Processing materials");

    try {
      const materials = await adminService.getMaterial();

      for (const material of materials.payload) {
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
        console.warn(`[materials] Admin API ${err.statusCode} (e.g. site disabled): ${err.message}`);
        throw new UnrecoverableError(err.message);
      }
      throw err;
    }
  },
  {
    connection: redis,
  }
);
