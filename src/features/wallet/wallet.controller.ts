import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import { WalletService } from "./wallet.services";
import { RequestType } from "../../shared/helper/helper";
import { sendSuccess } from "../../shared/helper/response";

export default class WalletController {
  constructor(readonly walletService: WalletService) {}

  public paymentHook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const webhookHeader = req.headers["verif-hash"] as string | undefined;
      const result = await this.walletService.paymentHook(req.body, webhookHeader);
      sendSuccess(res, httpStatus.OK, {
        message: "Hook received successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getWallet = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const wallet = await this.walletService.getWallet(req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "Wallet fetched successfully",
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  };

  public getWalletTransactions = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transactions = await this.walletService.getTransactions(req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "Transactions fetched successfully",
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  };

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
      sendSuccess(res, httpStatus.OK, {
        message: "Card charge initiated",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  public createCardChargeURL = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const url = await this.walletService.createCardChargeURL({
        user: req.user,
        amount: req.body.amount,
      });
      sendSuccess(res, httpStatus.OK, {
        message: "Payment link created",
        data: url,
      });
    } catch (error) {
      next(error);
    }
  };

  public getBankAccountDetails = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const bankAccount = await this.walletService.getBankAccountDetails(req.user.id, {
        account_number: req.body.account_number,
        account_bank: req.body.account_bank,
      });
      return res.status(httpStatus.OK).json({
        success: true,
        status: "success",
        message: "Account resolved",
        data: bankAccount,
      });
    } catch (error) {
      return next(error);
    }
  };

  public resolveUK = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const uk = await this.walletService.resolveUK(req.body);
      sendSuccess(res, httpStatus.OK, { message: "Account resolved", data: uk });
    } catch (error) {
      next(error);
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
      sendSuccess(res, httpStatus.OK, {
        message: "Transfer initiated successfully",
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  public transferToBank = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { amount, account_number, account_bank } = req.body;
      const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;
      const result = await this.walletService.transferToBank({
        user: req.user,
        amount,
        account_number,
        account_bank,
        idempotencyKey,
      });
      return res.status(httpStatus.OK).json({
        success: true,
        status: "success",
        message: result.duplicate ? "Transfer already initiated" : "Transfer initiated",
        data: {
          reference: result.reference,
          transaction: result.transaction,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  public getBanksList = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const banks = await this.walletService.getBanksList(req.user);
      return res.status(httpStatus.OK).json({
        success: true,
        status: "success",
        message: "Banks fetched successfully",
        data: banks,
      });
    } catch (error) {
      return next(error);
    }
  };

  public creditUserWallet = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.walletService.creditUserWallet(req.body);
      sendSuccess(res, httpStatus.OK, {
        message: "Wallet credited successfully",
        data,
      });
    } catch (error) {
      next(error);
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
      sendSuccess(res, httpStatus.OK, {
        message: "Bank charge created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
