"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParamValidator = exports.getNotificationsQueryValidator = exports.uploadImageValidator = exports.updateUserValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateUserValidator = {
    body: joi_1.default.object().keys({
        firstName: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a first name",
        }),
        lastName: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a last name",
        }),
        phone: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a phone number",
        }),
        address: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify an address",
        }),
    }),
};
exports.uploadImageValidator = {
    body: joi_1.default.object().keys({
        image: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an image",
        }),
    }),
};
exports.getNotificationsQueryValidator = {
    query: joi_1.default.object().keys({
        page: joi_1.default.number().integer().min(1).optional(),
        limit: joi_1.default.number().integer().min(1).max(50).optional(),
        unreadOnly: joi_1.default.string().valid("true", "false").optional(),
    }),
};
exports.notificationIdParamValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().uuid().required().messages({
            "any.required": "Notification id is required",
            "string.guid": "Notification id must be a valid UUID",
        }),
    }),
};
