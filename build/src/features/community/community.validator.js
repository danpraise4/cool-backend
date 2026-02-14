"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentValidator = exports.createPostValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createPostValidator = {
    body: joi_1.default.object().keys({
        content: joi_1.default.string().optional().allow(null),
        images: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    }),
};
exports.createCommentValidator = {
    body: joi_1.default.object().keys({
        content: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a content",
        }),
    }),
};
