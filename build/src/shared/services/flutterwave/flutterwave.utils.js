"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToObjT = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const flutterwave_endpoints_1 = require("./flutterwave.endpoints");
const convertToObjT = (params) => Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
exports.convertToObjT = convertToObjT;
class FlutterwaveUtil {
    publicKey;
    secretKey;
    constructor(build) {
        this.publicKey = build.publicKey;
        this.secretKey = build.secretKey;
    }
    buildHeader() {
        return {
            "Content-type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${this.secretKey}`,
        };
    }
    async postRequest(headers, jsonData, url, baseUL) {
        const res = await (0, node_fetch_1.default)(`${baseUL || flutterwave_endpoints_1.baseUrl}${url}`, {
            method: "POST",
            headers,
            body: JSON.stringify(jsonData),
            timeout: 10000,
        });
        const respStr = await res.text();
        let resp;
        try {
            resp = JSON.parse(respStr);
        }
        catch {
            throw new Error("Invalid JSON response from Flutterwave");
        }
        if (resp.status === "error") {
            throw new Error(resp.message || "Flutterwave request failed");
        }
        return resp;
    }
    async getRequest(headers, url) {
        const res = await (0, node_fetch_1.default)(`${flutterwave_endpoints_1.baseUrl}${url}`, {
            method: "GET",
            headers,
            timeout: 10000,
        });
        const respStr = await res.text();
        let resp;
        try {
            resp = JSON.parse(respStr);
        }
        catch {
            throw new Error("Invalid JSON response from Flutterwave");
        }
        if (resp.status === "error") {
            throw new Error(resp.message || "Flutterwave request failed");
        }
        return resp;
    }
}
exports.default = FlutterwaveUtil;
