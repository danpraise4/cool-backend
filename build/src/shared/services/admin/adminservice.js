"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_service_1 = __importDefault(require("../redis.service"));
const adminservice_endpoints_1 = require("./adminservice.endpoints");
const adminservice_utils_1 = __importDefault(require("./adminservice.utils"));
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
class AdminService extends adminservice_utils_1.default {
    constructor() {
        super();
    }
    // Get facilities
    async getFacilities(config) {
        console.log(config);
        console.log("Config");
        try {
            const response = await this.getRequest(this.buildHeader(), `${adminservice_endpoints_1.endpoints.GET_FACILITIES(config)}`);
            if (response.isOk) {
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    // Get facility by id
    async getFacilityById(id) {
        try {
            const cachedFacility = await redis_service_1.default.instance.get(`facility:${id}`);
            if (cachedFacility) {
                return {
                    isOk: true,
                    message: "Facility fetched successfully",
                    statusCode: 200,
                    payload: JSON.parse(cachedFacility),
                };
            }
            if (!cachedFacility) {
                const facility = await connect_1.default.facility.findUnique({
                    where: {
                        id: id,
                    },
                });
                if (facility) {
                    await redis_service_1.default.instance.set(`facility:${id}`, JSON.stringify(facility));
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
                    };
                }
            }
            console.log("Got here 5");
            /// ----
            const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_FACILITY_BY_ID(id));
            console.log("Response ------- ");
            console.log(response);
            if (response.isOk) {
                await redis_service_1.default.instance.set(`facility:${id}`, JSON.stringify(response.payload));
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    ///
    // Get facility by id
    async getFacilityByItsID(id) {
        try {
            console.log("Got here 5");
            /// ----
            const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_FACILITY_BY_ID(id));
            console.log("Response ------- ");
            console.log(response);
            if (response.isOk) {
                await redis_service_1.default.instance.set(`facility:${id}`, JSON.stringify(response.payload));
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    // Get material categories
    async getMaterial() {
        try {
            const response = await this.getRequest(this.buildHeader(), `${adminservice_endpoints_1.endpoints.GET_MATERIAL_CATEGORIES()}`);
            if (response.isOk) {
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    async getMaterialById(id) {
        try {
            const cachedMaterial = await redis_service_1.default.instance.get(`material:${id}`);
            if (cachedMaterial) {
                return {
                    isOk: true,
                    message: "Material fetched successfully",
                    statusCode: 200,
                    payload: JSON.parse(cachedMaterial),
                };
            }
            if (!cachedMaterial) {
                const material = await connect_1.default.material.findUnique({
                    where: {
                        id: id,
                    },
                });
                if (material) {
                    await redis_service_1.default.instance.set(`material:${id}`, JSON.stringify(material));
                    return {
                        isOk: true,
                        message: "Material fetched successfully",
                        statusCode: 200,
                        payload: {
                            id: Number(material.id),
                            category: material.category,
                            icon: material.icon,
                        },
                    };
                }
            }
            const response = await this.getRequest(this.buildHeader(), `${adminservice_endpoints_1.endpoints.GET_MATERIAL_CATEGORIES()}`);
            if (response.isOk) {
                const material = response.payload.find((item) => item.id === Number(id));
                if (!material) {
                    throw new Error("Material not found");
                }
                return {
                    ...response,
                    payload: material,
                };
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    async createRecycleRequest(request) {
        try {
            const response = await this.postRequest(this.buildHeader(), request, `${adminservice_endpoints_1.endpoints.CREATE_RECYCLE_REQUEST}`);
            console.log("Response ------- ");
            console.log(response);
            if (response.isOk) {
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    async updateRecycleRequest(id, request) {
        try {
            const response = await this.patchRequest(this.buildHeader(), request, `${adminservice_endpoints_1.endpoints.PATCH_RECYCLE_REQUEST(id)}`);
            console.log("Response ------- ");
            console.log(response);
            if (response.isOk) {
                console.log(response);
                return response;
            }
            else {
                console.log(response);
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    // Confirm recycle transaction
    async confirmRecycleTransaction(id, request) {
        try {
            const response = await this.postRequest(this.buildHeader(), request, `${adminservice_endpoints_1.endpoints.CONFIRM_RECYCLE_TRANSACTION(id)}`);
            if (response.isOk) {
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    async getRecycleRequestById(config) {
        try {
            const response = await this.getRequest(this.buildHeader(), `/recyclers/my/${config.recyclerId}/transaction/${config.transactionId}`);
            console.log("Response ------- "); //
            console.log(response);
            if (response.isOk) {
                return response;
            }
            else {
                throw new Error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
}
exports.default = AdminService;
