"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const wallet_validator_1 = require("./wallet.validator");
const router = (0, express_1.Router)();
// Get Wallet
router.route("/").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.getWallet);
router.route("/hook").post(controller_module_1.walletController.paymentHook);
// Get Wallet Transactions
router
    .route("/transactions")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.getWalletTransactions);
// Top up Wallet
router.route("/topup-card").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.topUpWalletCard);
// Get Banks List
router.route("/banks").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.getBanksList);
// Get Bank Account Details
router.route("/bank-account").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.getBankAccountDetails);
// Transfer to Bank
router.route("/transfer-to-bank").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.transferToBank);
// Transfer to Bank UK User
router.route("/transfer-to-bank-uk-user").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.transferToBankUKUser);
// Top up Bank
router.route("/topup-bank").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.walletController.topupBank);
// Credit User Wallet
router
    .route("/credit-user")
    .post((0, app_validate_1.default)(wallet_validator_1.creditUserWalletValidator), controller_module_1.walletController.creditUserWallet);
exports.default = router;
