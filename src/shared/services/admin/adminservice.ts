import RedisService from "../redis.service";
import { endpoints } from "./adminservice.endpoints";
import {
  AdminServiceBaseResponse,
  IAdminServiceFacility,
  IAdminServiceFacilityById,
  IAdminServiceMaterialById,
  IAdminServiceMaterials,
  ICreaterRequest,
} from "./adminservice.interface";
import AdminServiceUtil from "./adminservice.utils";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";

export default class AdminService extends AdminServiceUtil {
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getFacilities(config: { [key: string]: any }): Promise<IAdminServiceFacility> {
    const response = await this.getRequest<IAdminServiceFacility>(
      this.buildHeader(),
      endpoints.GET_FACILITIES(config)
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }

  async getFacilityById(id: string): Promise<IAdminServiceFacilityById> {
    const cached = await RedisService.instance.get(`facility:${id}`);
    if (cached) {
      return {
        isOk: true,
        message: "Facility fetched successfully",
        statusCode: 200,
        payload: JSON.parse(cached),
      } as IAdminServiceFacilityById;
    }

    const local = await prismaClient.facility.findUnique({ where: { id } });
    if (local) {
      const payload = {
        id: local.id,
        name: local.name,
        address: local.address,
        profilePhoto: local.profilePhoto,
        rating: local.rating,
        workingDays: local.workingDays,
        materialUnitPrice: local.materialUnitPrice,
        distanceInMiles: local.distanceInMiles,
      };
      await RedisService.instance.set(`facility:${id}`, JSON.stringify(payload), 3600);
      return { isOk: true, message: "Facility fetched successfully", statusCode: 200, payload } as IAdminServiceFacilityById;
    }

    const response = await this.getRequest<IAdminServiceFacilityById>(
      this.buildHeader(),
      endpoints.GET_FACILITY_BY_ID(id)
    );

    if (!response.isOk) throw new Error(response.message);
    await RedisService.instance.set(`facility:${id}`, JSON.stringify(response.payload), 3600);
    return response;
  }

  async getMaterial(): Promise<IAdminServiceMaterials> {
    const response = await this.getRequest<IAdminServiceMaterials>(
      this.buildHeader(),
      endpoints.GET_MATERIAL_CATEGORIES()
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }

  async getMaterialById(id: string): Promise<IAdminServiceMaterialById> {
    const cached = await RedisService.instance.get(`material:${id}`);
    if (cached) {
      return {
        isOk: true,
        message: "Material fetched successfully",
        statusCode: 200,
        payload: JSON.parse(cached),
      } as IAdminServiceMaterialById;
    }

    const local = await prismaClient.material.findUnique({ where: { id } });
    if (local) {
      const payload = { id: Number(local.id), category: local.category, icon: local.icon };
      await RedisService.instance.set(`material:${id}`, JSON.stringify(payload), 3600);
      return { isOk: true, message: "Material fetched successfully", statusCode: 200, payload } as IAdminServiceMaterialById;
    }

    const response = await this.getRequest<IAdminServiceMaterials>(
      this.buildHeader(),
      endpoints.GET_MATERIAL_CATEGORIES()
    );

    if (!response.isOk) throw new Error(response.message);

    const material = response.payload.find((item) => item.id === Number(id));
    if (!material) throw new Error("Material not found");
    return { ...response, payload: material };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createRecycleRequest(request: ICreaterRequest): Promise<AdminServiceBaseResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.postRequest<ICreaterRequest, AdminServiceBaseResponse<any>>(
      this.buildHeader(),
      request,
      endpoints.CREATE_RECYCLE_REQUEST
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateRecycleRequest(id: string, request: any): Promise<AdminServiceBaseResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.patchRequest<any, AdminServiceBaseResponse<any>>(
      this.buildHeader(),
      request,
      endpoints.PATCH_RECYCLE_REQUEST(id)
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async confirmRecycleTransaction(request: any): Promise<AdminServiceBaseResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.postRequest<any, AdminServiceBaseResponse<any>>(
      this.buildHeader(),
      request,
      endpoints.CONFIRM_RECYCLE_TRANSACTION
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async confirmTopUpTransaction(request: any): Promise<AdminServiceBaseResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.postRequest<any, AdminServiceBaseResponse<any>>(
      this.buildHeader(),
      request,
      endpoints.CONFIRM_DEPOSIT_TRANSACTION
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getRecycleRequestById(config: { recyclerId: string; transactionId: string }): Promise<AdminServiceBaseResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.getRequest<AdminServiceBaseResponse<any>>(
      this.buildHeader(),
      `/recyclers/my/${config.recyclerId}/transaction/${config.transactionId}`
    );

    if (!response.isOk) throw new Error(response.message);
    return response;
  }
}
