"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageValidator = exports.updateUserValidator = void 0;
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
