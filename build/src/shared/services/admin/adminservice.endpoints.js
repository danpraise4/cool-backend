"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoints = exports.baseUrl = void 0;
const adminservice_utils_1 = require("./adminservice.utils");
const baseUrl = "https://recycool-api-stg.azurewebsites.net";
exports.baseUrl = baseUrl;
const endpoints = Object.freeze({
    // CHARGE: (params: ObjT): string => `/charges/?${convertToObjT(params)}`,
    // BANKS: (country: string): string => `/banks/${country}`,
    // BANK_ACCOUNT_DETAILS: `/accounts/resolve`,
    GET_FACILITIES: (params) => `/facility/facilities?${(0, adminservice_utils_1.convertToObjT)(params)}`,
    GET_FACILITY_BY_ID: (id) => `/facility/${id}`,
    GET_MATERIAL_CATEGORIES: () => `/settings/material-categories`,
    CREATE_RECYCLE_REQUEST: `/recyclers/recycle`,
    PATCH_RECYCLE_REQUEST: (id) => `/recyclers/transaction/${id}`,
    CONFIRM_RECYCLE_TRANSACTION: (id) => `/payment/procccecss-withdrawal/${id}`,
    // GET_RECYCLE_REQUEST_BY_ID: (config: {recyclerId: string, transactionId: string}): string => '',
});
exports.endpoints = endpoints;
