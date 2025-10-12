import { FacilityDays } from "@prisma/client";

export interface ICreateFacility {
  images?: string[];
  description: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;

  days: FacilityDays[];
  recyclingFee: number;

  materialsId: string[];
}
