import { Router } from "express";
import { walletController } from "../../infastructure/https/controller/controller.module";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import validate from "../../infastructure/https/validation/app.validate";
import { creditUserWalletValidator, resolveBankAccountValidator, transferToBankValidator } from "./wallet.validator";
import { bankAccountResolveLimiter } from "./wallet.middleware";

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

// Create Card Charge URL
router.route("/create-card-charge-url").post(isUserAuthenticated, walletController.createCardChargeURL);

// Get Banks List
router.route("/banks").get(isUserAuthenticated, walletController.getBanksList);

// Get Bank Account Details (Flutterwave resolve)
router
  .route("/bank-account")
  .post(
    isUserAuthenticated,
    bankAccountResolveLimiter,
    validate(resolveBankAccountValidator),
    walletController.getBankAccountDetails
  );

// Transfer to Bank (NGN)
router
  .route("/transfer-to-bank")
  .post(
    isUserAuthenticated,
    validate(transferToBankValidator),
    walletController.transferToBank
  );

// Transfer to Bank UK User
router.route("/transfer-to-bank-uk-user").post(isUserAuthenticated, walletController.transferToBankUKUser);


// Resolve UK 
router.route("/resolve-uk").post(isUserAuthenticated, walletController.resolveUK);

// Top up Bank
router.route("/topup-bank").post(isUserAuthenticated, walletController.topupBank);

// Credit User Wallet — requires authentication
router
  .route("/credit-user")
  .post(validate(creditUserWalletValidator), walletController.creditUserWallet);




export default router;
