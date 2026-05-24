"use strict";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getFacilities(config) {
        const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_FACILITIES(config));
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
    async getFacilityById(id) {
        const cached = await redis_service_1.default.instance.get(`facility:${id}`);
        if (cached) {
            return {
                isOk: true,
                message: "Facility fetched successfully",
                statusCode: 200,
                payload: JSON.parse(cached),
            };
        }
        const local = await connect_1.default.facility.findUnique({ where: { id } });
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
            await redis_service_1.default.instance.set(`facility:${id}`, JSON.stringify(payload), 3600);
            return { isOk: true, message: "Facility fetched successfully", statusCode: 200, payload };
        }
        const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_FACILITY_BY_ID(id));
        if (!response.isOk)
            throw new Error(response.message);
        await redis_service_1.default.instance.set(`facility:${id}`, JSON.stringify(response.payload), 3600);
        return response;
    }
    async getMaterial() {
        const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_MATERIAL_CATEGORIES());
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
    async getMaterialById(id) {
        const cached = await redis_service_1.default.instance.get(`material:${id}`);
        if (cached) {
            return {
                isOk: true,
                message: "Material fetched successfully",
                statusCode: 200,
                payload: JSON.parse(cached),
            };
        }
        const local = await connect_1.default.material.findUnique({ where: { id } });
        if (local) {
            const payload = { id: Number(local.id), category: local.category, icon: local.icon };
            await redis_service_1.default.instance.set(`material:${id}`, JSON.stringify(payload), 3600);
            return { isOk: true, message: "Material fetched successfully", statusCode: 200, payload };
        }
        const response = await this.getRequest(this.buildHeader(), adminservice_endpoints_1.endpoints.GET_MATERIAL_CATEGORIES());
        if (!response.isOk)
            throw new Error(response.message);
        const material = response.payload.find((item) => item.id === Number(id));
        if (!material)
            throw new Error("Material not found");
        return { ...response, payload: material };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createRecycleRequest(request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await this.postRequest(this.buildHeader(), request, adminservice_endpoints_1.endpoints.CREATE_RECYCLE_REQUEST);
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateRecycleRequest(id, request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await this.patchRequest(this.buildHeader(), request, adminservice_endpoints_1.endpoints.PATCH_RECYCLE_REQUEST(id));
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async confirmRecycleTransaction(id, request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await this.postRequest(this.buildHeader(), request, adminservice_endpoints_1.endpoints.CONFIRM_RECYCLE_TRANSACTION(id));
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getRecycleRequestById(config) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await this.getRequest(this.buildHeader(), `/recyclers/my/${config.recyclerId}/transaction/${config.transactionId}`);
        if (!response.isOk)
            throw new Error(response.message);
        return response;
    }
}
exports.default = AdminService;
