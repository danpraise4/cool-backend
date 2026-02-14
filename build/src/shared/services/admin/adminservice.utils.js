"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToObjT = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const adminservice_endpoints_1 = require("./adminservice.endpoints");
const convertToObjT = (params) => {
    return Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join("&");
};
exports.convertToObjT = convertToObjT;
class AdminServiceUtil {
    constructor() { }
    buildHeader() {
        return {
            "Content-type": "application/json",
            Accept: "application/json",
        };
    }
    async postRequest(headers, jsonData, url) {
        console.log(`${adminservice_endpoints_1.baseUrl}${url}`);
        const data = await (0, node_fetch_1.default)(`${adminservice_endpoints_1.baseUrl}${url}`, {
            method: "POST",
            headers,
            body: JSON.stringify(jsonData),
            timeout: 10000,
        });
        const respStr = await data.text();
        let resp;
        try {
            resp = JSON.parse(respStr);
            if (resp.status === "error") {
                throw new Error(resp.message || "Request failed");
            }
            return resp;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Invalid response format");
        }
    }
    async patchRequest(headers, jsonData, url) {
        const data = await (0, node_fetch_1.default)(`${adminservice_endpoints_1.baseUrl}${url}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(jsonData),
            timeout: 10000,
        });
        const respStr = await data.text();
        let resp;
        try {
            resp = JSON.parse(respStr);
            if (resp.status === "error") {
                throw new Error(resp.message || "Request failed");
            }
            return resp;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Invalid response format");
        }
    }
    async getRequest(headers, url) {
        const data = await (0, node_fetch_1.default)(`${adminservice_endpoints_1.baseUrl}${url}`, {
            method: "GET",
            headers,
            timeout: 30000,
        });
        const respStr = await data.text();
        let resp;
        try {
            resp = JSON.parse(respStr);
            if (resp.status === "error") {
                throw new Error(resp.message || "Request failed");
            }
            return resp;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Invalid response format");
        }
    }
}
exports.default = AdminServiceUtil;
