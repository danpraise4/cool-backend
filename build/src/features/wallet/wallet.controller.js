"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../shared/helper/response");
class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    paymentHook = async (req, res, next) => {
        try {
            const webhookHeader = req.headers["verif-hash"];
            const result = await this.walletService.paymentHook(req.body, webhookHeader);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Hook received successfully",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getWallet = async (req, res, next) => {
        try {
            const wallet = await this.walletService.getWallet(req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Wallet fetched successfully",
                data: wallet,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getWalletTransactions = async (req, res, next) => {
        try {
            const transactions = await this.walletService.getTransactions(req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Transactions fetched successfully",
                data: transactions,
            });
        }
        catch (error) {
            next(error);
        }
    };
    topUpWalletCard = async (req, res, next) => {
        try {
            const transaction = await this.walletService.createCardCharge({
                user: req.user,
                card: req.body,
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Card charge initiated",
                data: transaction,
            });
        }
        catch (error) {
            next(error);
        }
    };
    createCardChargeURL = async (req, res, next) => {
        try {
            const url = await this.walletService.createCardChargeURL({
                user: req.user,
                amount: req.body.amount,
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Payment link created",
                data: url,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getBankAccountDetails = async (req, res, next) => {
        try {
            const bankAccount = await this.walletService.getBankAccountDetails(req.user.id, {
                account_number: req.body.account_number,
                account_bank: req.body.account_bank,
            });
            return res.status(http_status_1.default.OK).json({
                success: true,
                status: "success",
                message: "Account resolved",
                data: bankAccount,
            });
        }
        catch (error) {
            return next(error);
        }
    };
    resolveUK = async (req, res, next) => {
        try {
            const uk = await this.walletService.resolveUK(req.body);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Account resolved", data: uk });
        }
        catch (error) {
            next(error);
        }
    };
    transferToBankUKUser = async (req, res, next) => {
        try {
            const { amount, account_number, bank_name, account_name, swift_code } = req.body;
            const transaction = await this.walletService.transferToBankUKUser({
                user: req.user,
                amount,
                account_number,
                bank_name,
                account_name,
                swift_code,
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Transfer initiated successfully",
                data: transaction,
            });
        }
        catch (error) {
            next(error);
        }
    };
    transferToBank = async (req, res, next) => {
        try {
            const { amount, account_number, account_bank } = req.body;
            const idempotencyKey = req.headers["x-idempotency-key"];
            const result = await this.walletService.transferToBank({
                user: req.user,
                amount,
                account_number,
                account_bank,
                idempotencyKey,
            });
            return res.status(http_status_1.default.OK).json({
                success: true,
                status: "success",
                message: result.duplicate ? "Transfer already initiated" : "Transfer initiated",
                data: {
                    reference: result.reference,
                    transaction: result.transaction,
                },
            });
        }
        catch (error) {
            return next(error);
        }
    };
    getBanksList = async (req, res, next) => {
        try {
            const banks = await this.walletService.getBanksList(req.user);
            return res.status(http_status_1.default.OK).json({
                success: true,
                status: "success",
                message: "Banks fetched successfully",
                data: banks,
            });
        }
        catch (error) {
            return next(error);
        }
    };
    creditUserWallet = async (req, res, next) => {
        try {
            const data = await this.walletService.creditUserWallet(req.body);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Wallet credited successfully",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    };
    topupBank = async (req, res, next) => {
        try {
            const data = await this.walletService.createBankCharge({
                user: req.user,
                amount: req.body.amount,
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Bank charge created successfully",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.default = WalletController;
