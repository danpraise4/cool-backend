"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoints = exports.baseUrl = void 0;
const flutterwave_utils_1 = require("./flutterwave.utils");
const baseUrl = "https://api.flutterwave.com/v3";
exports.baseUrl = baseUrl;
const endpoints = Object.freeze({
    CHARGE: (params) => `/charges/?${(0, flutterwave_utils_1.convertToObjT)(params)}`,
    BANKS: (country) => `/banks/${country}`,
    BANK_ACCOUNT_DETAILS: `/accounts/resolve`,
    TRANSFER_TO_BANK: `/transfers`,
});
exports.endpoints = endpoints;
