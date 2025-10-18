import { Router } from "express";
import { walletController } from "../../infastructure/https/controller/controller.module";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import validate from "../../infastructure/https/validation/app.validate";
import { creditUserWalletValidator } from "./wallet.validator";

const router = Router();

// Get Wallet
router.route("/").get(isUserAuthenticated, walletController.getWallet);
router.route("/hook").post(walletController.paymentHook);

// Get Wallet Transactions
router
  .route("/transactions")
  .get(isUserAuthenticated, walletController.getWalletTransactions);

// Top up Wallet
router.route("/topup-card").post(isUserAuthenticated, walletController.topUpWalletCard);

// Get Banks List
router.route("/banks").get(isUserAuthenticated, walletController.getBanksList);

// Get Bank Account Details
router.route("/bank-account").post(isUserAuthenticated, walletController.getBankAccountDetails);

// Transfer to Bank
router.route("/transfer-to-bank").post(isUserAuthenticated, walletController.transferToBank);

// Transfer to Bank UK User
router.route("/transfer-to-bank-uk-user").post(isUserAuthenticated, walletController.transferToBankUKUser);


// Resolve UK 
router.route("/resolve-uk").post(isUserAuthenticated, walletController.resolveUK);

// Top up Bank
router.route("/topup-bank").post(isUserAuthenticated, walletController.topupBank);

// Credit User Wallet
router
  .route("/credit-user")
  .post( validate(creditUserWalletValidator), walletController.creditUserWallet);




export default router;
