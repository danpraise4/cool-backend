"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFacilityValidator = exports.getFacilityValidator = exports.createFacilityValidator = void 0;
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
exports.createFacilityValidator = {
    body: joi_1.default.object().keys({
        description: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        name: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
        address: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an address",
        }),
        phone: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a phone number",
        }),
        email: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email",
        }),
        latitude: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a latitude",
        }),
        longitude: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a longitude",
        }),
        materialsId: joi_1.default.array().items(joi_1.default.string()).required().messages({
            "any.required": "Oops!, you have to specify materials",
        }),
        days: joi_1.default.array().items(joi_1.default.string().valid(...Object.values(client_1.FacilityDays))).required().messages({
            "any.required": "Oops!, you have to specify days",
            "string.valid": "Days must be valid FacilityDays enum values"
        }),
        recyclingFee: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a recycling fee",
        }),
    }),
};
exports.getFacilityValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
exports.updateFacilityValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
    body: joi_1.default.object().keys({
        description: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a description",
        }),
        name: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a title",
        }),
        images: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "any.required": "Oops!, you have to specify images",
        }),
        address: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an address",
        }),
        phone: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a phone number",
        }),
        email: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email",
        }),
        latitude: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a latitude",
        }),
        longitude: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a longitude",
        }),
        materialsId: joi_1.default.array().items(joi_1.default.string()).required().messages({
            "any.required": "Oops!, you have to specify materials",
        }),
    }),
};
