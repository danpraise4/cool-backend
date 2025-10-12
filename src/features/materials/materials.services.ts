import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import {
  IAdminServiceMaterialById,
  IMaterialData,
} from "../../shared/services/admin/adminservice.interface";
import RedisService from "../../shared/services/redis.service";

export class MaterialsService {
  AdminClient: AdminService;

  constructor() {
    const adminClient = new AdminServiceClient(new AdminService());
    this.AdminClient = adminClient.build();
  }

  public async getMaterials(): Promise<IMaterialData[]> {
    const cachedMaterials = await RedisService.instance.get("MATERIALS_CACHE");
    console.log("cachedMaterials", cachedMaterials);

    if (cachedMaterials) {
      return JSON.parse(cachedMaterials);
    }

    const materials = await this.AdminClient.getMaterial();

    if (!materials) {
      throw new Error("Materials not found");
    }

    await RedisService.instance.set(
      "MATERIALS_CACHE",
      JSON.stringify(materials.payload)
    );

    return materials.payload;
  }

  public async getMaterialsById(
    id: string
  ): Promise<IAdminServiceMaterialById | null> {
    const materials = await this.AdminClient.getMaterialById(id);

    if (!materials) {
      throw new Error("Materials not found");
    }

    return materials;
  }
}
