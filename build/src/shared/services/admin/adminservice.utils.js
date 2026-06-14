"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToObjT = exports.AdminApiError = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const adminservice_endpoints_1 = require("./adminservice.endpoints");
/** Thrown when the Admin API returns an error (4xx/5xx or non-JSON). Callers can use statusCode to decide retry (e.g. don't retry on 4xx). */
class AdminApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AdminApiError";
        Object.setPrototypeOf(this, AdminApiError.prototype);
    }
}
exports.AdminApiError = AdminApiError;
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
        const data = await (0, node_fetch_1.default)(`${adminservice_endpoints_1.baseUrl}${url}`, {
            method: "POST",
            headers,
            body: JSON.stringify(jsonData),
            timeout: 10000,
        });
        const respStr = await data.text();
        if (!data.ok) {
            const preview = respStr.trim().slice(0, 100);
            throw new AdminApiError(`Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`, data.status);
        }
        const trimmed = respStr.trim();
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            throw new AdminApiError(`Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${adminservice_endpoints_1.baseUrl}${url}`, data.status);
        }
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
        if (!data.ok) {
            const preview = respStr.trim().slice(0, 100);
            throw new AdminApiError(`Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`, data.status);
        }
        const trimmed = respStr.trim();
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            throw new AdminApiError(`Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${adminservice_endpoints_1.baseUrl}${url}`, data.status);
        }
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
        if (!data.ok) {
            const preview = respStr.trim().slice(0, 100);
            throw new AdminApiError(`Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`, data.status);
        }
        const trimmed = respStr.trim();
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            throw new AdminApiError(`Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${adminservice_endpoints_1.baseUrl}${url}`, data.status);
        }
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
