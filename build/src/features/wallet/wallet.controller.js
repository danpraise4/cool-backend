"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
// Go back after topup
// Show List first not map
// Romove Added cards screen
// Check Continue on recycle
// Call, Chat, on Recycle Flow
// Top Nav Bar
class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    paymentHook = async (req, res, next) => {
        try {
            // Wallet
            const wallet = await this.walletService.paymentHook(req.body);
            res.status(http_status_1.default.OK).json({
                message: "Hook received successfully",
                data: wallet,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    getWallet = async (req, res, next) => {
        try {
            // Wallet
            const wallet = await this.walletService.getWallet(req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Wallet fetched successfully",
                data: wallet,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    getWalletTransactions = async (req, res, next) => {
        try {
            // const { page, limit } = req.query;
            const transactions = await this.walletService.getTransactions(req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Transactions fetched successfully",
                data: transactions,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Top up wallet
    topUpWalletCard = async (req, res, next) => {
        try {
            const transaction = await this.walletService.createCardCharge({
                user: req.user,
                card: req.body,
            });
            res.status(http_status_1.default.OK).json({
                ...transaction,
            });
        }
        catch (error) {
            console.log("error", error);
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    getBankAccountDetails = async (req, res, next) => {
        try {
            const bankAccount = await this.walletService.getBankAccountDetails({
                account_number: req.body.account_number,
                account_bank: req.body.account_bank,
            });
            res.status(http_status_1.default.OK).json({
                message: "Bank account details fetched successfully",
                status: "success",
                data: bankAccount,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    resolveUK = async (req, res, next) => {
        try {
            const uk = await this.walletService.resolveUK(req.body);
            res.status(http_status_1.default.OK).json({
                message: "UK resolved successfully",
                status: "success",
                data: uk,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
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
            res.status(http_status_1.default.OK).json({
                message: "Transfer to bank user successful",
                status: "success",
                data: transaction,
            });
        }
        catch (error) {
            console.log("error", error);
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    transferToBank = async (req, res, next) => {
        try {
            const { amount, account_number, account_bank } = req.body;
            const transaction = await this.walletService.transferToBank({
                user: req.user,
                amount,
                account_number,
                account_bank,
            });
            res.status(http_status_1.default.OK).json({
                ...transaction,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    getBanksList = async (req, res, next) => {
        try {
            const user = req.user;
            const banks = await this.walletService.getBanksList(user.cityOfResidence);
            res.status(http_status_1.default.OK).json({
                message: "Banks fetched successfully",
                data: banks,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    creditUserWallet = async (req, res, next) => {
        try {
            const data = await this.walletService.creditUserWallet(req.body);
            res.status(http_status_1.default.OK).json({
                message: "Wallet credited successfully",
                status: "success",
                data: data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    topupBank = async (req, res, next) => {
        try {
            const data = await this.walletService.createBankCharge({
                user: req.user,
                amount: req.body.amount,
            });
            res.status(http_status_1.default.OK).json({
                message: "Bank charge created successfully",
                status: "success",
                data: data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
}
exports.default = WalletController;
