"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilitiesService = void 0;
const adminservice_client_1 = __importDefault(require("../../shared/services/admin/adminservice.client"));
const adminservice_1 = __importDefault(require("../../shared/services/admin/adminservice"));
class FacilitiesService {
    AdminClient;
    redis;
    constructor() {
        const adminClient = new adminservice_client_1.default(new adminservice_1.default());
        this.AdminClient = adminClient.build();
    }
    async getFacilities(config) {
        console.log(config);
        console.log("Config");
        const facilities = await this.AdminClient.getFacilities({
            MaterialId: config.materialId,
            Latitude: config.Latitude,
            Longitude: config.Longitude,
        });
        return facilities;
    }
    async getFacilityById(id) {
        const facility = await this.AdminClient.getFacilityById(id);
        if (!facility) {
            throw new Error("Facility not found");
        }
        return facility;
    }
}
exports.FacilitiesService = FacilitiesService;
