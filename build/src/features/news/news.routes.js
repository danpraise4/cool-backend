"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const news_validator_1 = require("./news.validator");
const router = (0, express_1.Router)();
router.route("/").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.newsController.getAllNews);
router.route("/:id").get(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(news_validator_1.getNewsValidator), controller_module_1.newsController.getNews);
exports.default = router;
