"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordValidator = exports.emailValidator = exports.completeRegistrationValidator = exports.verifyOtpValidator = exports.creditUserWalletValidator = exports.registerValidator = exports.loginValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.loginValidator = {
    body: joi_1.default.object().keys({
        password: joi_1.default.string()
            .min(8)
            .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"))
            .required()
            .messages({
            "string.pattern.base": "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
            "string.required": "Oops!, you have to specify a password",
        }),
        email: joi_1.default.string().email().lowercase().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
    }),
};
exports.registerValidator = {
    body: joi_1.default.object().keys({
        phone: joi_1.default.string()
            .required()
            .min(10)
            .pattern(/^[0-9]+$/)
            .messages({
            "any.required": "Oops!, you have to specify a phone number",
            "string.min": "Oops!, phone number must be at least 10 digits",
            "string.pattern.base": "Oops!, phone number must contain only numbers",
        }),
    }),
};
exports.creditUserWalletValidator = {
    body: joi_1.default.object().keys({
        user: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a user id",
        }),
        idempotent: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an idempotent",
        }),
        amount: joi_1.default.number().positive().required().messages({
            "any.required": "Oops!, you have to specify an amount",
            "number.positive": "Oops!, amount must be greater than 0",
        }),
    }),
};
exports.verifyOtpValidator = {
    body: joi_1.default.object().keys({
        phone: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a phone number",
        }),
        otp: joi_1.default.string().length(6).required().messages({
            "any.required": "Oops!, you have to specify an OTP",
            "string.length": "Oops!, OTP must be exactly 4 digits",
        }),
    }),
};
exports.completeRegistrationValidator = {
    body: joi_1.default.object().keys({
        token: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a token",
        }),
        email: joi_1.default.string().email().lowercase().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
        firstName: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a first name",
        }),
        lastName: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a last name",
        }),
        cityOfResidence: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a city of residence",
        }),
        confirmPassword: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a confirm password",
        }),
        password: joi_1.default.string()
            .min(8)
            .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"))
            .messages({
            "any.required": "Oops!, you have to specify a password",
            "string.min": "Password must be at least 8 characters long",
            "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        }),
    }),
};
exports.emailValidator = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().lowercase().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
    }),
};
exports.updatePasswordValidator = {
    body: joi_1.default.object().keys({
        oldPassword: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an old password",
        }),
        password: joi_1.default.string()
            .min(8)
            .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"))
            .required()
            .messages({
            "any.required": "Oops!, you have to specify a password",
            "string.min": "Password must be at least 8 characters long",
            "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        }),
        passwordConfirmation: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a password confirmation",
        }),
    }),
};
