"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNewsValidator = exports.getNewsValidator = exports.createNewsValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createNewsValidator = {
    body: joi_1.default.object().keys({
        body: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a content",
        }),
        title: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        status: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a status",
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
    }),
};
exports.getNewsValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
exports.updateNewsValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
    body: joi_1.default.object().keys({
        content: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a content",
        }),
    }),
    images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
        "any.required": "Oops!, you have to specify images",
    }),
    title: joi_1.default.string().required().messages({
        "any.required": "Oops!, you have to specify a title",
    }),
};
