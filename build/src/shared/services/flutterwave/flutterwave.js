"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flutterwave_endpoints_1 = require("./flutterwave.endpoints");
const flutterwave_utils_1 = __importDefault(require("./flutterwave.utils"));
class Flutterwave extends flutterwave_utils_1.default {
    constructor(build) {
        super(build);
    }
    async chargeCard(data) {
        try {
            const response = await this.postRequest(this.buildHeader(), data, `${flutterwave_endpoints_1.endpoints.CHARGE({ type: "card" })}`);
            console.log(response);
            if (response.status === "success") {
                return response;
            }
            else {
                throw new Error("Could not validate bvn");
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
    // Get Bank Account Details
    async getBankAccountDetails(data) {
        try {
            const response = await this.postRequest(this.buildHeader(), data, `${flutterwave_endpoints_1.endpoints.BANK_ACCOUNT_DETAILS}`);
            return response;
        }
        catch (err) {
            console.log(err);
            throw new Error(err);
        }
    }
    // Transfer to Bank
    async transferToBank(data) {
        try {
            const response = await this.postRequest(this.buildHeader(), data, `${flutterwave_endpoints_1.endpoints.TRANSFER_TO_BANK}`);
            return response;
        }
        catch (err) {
            console.log(err);
            throw new Error(err);
        }
    }
    // Transfer to Bank
    async transferToBankUKUser(data) {
        try {
            const response = await this.postRequest(this.buildHeader(), data, `${flutterwave_endpoints_1.endpoints.TRANSFER_TO_BANK}`);
            return response;
        }
        catch (err) {
            console.log(err);
            throw new Error(err);
        }
    }
    // Get Banks List
    async getBanks(city) {
        try {
            const response = await this.getRequest(this.buildHeader(), `${flutterwave_endpoints_1.endpoints.BANKS(city)}`);
            return response;
        }
        catch (err) {
            console.log(err);
            throw new Error(err);
        }
    }
    // Charge Bank
    async chargeBank(data) {
        try {
            const response = await this.postRequest(this.buildHeader(), data, `${flutterwave_endpoints_1.endpoints.CHARGE({ type: "bank_transfer" })}`);
            if (response.status === "success") {
                return response;
            }
            else {
                throw new Error("Could not validate bvn");
            }
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                throw new Error(err.message);
            }
            throw new Error(err);
        }
    }
}
exports.default = Flutterwave;
