"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsService = void 0;
const adminservice_client_1 = __importDefault(require("../../shared/services/admin/adminservice.client"));
const adminservice_1 = __importDefault(require("../../shared/services/admin/adminservice"));
const redis_service_1 = __importDefault(require("../../shared/services/redis.service"));
class MaterialsService {
    AdminClient;
    constructor() {
        const adminClient = new adminservice_client_1.default(new adminservice_1.default());
        this.AdminClient = adminClient.build();
    }
    async getMaterials() {
        const cachedMaterials = await redis_service_1.default.instance.get("MATERIALS_CACHE");
        console.log("cachedMaterials", cachedMaterials);
        if (cachedMaterials) {
            return JSON.parse(cachedMaterials);
        }
        const materials = await this.AdminClient.getMaterial();
        if (!materials) {
            throw new Error("Materials not found");
        }
        await redis_service_1.default.instance.set("MATERIALS_CACHE", JSON.stringify(materials.payload));
        return materials.payload;
    }
    async getMaterialsById(id) {
        const materials = await this.AdminClient.getMaterialById(id);
        if (!materials) {
            throw new Error("Materials not found");
        }
        return materials;
    }
}
exports.MaterialsService = MaterialsService;
