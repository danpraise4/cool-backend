import httpStatus from "http-status";
import AppException from "../../infastructure/https/exception/app.exception";
import { NextFunction, Response } from "express";
import { WalletService } from "./wallet.services";
import { RequestType } from "../../shared/helper/helper";
import { User } from "@prisma/client";

// Go back after topup
// Show List first not map
// Romove Added cards screen
// Check Continue on recycle
// Call, Chat, on Recycle Flow
// Top Nav Bar

export default class WalletController {
  constructor(readonly walletService: WalletService) { }

  public paymentHook = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Wallet
      const wallet = await this.walletService.paymentHook(req.body);

      res.status(httpStatus.OK).json({
        message: "Hook received successfully",
        data: wallet,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getWallet = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Wallet
      const wallet = await this.walletService.getWallet(req.user.id);

      res.status(httpStatus.OK).json({
        message: "Wallet fetched successfully",
        data: wallet,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getWalletTransactions = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // const { page, limit } = req.query;
      const transactions = await this.walletService.getTransactions(
        req.user.id
      );

      res.status(httpStatus.OK).json({
        message: "Transactions fetched successfully",
        data: transactions,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Top up wallet
  public topUpWalletCard = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transaction = await this.walletService.createCardCharge({
        user: req.user,
        card: req.body,
      });
      res.status(httpStatus.OK).json({
        ...transaction,
      });
    } catch (error: any) {
      console.log("error", error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getBankAccountDetails = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bankAccount = await this.walletService.getBankAccountDetails({
        account_number: req.body.account_number,
        account_bank: req.body.account_bank,
      });
      res.status(httpStatus.OK).json({
        message: "Bank account details fetched successfully",
        status: "success",
        data: bankAccount,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public transferToBankUKUser = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
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
      res.status(httpStatus.OK).json({
        message: "Transfer to bank user successful",
        status: "success",
        data: transaction,
      });
    } catch (error: any) {
      console.log("error", error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public transferToBank = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { amount, account_number, account_bank } = req.body;

      const transaction = await this.walletService.transferToBank({
        user: req.user,
        amount,
        account_number,
        account_bank,
      });
      res.status(httpStatus.OK).json({
        ...transaction,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getBanksList = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user: User = req.user;
      const banks = await this.walletService.getBanksList(user.cityOfResidence);
      res.status(httpStatus.OK).json({
        message: "Banks fetched successfully",
        data: banks,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };



  public creditUserWallet = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.walletService.creditUserWallet(req.body);
      res.status(httpStatus.OK).json({
        message: "Wallet credited successfully",
        status: "success",
        data: data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public topupBank = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.walletService.createBankCharge({
        user: req.user,
        amount: req.body.amount,
      });
      res.status(httpStatus.OK).json({
        message: "Bank charge created successfully",
        status: "success",
        data: data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
