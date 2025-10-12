import { IMaterial } from "./materials.interface";

export interface IFacility {
  id: string;
  name: string;
  profilePhoto: string;
  rating: number;
  workingDays: string[];
  materialUnitPrice: IMaterial[];
  distanceInMiles: number;
}

