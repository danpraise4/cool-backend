"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const dev_controller_1 = require("./dev.controller");
const dev_validator_1 = require("./dev.validator");
const router = (0, express_1.Router)();
router
    .route("/test-email")
    .post((0, app_validate_1.default)(dev_validator_1.sendTestEmailValidator), dev_controller_1.devController.sendTestEmail);
exports.default = router;
