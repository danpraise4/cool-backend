import { Currency, Status, TransactionType, User, Wallet } from "@prisma/client";
import crypto from "crypto";
import prisma from "../../infastructure/database/postgreSQL/connect";
import FlutterwaveClient from "../../shared/services/flutterwave/flutterwave.client";
import config from "../../shared/config/app.config";
import Flutterwave from "../../shared/services/flutterwave/flutterwave";
import TokenService from "../../shared/services/token.service";
import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import { ICard } from "./wallet.interface";
import { flutterwaveBankCountryCode, inferWalletCurrencyForNewUser } from "./wallet.region";
import logger from "../../shared/services/logger";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import {
  emailNotificationService,
  EmailNotificationType,
} from "../../shared/services/email/email-notification.service";

export class WalletService {
  private readonly flutterwaveClient: Flutterwave;
  private readonly tokenService: TokenService;
  private readonly adminClient: AdminService;

  constructor() {
    this.tokenService = new TokenService();
    this.flutterwaveClient = new FlutterwaveClient()
      .initialize(config.FLUTTERWAVE.PUBLIC_KEY, config.FLUTTERWAVE.SECRET_KEY)
      .build();
    this.adminClient = new AdminServiceClient(new AdminService()).build();
  }

  /**
   * Verify that the incoming webhook actually came from Flutterwave.
   * Set FLW_WEBHOOK_HASH in your env to the secret hash configured in the
   * Flutterwave dashboard. Requests without a matching header are rejected.
   */
  public verifyWebhookSignature(secretHash: string | undefined, header: string | undefined): boolean {
    if (!secretHash) {
      logger.warn("FLW_WEBHOOK_HASH not configured — skipping webhook signature check");
      return true;
    }
    return header === secretHash;
  }

  public async paymentHook(
    payload: Record<string, unknown>,
    webhookHeader?: string
  ) {
    const flwWebhookHash = process.env.FLW_WEBHOOK_HASH;

    if (!this.verifyWebhookSignature(flwWebhookHash, webhookHeader)) {
      throw new AppException("Invalid webhook signature", httpStatus.UNAUTHORIZED);
    }

    const { event, data } = payload as {
      event: string;
      data: Record<string, unknown>;
    };

    if (event !== "charge.completed") {
      return { message: "Hook received" };
    }

    const { tx_ref, flw_ref, amount } = data as {
      tx_ref: string;
      flw_ref: string;
      amount: number;
    };

    // Confirm recycle transaction in background — failure must not block wallet credit
    this.adminClient.confirmRecycleTransaction(flw_ref, data).catch((err: unknown) => {
      logger.error({ err }, "Failed to confirm recycle transaction");
    });

    const account = await prisma.wallet.findFirst({
      where: { userId: tx_ref },
    });

    if (!account) {
      logger.warn({ tx_ref }, "paymentHook: wallet not found for tx_ref");
      return { message: "Wallet not found" };
    }

    // Idempotency — skip duplicate events
    const existingTransaction = await prisma.transaction.findFirst({
      where: { reference: flw_ref },
    });

    if (existingTransaction) {
      return existingTransaction;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { id: account.id },
        data: { balance: { increment: amount } },
      });

      return tx.transaction.create({
        data: {
          walletId: account.id,
          amount,
          status: Status.COMPLETED,
          type: TransactionType.TOPUP,
          reference: flw_ref,
          description: "Wallet top-up via Flutterwave",
          balanceBefore: account.balance,
          balanceAfter: wallet.balance,
          fee: 0,
          userId: account.userId,
          metadata: { flw_ref },
        },
      });
    });

    emailNotificationService.notifyUser(account.userId, EmailNotificationType.WALLET_TOPUP, {
      amount,
      currency: account.currency,
      reference: flw_ref,
    });

    return transaction;
  }

  private async _setupAccount(userId: string): Promise<Wallet> {
    const existing = await prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    return prisma.wallet.create({
      data: {
        userId,
        currency: inferWalletCurrencyForNewUser(user),
      },
    });
  }

  public async createCardCharge({ user, card }: { user: User; card: ICard }) {
    const txRef = `${user.id}-${Date.now()}`;
    const payload = {
      preauthorize: false,
      usesecureauth: true,
      ...card,
      email: user.email,
      fullname: `${user.firstName} ${user.lastName}`,
      phone_number: user.phone,
      tx_ref: txRef,
      redirect_url: "https://recycool.com/wallet/topup-success",
    };

    const token = await this.tokenService.generateFlutterwaveToken({
      encryptionKey: config.FLUTTERWAVE.ENCRYPTION_KEY,
      payload,
    });

    return this.flutterwaveClient.chargeCard({ client: token });
  }

  public async createCardChargeURL({
    user,
    amount,
  }: {
    user: User;
    amount: number | string;
  }) {
    const wallet = await this.getWallet(user.id);
    const currencyIso: Record<Currency, string> = {
      [Currency.NGN]: "NGN",
      [Currency.GBP]: "GBP",
      [Currency.USD]: "USD",
      [Currency.EUR]: "EUR",
    };
    const currency = currencyIso[wallet.currency] || "EUR";
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (!numericAmount || numericAmount <= 0 || Number.isNaN(numericAmount)) {
      throw new AppException("Invalid top-up amount", httpStatus.BAD_REQUEST);
    }

    const txRef = `${user.id}-${Date.now()}`;
    const payload = {
      tx_ref: txRef,
      amount: numericAmount.toString(),
      currency,
      redirect_url: "https://recycool.com/wallet/topup-success",
      customer: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      customizations: { title: "Top-up Wallet" },
    };

    return this.flutterwaveClient.createCardCharge(payload);
  }

  public async getBankAccountDetails(body: {
    account_number: string;
    account_bank: string;
  }) {
    return this.flutterwaveClient.getBankAccountDetails(body);
  }

  public async resolveUK(body: { number: string; name: string; code: string }) {
    return this.flutterwaveClient.resolveUK(body);
  }

  public async transferToBankUKUser({
    user,
    amount,
    account_number,
    bank_name,
    account_name,
    swift_code,
  }: {
    user: User;
    amount: number;
    account_number: string;
    bank_name: string;
    account_name: string;
    swift_code: string;
  }) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

    if (!wallet) {
      throw new AppException("Wallet not found", httpStatus.NOT_FOUND);
    }

    if (wallet.currency !== Currency.GBP) {
      throw new AppException(
        "UK bank withdrawals are only available for GBP wallets",
        httpStatus.BAD_REQUEST
      );
    }

    const numericAmount = Number(amount);

    if (wallet.balance < numericAmount) {
      throw new AppException("Insufficient funds", httpStatus.BAD_REQUEST);
    }

    const normalizedSort = String(swift_code || "").replace(/-/g, "");
    const ref = `uk-withdraw-${user.id}-${Date.now()}`;

    // Call Flutterwave FIRST — debit only if provider accepts the transfer
    const response = await this.flutterwaveClient.transferToBankUKUser({
      amount: numericAmount,
      narration: "Recycool wallet withdrawal",
      currency: "GBP",
      beneficiary_name: account_name,
      meta: [
        {
          account_number,
          routing_number: normalizedSort,
          swift_code: normalizedSort,
          bank_name,
          beneficiary_name: account_name,
          beneficiary_country: "UK",
          postal_code: "80489",
          street_number: "31",
          street_name: user.address,
          city: "London",
        },
      ],
    });

    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance - numericAmount;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: numericAmount,
          status: Status.COMPLETED,
          type: TransactionType.WITHDRAWAL,
          reference: ref,
          description: "Withdrawal to UK bank account",
          balanceBefore,
          balanceAfter,
          fee: 0,
          userId: wallet.userId,
          metadata: { flutterwave: response as object },
        },
      });
    });

    emailNotificationService.notifyUser(wallet.userId, EmailNotificationType.WALLET_WITHDRAWAL, {
      amount: numericAmount,
      currency: wallet.currency,
      reference: ref,
    });

    return { transfer: response, transaction };
  }

  public async transferToBank({
    user,
    amount,
    account_number,
    account_bank,
  }: {
    user: User;
    amount: number;
    account_number: string;
    account_bank: string;
  }) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

    if (!wallet) {
      throw new AppException("Wallet not found", httpStatus.NOT_FOUND);
    }

    if (wallet.currency !== Currency.NGN) {
      throw new AppException(
        "Transfers to Nigerian banks are only available for NGN wallets",
        httpStatus.BAD_REQUEST
      );
    }

    const numericAmount = Number(amount);

    if (wallet.balance < numericAmount) {
      throw new AppException("Insufficient funds", httpStatus.BAD_REQUEST);
    }

    const ref = `ng-withdraw-${user.id}-${Date.now()}`;

    // Call Flutterwave FIRST — debit only if provider accepts the transfer
    const response = await this.flutterwaveClient.transferToBank({
      amount: numericAmount,
      account_number,
      account_bank,
      currency: "NGN",
      tx_ref: ref,
    });

    const balanceBefore = wallet.balance;
    const balanceAfter = wallet.balance - numericAmount;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: numericAmount,
          status: Status.COMPLETED,
          type: TransactionType.WITHDRAWAL,
          reference: ref,
          description: "Withdrawal to Nigerian bank account",
          balanceBefore,
          balanceAfter,
          fee: 0,
          userId: wallet.userId,
          metadata: { flutterwave: response as object },
        },
      });
    });

    emailNotificationService.notifyUser(wallet.userId, EmailNotificationType.WALLET_WITHDRAWAL, {
      amount: numericAmount,
      currency: wallet.currency,
      reference: ref,
    });

    return { transfer: response, transaction };
  }

  public async createBankCharge({
    user,
    amount,
  }: {
    user: User;
    amount: number | string;
  }) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });

    if (!wallet || wallet.currency !== Currency.NGN) {
      throw new AppException(
        "Bank transfer top-up is only available for NGN wallets",
        httpStatus.BAD_REQUEST
      );
    }

    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (!numericAmount || numericAmount <= 0 || Number.isNaN(numericAmount)) {
      throw new AppException("Invalid top-up amount", httpStatus.BAD_REQUEST);
    }

    const txRef = `${user.id}-${Date.now()}`;
    const payload = {
      amount: numericAmount,
      email: user.email,
      fullname: `${user.firstName} ${user.lastName}`,
      phone_number: user.phone,
      tx_ref: txRef,
      currency: "NGN",
      redirect_url: "https://recycool.com/wallet/topup-success",
    };

    return this.flutterwaveClient.chargeBank(payload);
  }

  public async getBanksList(user: User) {
    const country = flutterwaveBankCountryCode(user);
    return this.flutterwaveClient.getBanks(country);
  }

  public async creditUserWallet(body: {
    user: string;
    amount: number;
    idempotent: string;
  }) {
    const userData = await prisma.user.findUnique({ where: { id: body.user } });
    const isExistingTransaction = await prisma.transaction.findFirst({ where: { reference: body.idempotent } });

    if (isExistingTransaction) {
      throw new AppException("Transaction already processed", httpStatus.CONFLICT);
    }

    if (!userData) {
      throw new AppException("User not found", httpStatus.NOT_FOUND);
    }

    const wallet = await this.getWallet(body.user);

    const existingTransaction = await prisma.transaction.findFirst({
      where: { reference: body.idempotent },
    });

    if (existingTransaction) {
      throw new AppException("Transaction already processed", httpStatus.CONFLICT);
    }

    const result = await this.creditWallet(body.user, body.amount, "Wallet credit");

    console.log("We got done ok")

    return {
      transactionId: result.transaction.id,
      amount: body.amount,
      currency: wallet.currency,
    };
  }

  public async getWallet(userId: string) {
    return this._setupAccount(userId);
  }

  public async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  public async chargeWallet(
    userId: string,
    reason: string,
    amount: number,
    sendTo?: string,
    transactionType?: TransactionType
  ) {
    if (amount <= 0) {
      throw new AppException("Amount must be greater than 0", httpStatus.BAD_REQUEST);
    }

    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new AppException("Insufficient funds", httpStatus.BAD_REQUEST);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance - amount },
      });

      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          status: Status.COMPLETED,
          type: transactionType || TransactionType.WITHDRAWAL,
          reference: `${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          description: reason,
          balanceBefore: wallet.balance,
          balanceAfter: updated.balance,
          fee: 0,
          userId: wallet.userId,
          metadata: { orderId: sendTo ?? null, reason },
        },
      });
    });
  }

  public async creditWallet(
    userId: string,
    amount: number,
    reason: string,
    orderId?: string
  ) {
    if (amount <= 0) {
      throw new AppException("Amount must be greater than 0", httpStatus.BAD_REQUEST);
    }

    const wallet = await this.getWallet(userId);

    return prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + amount },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          status: Status.COMPLETED,
          type: TransactionType.PAYMENT,
          reference: `${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          description: reason,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          fee: 0,
          userId: wallet.userId,
          metadata: { orderId: orderId ?? null, reason },
        },
      });

      return { transaction, wallet: updatedWallet };
    });
  }
}
