import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import {
  IAdminServiceFacility,
  IAdminServiceFacilityById,
} from "../../shared/services/admin/adminservice.interface";
import RedisService from "../../shared/services/redis.service";

export class FacilitiesService {
  AdminClient: AdminService;
  redis: RedisService;

  constructor() {
    const adminClient = new AdminServiceClient(new AdminService());
    this.AdminClient = adminClient.build();
  }

  public async getFacilities(config: {
    materialId: string | undefined;
    Latitude: string | undefined;
    Longitude: string | undefined;
  }): Promise<IAdminServiceFacility> {

    console.log(config);
    console.log("Config");

    const facilities = await this.AdminClient.getFacilities({
      MaterialId: config.materialId,
      Latitude: config.Latitude,
      Longitude: config.Longitude,
    });

    return facilities;
  }

 
  public async getFacilityById(id: string): Promise<IAdminServiceFacilityById | null> {

    const facility = await this.AdminClient.getFacilityById(id);

    if (!facility) {
      throw new Error("Facility not found");
    }

    return facility;
  }
}
