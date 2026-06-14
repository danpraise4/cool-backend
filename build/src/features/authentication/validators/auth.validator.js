"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCititiesfromLatLongValidator = exports.getLocationValidator = exports.googleAuthValidator = exports.updateDeviceValidator = exports.updatePasswordValidator = exports.resetPasswordUpdateValidator = exports.verifyResetPasswordValidator = exports.resetPasswordValidator = exports.updateSettingsValidator = exports.emailValidator = exports.registerCompleteValidator = exports.resendOtpValidator = exports.verifyOtpValidator = exports.checkUserValidator = exports.loginValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.loginValidator = {
    body: joi_1.default.object().keys({
        password: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a password",
        }),
        email: joi_1.default.string().required().email().messages({
            "any.required": "Oops!, you have to specify an email address or phone number",
            "string.email": "Oops!, you have to specify a valid email address",
        }),
    }),
};
exports.checkUserValidator = {
    body: joi_1.default.object().keys({
        identifier: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email address or phone number",
        }),
    }),
};
exports.verifyOtpValidator = {
    body: joi_1.default.object().keys({
        identifier: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email address or phone number",
        }),
        otp: joi_1.default.string().length(6).required().messages({
            "any.required": "Oops!, you have to specify an OTP",
            "string.length": "Oops!, OTP must be exactly 6 digits",
        }),
    }),
};
exports.resendOtpValidator = {
    body: joi_1.default.object().keys({
        identifier: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email address or phone number",
        }),
    }),
};
exports.registerCompleteValidator = {
    body: joi_1.default.object().keys({
        token: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a token",
        }),
        identifier: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
        phone: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a phone number",
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
        address: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an address",
        }),
        latitude: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a latitude",
        }),
        longitude: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a longitude",
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
exports.updateSettingsValidator = {
    body: joi_1.default.object().keys({
        isEmailNotificationsEnabled: joi_1.default.boolean().optional().messages({
            "any.required": "Oops!, you have to specify if email notifications are enabled",
        }),
        isSmsNotificationsEnabled: joi_1.default.boolean().optional().messages({
            "any.required": "Oops!, you have to specify if sms notifications are enabled",
        }),
        isPushNotificationsEnabled: joi_1.default.boolean().optional().messages({
            "any.required": "Oops!, you have to specify if push notifications are enabled",
        }),
    }),
};
exports.resetPasswordValidator = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
    }),
};
exports.verifyResetPasswordValidator = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().required().messages({
            "any.required": "Oops!, you have to specify an email address",
        }),
        otp: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an OTP",
        }),
    }),
};
exports.resetPasswordUpdateValidator = {
    body: joi_1.default.object().keys({
        password: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a password",
        }),
        passwordConfirmation: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a password confirmation",
        }),
        token: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a token",
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
exports.updateDeviceValidator = {
    body: joi_1.default.object().keys({
        deviceToken: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a device token",
        }),
    }),
};
exports.googleAuthValidator = {
    body: joi_1.default.object().keys({
        token: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify a token",
        }),
    }),
};
exports.getLocationValidator = {
    body: joi_1.default.object().keys({
        ip: joi_1.default.string().required().messages({
            "any.required": "Oops!, you have to specify an IP address",
        }),
    }),
};
exports.getCititiesfromLatLongValidator = {
    query: joi_1.default.object().keys({
        lat: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a latitude",
        }),
        long: joi_1.default.number().required().messages({
            "any.required": "Oops!, you have to specify a longitude",
        }),
    }),
};
