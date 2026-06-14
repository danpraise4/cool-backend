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
    async createCardCharge(data) {
        const response = await this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.CREATE_CARD_CHARGE);
        return response;
    }
    async chargeCard(data) {
        const response = await this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.CHARGE({ type: "card" }));
        if (response.status !== "success") {
            throw new Error(response.message || "Card charge failed");
        }
        return response;
    }
    async getBankAccountDetails(data) {
        return this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.BANK_ACCOUNT_DETAILS);
    }
    async resolveUK(data) {
        return this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.RESOLVE_UK, "https://api.flutterwave.com/");
    }
    async transferToBank(data) {
        return this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.TRANSFER_TO_BANK);
    }
    async transferToBankUKUser(data) {
        return this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.TRANSFER_TO_BANK);
    }
    async getBanks(city) {
        return this.getRequest(this.buildHeader(), flutterwave_endpoints_1.endpoints.BANKS(city));
    }
    async chargeBank(data) {
        const response = await this.postRequest(this.buildHeader(), data, flutterwave_endpoints_1.endpoints.CHARGE({ type: "bank_transfer" }));
        if (response.status !== "success") {
            throw new Error(response.message || "Bank charge failed");
        }
        return response;
    }
}
exports.default = Flutterwave;
