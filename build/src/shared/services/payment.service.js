"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
//  Flutterwave
const app_config_1 = __importDefault(require("../config/app.config"));
const flutterwave_1 = __importDefault(require("./flutterwave/flutterwave"));
class PaymentService {
    flutterwave;
    constructor() {
        this.flutterwave = new flutterwave_1.default({
            publicKey: app_config_1.default.FLUTTERWAVE.PUBLIC_KEY,
            secretKey: app_config_1.default.FLUTTERWAVE.SECRET_KEY,
        });
    }
    async createPayment(config) {
        const response = await this.flutterwave.chargeCard(config);
        return response;
    }
}
exports.PaymentService = PaymentService;
