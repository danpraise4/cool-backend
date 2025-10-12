"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productValidator = exports.respondToCharityProductRequestValidator = exports.deleteProductValidator = exports.updateProductValidator = exports.createProductValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createProductValidator = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        description: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        price: joi_1.default.number().optional().messages({
            "any.required": "Oops!, you have to specify a price",
        }),
        media: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
        type: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a product type",
        }),
        material: joi_1.default.any().required().messages({
            "any.required": "Oops!, you have to specify a material",
        }),
    }),
};
exports.updateProductValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
    body: joi_1.default.object().keys({
        title: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        description: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        price: joi_1.default.number().optional().messages({
            "any.required": "Oops!, you have to specify a price",
        }),
        newImages: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
        removeImages: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
        type: joi_1.default.string().optional().messages({
            "any.required": "Oops!, you have to specify a type",
        }),
        material: joi_1.default.any().optional().messages({
            "any.required": "Oops!, you have to specify a material",
        }),
    }),
};
exports.deleteProductValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
exports.respondToCharityProductRequestValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
    body: joi_1.default.object().keys({
        status: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a status",
        }),
    }),
};
exports.productValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
