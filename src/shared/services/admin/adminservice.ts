/* eslint-disable @typescript-eslint/no-explicit-any */

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

  // Get facilities
  async getFacilities(config: {
    [key: string]: any;
  }): Promise<IAdminServiceFacility> {
    console.log(config);
    console.log("Config");
    try {
      const response = await this.getRequest<IAdminServiceFacility>(
        this.buildHeader(),
        `${endpoints.GET_FACILITIES(config)}`
      );

      if (response.isOk) {
        return response as IAdminServiceFacility;
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  // Get facility by id
  async getFacilityById(id: string): Promise<IAdminServiceFacilityById> {
    try {
      const cachedFacility = await RedisService.instance.get(`facility:${id}`);
      if (cachedFacility) {
        return {
          isOk: true,
          message: "Facility fetched successfully",
          statusCode: 200,
          payload: JSON.parse(cachedFacility),
        } as IAdminServiceFacilityById;
      }

      if (!cachedFacility) {
        const facility = await prismaClient.facility.findUnique({
          where: {
            id: id,
          },
        });

        if (facility) {
          await RedisService.instance.set(
            `facility:${id}`,
            JSON.stringify(facility)
          );
          return {
            isOk: true,
            message: "Facility fetched successfully",
            statusCode: 200,
            payload: {
              id: facility.id,
              name: facility.name,
              address: facility.address,
              profilePhoto: facility.profilePhoto,
              rating: facility.rating,
              workingDays: facility.workingDays,
              materialUnitPrice: facility.materialUnitPrice,
              distanceInMiles: facility.distanceInMiles,
            },
          } as IAdminServiceFacilityById;
        }
      }

      console.log("Got here 5");
      /// ----
      const response = await this.getRequest<IAdminServiceFacilityById>(
        this.buildHeader(),
        endpoints.GET_FACILITY_BY_ID(id)
      );

      console.log("Response ------- ");
      console.log(response);

      if (response.isOk) {
        await RedisService.instance.set(
          `facility:${id}`,
          JSON.stringify(response.payload)
        );
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  ///
    // Get facility by id
    async getFacilityByItsID(id: string): Promise<IAdminServiceFacilityById> {
      try {
 
        console.log("Got here 5");
        /// ----
        const response = await this.getRequest<IAdminServiceFacilityById>(
          this.buildHeader(),
          endpoints.GET_FACILITY_BY_ID(id)
        );
  
        console.log("Response ------- ");
        console.log(response);
  
        if (response.isOk) {
          await RedisService.instance.set(
            `facility:${id}`,
            JSON.stringify(response.payload)
          );
          return response;
        } else {
          throw new Error(response.message);
        }
      } catch (err: unknown) {
        console.log(err);
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error(err as string);
      }
    }

  // Get material categories
  async getMaterial(): Promise<IAdminServiceMaterials> {
    try {
      const response = await this.getRequest<IAdminServiceMaterials>(
        this.buildHeader(),
        `${endpoints.GET_MATERIAL_CATEGORIES()}`
      );

      if (response.isOk) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  async getMaterialById(id: string): Promise<IAdminServiceMaterialById> {
    try {
      const cachedMaterial = await RedisService.instance.get(`material:${id}`);
      if (cachedMaterial) {
        return {
          isOk: true,
          message: "Material fetched successfully",
          statusCode: 200,
          payload: JSON.parse(cachedMaterial),
        } as IAdminServiceMaterialById;
      }

      if (!cachedMaterial) {
        const material = await prismaClient.material.findUnique({
          where: {
            id: id,
          },
        });

        if (material) {
          await RedisService.instance.set(
            `material:${id}`,
            JSON.stringify(material)
          );
          return {
            isOk: true,
            message: "Material fetched successfully",
            statusCode: 200,
            payload: {
              id: Number(material.id),
              category: material.category,
              icon: material.icon,
            },
          } as IAdminServiceMaterialById;
        }
      }

      const response = await this.getRequest<IAdminServiceMaterials>(
        this.buildHeader(),
        `${endpoints.GET_MATERIAL_CATEGORIES()}`
      );

      if (response.isOk) {
        const material = response.payload.find(
          (item) => item.id === Number(id)
        );
        if (!material) {
          throw new Error("Material not found");
        }
        return {
          ...response,
          payload: material,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  async createRecycleRequest(
    request: ICreaterRequest
  ): Promise<AdminServiceBaseResponse<any>> {
    try {
      const response = await this.postRequest<
        ICreaterRequest,
        AdminServiceBaseResponse<any>
      >(this.buildHeader(), request, `${endpoints.CREATE_RECYCLE_REQUEST}`);

      console.log("Response ------- ");

      console.log(response);

      if (response.isOk) {
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  async updateRecycleRequest(
    id: string,
    request: any
  ): Promise<AdminServiceBaseResponse<any>> {
    try {
      const response = await this.patchRequest<
        any,
        AdminServiceBaseResponse<any>
      >(this.buildHeader(), request, `${endpoints.PATCH_RECYCLE_REQUEST(id)}`);

      console.log("Response ------- ");

      console.log(response);

      if (response.isOk) {
        console.log(response);
        return response;
      } else {
        console.log(response);
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  async getRecycleRequestById(config: {recyclerId: string, transactionId: string}): Promise<AdminServiceBaseResponse<any>> {
    try {
    

      const response = await this.getRequest<any>(
        this.buildHeader(),
        `/recyclers/my/${config.recyclerId}/transaction/${config.transactionId}`
      );

      console.log("Response ------- "); //
      console.log(response);

      if (response.isOk) {
        return response;  
      } else {
        throw new Error(response.message);
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }
}
