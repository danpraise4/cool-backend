"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentValidator = exports.getRecycleSchedulesValidator = exports.adminChatValidator = exports.getRecycleSchedulesSingleValidator = exports.updateRecycleScheduleValidator = exports.createRecycleScheduleValidator = void 0;
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
exports.createRecycleScheduleValidator = {
    body: joi_1.default.object().keys({
        type: joi_1.default.string().valid(client_1.RecycleScheduleType.PICKUP, client_1.RecycleScheduleType.DROP_OFF).required().messages({
            "any.required": "Oops!, you have to specify content",
            "any.only": "Content must be either 'pickup' or 'dropoff'"
        }),
        facilityId: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a facility",
        }),
        materialId: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a material",
        }),
        dates: joi_1.default.array().items(joi_1.default.string().pattern(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/).required().messages({
            "string.pattern.base": "Date must be in DD-MM-YYYY format",
        })).required().messages({
            "any.required": "Oops!, you have to specify dates",
            "array.base": "Dates must be an array",
        }),
        quantity: joi_1.default.number().optional().messages({
            "any.required": "Oops!, you have to specify a quantity",
        }),
    }),
};
exports.updateRecycleScheduleValidator = {
    body: joi_1.default.object().keys({
        transactionStatus: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a transaction status",
        }),
        scheduledCollectionDate: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a scheduled collection date",
        }),
        quantity: joi_1.default.number().optional().messages({
            "any.required": "Oops!, you have to specify a quantity",
        }),
    }),
};
exports.getRecycleSchedulesSingleValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an id",
        }),
    }),
};
exports.adminChatValidator = {
    body: joi_1.default.object().keys({
        withID: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a user",
        }),
        userID: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a user",
        }),
        type: joi_1.default.string().valid(client_1.RecycleChatType.WITH_FACILITY, client_1.RecycleChatType.WITH_SELLER).required().messages({
            "any.required": "Oops!, you have to specify a type",
            "any.only": "Type must be either 'with_facility' or 'with_seller'"
        }),
    }),
};
exports.getRecycleSchedulesValidator = {
    query: joi_1.default.object().keys({
        date: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a date",
        }),
    }),
};
exports.createCommentValidator = {
    body: joi_1.default.object().keys({
        content: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a content",
        }),
    }),
};
