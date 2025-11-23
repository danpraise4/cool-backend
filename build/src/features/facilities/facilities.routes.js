"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const facilities_validator_1 = require("./facilities.validator");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const router = (0, express_1.Router)();
router.route("/").get(controller_module_1.facilitiesController.getAllFacilities);
router
    .route("/:id")
    .get(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(facilities_validator_1.getFacilityValidator), controller_module_1.facilitiesController.getFacilityById);
exports.default = router;
