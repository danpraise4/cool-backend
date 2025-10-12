"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaterialsValidator = exports.getMaterialsValidator = exports.createMaterialsValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createMaterialsValidator = {
    body: joi_1.default.object().keys({
        description: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        title: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
    }),
};
exports.getMaterialsValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
exports.updateMaterialsValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
    body: joi_1.default.object().keys({
        description: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        title: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
    }),
};
