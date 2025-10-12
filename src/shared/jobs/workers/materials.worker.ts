import { Job, Worker } from "bullmq";
import { redis } from "../utils/catch";
import AdminService from "../../services/admin/adminservice";
import client from "../../../infastructure/database/postgreSQL/connect";

const adminService = new AdminService();

export const materialsWorker = new Worker(
  "materials",
  async (job: Job) => {
    job.updateData({ status: "processing" });
    console.log("Processing materials");

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
  },
  {
    connection: redis,
  }
);
