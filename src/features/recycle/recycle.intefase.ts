import { RecycleScheduleType } from "@prisma/client";
import { RECYCLE_REQUEST_STATUS } from "../../shared/config/app.constants";

export interface ICommunityCreateSchedule {
  type: RecycleScheduleType;
  facilityId: string;
  materialId: string;
  dates: string[];
  quantity?: number;
}

export interface IUpdateRecycleSchedule {
  transactionStatus: RECYCLE_REQUEST_STATUS;
  scheduledCollectionDate: string;
  quantity: number;
}

export type Media = {
  url: string;
  name: string;
};
