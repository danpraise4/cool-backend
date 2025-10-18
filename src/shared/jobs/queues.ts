import { Queue } from "bullmq";
import { redis } from "./utils/catch";


export const materialQueue = new Queue("materials", { connection: redis });
export const facilityQueue = new Queue("facilities", { connection: redis });
export const reminderQueue = new Queue("reminders", { connection: redis });