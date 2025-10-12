"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilitiesController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../../shared/helper/pick"));
class FacilitiesController {
    facilitiesService;
    constructor(facilitiesService) {
        this.facilitiesService = facilitiesService;
    }
    getAllFacilities = async (req, res, next) => {
        try {
            const material = req.query.material;
            const params = (0, pick_1.default)(req.query, ["Latitude", "Longitude"]);
            const facilities = await this.facilitiesService.getFacilities({
                materialId: material,
                Latitude: params.Latitude,
                Longitude: params.Longitude,
            });
            res.status(http_status_1.default.OK).json({
                message: "Facilities fetched successfully",
                status: "success",
                data: facilities.payload.items,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getFacilityById = async (req, res, next) => {
        try {
            const facility = await this.facilitiesService.getFacilityById(req.params.id);
            res.status(http_status_1.default.OK).json({
                message: "Facility fetched successfully",
                status: "success",
                data: facility,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.FacilitiesController = FacilitiesController;
