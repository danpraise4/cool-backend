import { Job, UnrecoverableError, Worker } from "bullmq";
import { redis } from "../utils/catch";
import AdminService from "../../services/admin/adminservice";
import { AdminApiError } from "../../services/admin/adminservice.utils";
import client from "../../../infastructure/database/postgreSQL/connect";

const adminService = new AdminService();

export const facilitiesWorker = new Worker(
  "facilities",
  async (job: Job) => {
    job.updateData({ status: "processing" });
    console.log("Processing facilities");

    try {
      const facilities = await adminService.getFacilities({
        page: 1,
        limit: 1000,
      });

      for (const facility of facilities.payload.items) {
        await client.facility.upsert({
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
    } catch (err) {
      if (err instanceof AdminApiError && err.statusCode >= 400 && err.statusCode < 500) {
        console.warn(`[facilities] Admin API ${err.statusCode} (e.g. site disabled): ${err.message}`);
        throw new UnrecoverableError(err.message);
      }
      throw err;
    }
  },
  {
    connection: redis,
  }
);
