"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
class MaterialsController {
    materialsService;
    constructor(materialsService) {
        this.materialsService = materialsService;
    }
    getAllMaterials = async (_req, res, next) => {
        try {
            const materials = await this.materialsService.getMaterials();
            res.status(http_status_1.default.OK).json({
                message: "Materials fetched successfully",
                data: materials,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getMaterialsById = async (req, res, next) => {
        try {
            const material = await this.materialsService.getMaterialsById(req.params.id);
            res.status(http_status_1.default.OK).json({
                message: "Materials fetched successfully",
                data: material,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.MaterialsController = MaterialsController;
