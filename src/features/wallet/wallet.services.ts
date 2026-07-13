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
import { notificationService } from "../../shared/services/notification/notification.service";
import {
  assertWithdrawalAmountInRange,
  bankCodeExists,
  normalizeBankCode,
  normalizeBankList,
  NormalizedBank,
  parseWithdrawalAmount,
} from "./wallet.withdraw.utils";
import {
  buildWalletTopUpReference,
  extractFlutterwaveBankTransferDetails,
  FlutterwaveBankTransferResponse,
  normalizeCardTopUpPayment,
  normalizeVirtualAccountTopUp,
  parseUserIdFromTopUpReference,
} from "./wallet.topup.utils";
import { IFlutterwaveBaseResponse } from "../../shared/services/flutterwave/flutterwave.interface";

const NGN_BANKS_CACHE_TTL_MS = 60 * 60 * 1000;
let ngnBanksCache: { fetchedAt: number; banks: NormalizedBank[] } | null = null;

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

    if (event === "charge.completed") {
      return this.handleChargeCompleted(data);
    }

    if (event === "transfer.completed") {
      return this.handleTransferCompleted(data);
    }

    if (event === "transfer.failed") {
      return this.handleTransferFailed(data);
    }

    return { message: "Hook received" };
  }

  private async resolveWalletForTopUp(txRef: string) {
    const pendingTopUp = await prisma.transaction.findFirst({
      where: {
        reference: txRef,
        type: TransactionType.TOPUP,
        status: Status.PENDING,
      },
      include: { wallet: true },
    });

    if (pendingTopUp?.wallet) {
      return { wallet: pendingTopUp.wallet, pendingTopUp };
    }

    const userId = parseUserIdFromTopUpReference(txRef);
    if (!userId) {
      return { wallet: null, pendingTopUp: null };
    }

    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    return { wallet, pendingTopUp: null };
  }

  private async handleChargeCompleted(data: Record<string, unknown>) {
    const { tx_ref, flw_ref, amount } = data as {
      tx_ref: string;
      flw_ref: string;
      amount: number;
    };

    // Confirm recycle transaction in background — failure must not block wallet credit
    this.adminClient.confirmRecycleTransaction(data).catch((err: unknown) => {
      logger.error({ err }, "Failed to confirm recycle transaction");
    });

    const { wallet: account, pendingTopUp } = await this.resolveWalletForTopUp(tx_ref);

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

      if (pendingTopUp) {
        return tx.transaction.update({
          where: { id: pendingTopUp.id },
          data: {
            amount,
            status: Status.COMPLETED,
            reference: flw_ref,
            description: "Wallet top-up via Flutterwave bank transfer",
            balanceBefore: account.balance,
            balanceAfter: wallet.balance,
            metadata: {
              ...(pendingTopUp.metadata as object),
              tx_ref,
              flw_ref,
              flutterwave: data,
            } as object,
          },
        });
      }

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
          metadata: { tx_ref, flw_ref },
        },
      });
    });

    emailNotificationService.notifyUser(account.userId, EmailNotificationType.WALLET_TOPUP, {
      amount,
      currency: account.currency,
      reference: flw_ref,
    });

    void notificationService.createAndSend(account.userId, {
      title: "Wallet top-up successful",
      body: `Your wallet was credited with ${amount} ${account.currency}.`,
      link: "/wallet",
      type: "WALLET_TOPUP",
      data: {
        type: "WALLET_TOPUP",
        reference: flw_ref,
      },
    });

    return transaction;
  }

  private async handleTransferCompleted(data: Record<string, unknown>) {
    const reference =
      (data.reference as string | undefined) ||
      (data.tx_ref as string | undefined);

    console.log("reference", reference);
    console.log("data", data);
    /// call admin but dont lets response  spoil anything
    this.adminClient.confirmRecycleTransaction(data).catch((err: unknown) => {
      logger.error({ err }, "Failed to confirm recycle transaction");
    });

    if (!reference) {
      logger.warn({ data }, "transfer.completed webhook missing reference");
      return { message: "No reference" };
    }

    const transaction = await prisma.transaction.findFirst({ where: { reference } });
    if (!transaction) {
      logger.warn({ reference }, "transfer.completed: transaction not found");
      return { message: "Transaction not found" };
    }

    if (transaction.status === Status.COMPLETED) {
      return transaction;
    }

    return prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: Status.COMPLETED,
        metadata: {
          ...(transaction.metadata as object),
          flutterwaveTransfer: data,
        } as object,
      },
    });



  }

  private async handleTransferFailed(data: Record<string, unknown>) {
    const reference =
      (data.reference as string | undefined) ||
      (data.tx_ref as string | undefined);

    if (!reference) {
      logger.warn({ data }, "transfer.failed webhook missing reference");
      return { message: "No reference" };
    }

    const transaction = await prisma.transaction.findFirst({
      where: { reference },
      include: { wallet: true },
    });

    if (!transaction) {
      logger.warn({ reference }, "transfer.failed: transaction not found");
      return { message: "Transaction not found" };
    }

    if (transaction.status === Status.REJECTED) {
      return transaction;
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: transaction.walletId } });
      if (!wallet) {
        throw new AppException("Wallet not found", httpStatus.NOT_FOUND);
      }

      const refundedBalance = wallet.balance + transaction.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: refundedBalance },
      });

      return tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: Status.REJECTED,
          description: `${transaction.description} (failed — refunded)`,
          metadata: {
            ...(transaction.metadata as object),
            flutterwaveTransferFailure: data,
          } as object,
        },
      });
    });
  }

  private mapFlutterwaveError(err: unknown): AppException {
    const message =
      err instanceof Error ? err.message : "Payment provider request failed";
    return new AppException(message, httpStatus.BAD_REQUEST);
  }

  private async fetchNigerianBanks(forceRefresh = false): Promise<NormalizedBank[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      ngnBanksCache &&
      now - ngnBanksCache.fetchedAt < NGN_BANKS_CACHE_TTL_MS
    ) {
      return ngnBanksCache.banks;
    }

    const response = await this.flutterwaveClient.getBanks("NG");
    const banks = normalizeBankList(response.data);
    ngnBanksCache = { fetchedAt: now, banks };
    return banks;
  }

  private async assertNgnWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new AppException("Wallet not found", httpStatus.NOT_FOUND);
    }
    if (wallet.currency !== Currency.NGN) {
      throw new AppException(
        "This action is only available for NGN wallets",
        httpStatus.BAD_REQUEST
      );
    }
    return wallet;
  }

  private async resolveNigerianAccount(account_number: string, account_bank: string) {
    const bankCode = normalizeBankCode(account_bank);
    const banks = await this.fetchNigerianBanks();

    if (!bankCodeExists(banks, bankCode)) {
      throw new AppException("Invalid bank code", httpStatus.BAD_REQUEST);
    }

    let response: IFlutterwaveBaseResponse<{ account_number: string; account_name: string }>;
    try {
      response = await this.flutterwaveClient.getBankAccountDetails({
        account_number,
        account_bank: bankCode,
      });
    } catch (err) {
      throw this.mapFlutterwaveError(err);
    }

    if (response.status !== "success" || !response.data?.account_name) {
      throw new AppException(
        response.message || "Could not resolve bank account",
        httpStatus.BAD_REQUEST
      );
    }

    return {
      account_number: response.data.account_number ?? account_number,
      account_name: response.data.account_name,
      account_bank: bankCode,
    };
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
    const txRef = buildWalletTopUpReference(user.id);
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

    const txRef = buildWalletTopUpReference(user.id);
    const redirectUrl = `https://recycool.com/wallet/payment/successful?reference=${encodeURIComponent(txRef)}`;
    const payload = {
      tx_ref: txRef,
      amount: numericAmount.toString(),
      currency,
      redirect_url: redirectUrl,
      customer: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      customizations: { title: "Top-up Wallet" },
      meta: {
        userId: user.id,
        type: "WALLET_TOPUP",
        reference: txRef,
      },
    };

    let providerResponse;
    try {
      providerResponse = await this.flutterwaveClient.createCardCharge(payload);
    } catch (err) {
      throw this.mapFlutterwaveError(err);
    }

    const normalized = normalizeCardTopUpPayment(
      txRef,
      numericAmount,
      currency,
      providerResponse as unknown as Record<string, unknown>
    );

    if (!normalized.paymentUrl) {
      throw new AppException(
        "Could not create payment link",
        httpStatus.BAD_GATEWAY
      );
    }

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        amount: numericAmount,
        status: Status.PENDING,
        type: TransactionType.TOPUP,
        reference: txRef,
        description: "Pending card checkout top-up",
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        fee: 0,
        metadata: {
          provider: "flutterwave",
          chargeType: "card_checkout",
          paymentUrl: normalized.paymentUrl,
          redirectUrl,
          flutterwave: providerResponse as object,
        },
      },
    });

    return normalized;
  }

  public async getBankAccountDetails(
    userId: string,
    body: {
      account_number: string;
      account_bank: string;
    }
  ) {
    await this.assertNgnWallet(userId);
    return this.resolveNigerianAccount(body.account_number, body.account_bank);
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

    void notificationService.createAndSend(wallet.userId, {
      title: "Withdrawal initiated",
      body: `Your withdrawal of ${numericAmount} ${wallet.currency} has been initiated.`,
      link: "/wallet",
      data: {
        type: "WALLET_WITHDRAWAL",
        reference: ref,
      },
    });

    return { transfer: response, transaction };
  }

  public async transferToBank({
    user,
    amount,
    account_number,
    account_bank,
    idempotencyKey,
  }: {
    user: User;
    amount: number | string;
    account_number: string;
    account_bank: string;
    idempotencyKey?: string;
  }) {
    const wallet = await this.assertNgnWallet(user.id);
    const bankCode = normalizeBankCode(account_bank);

    let numericAmount: number;
    try {
      numericAmount = parseWithdrawalAmount(amount);
      assertWithdrawalAmountInRange(numericAmount);
    } catch (err) {
      throw new AppException(
        err instanceof Error ? err.message : "Invalid withdrawal amount",
        httpStatus.BAD_REQUEST
      );
    }

    if (wallet.balance < numericAmount) {
      throw new AppException("Insufficient funds", httpStatus.BAD_REQUEST);
    }

    const ref = idempotencyKey || `ng-withdraw-${user.id}-${Date.now()}`;

    const existingTransaction = await prisma.transaction.findFirst({
      where: { reference: ref, userId: user.id },
    });
    if (existingTransaction) {
      return {
        reference: existingTransaction.reference,
        transaction: existingTransaction,
        duplicate: true,
      };
    }

    const resolved = await this.resolveNigerianAccount(account_number, bankCode);

    let response: IFlutterwaveBaseResponse<Record<string, unknown>>;
    try {
      response = await this.flutterwaveClient.transferToBank({
        account_bank: bankCode,
        account_number: resolved.account_number,
        amount: numericAmount,
        currency: "NGN",
        narration: "Recycool wallet withdrawal",
        reference: ref,
        debit_currency: "NGN",
        beneficiary_name: resolved.account_name,
      });
    } catch (err) {
      throw this.mapFlutterwaveError(err);
    }

    if (response.status !== "success") {
      throw new AppException(
        response.message || "Transfer could not be initiated",
        httpStatus.BAD_REQUEST
      );
    }

    const flwTransferId = response.data?.id;
    logger.info(
      { reference: ref, flwTransferId, userId: user.id, amount: numericAmount },
      "NGN withdrawal transfer queued"
    );

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
          status: Status.PENDING,
          type: TransactionType.WITHDRAWAL,
          reference: ref,
          description: "Withdrawal to Nigerian bank account",
          balanceBefore,
          balanceAfter,
          fee: 0,
          userId: wallet.userId,
          metadata: {
            flutterwave: (response.data ?? {}) as object,
            account_name: resolved.account_name,
            account_bank: bankCode,
            account_number: resolved.account_number,
          },
        },
      });
    });

    emailNotificationService.notifyUser(wallet.userId, EmailNotificationType.WALLET_WITHDRAWAL, {
      amount: numericAmount,
      currency: wallet.currency,
      reference: ref,
    });

    void notificationService.createAndSend(wallet.userId, {
      title: "Withdrawal initiated",
      body: `Your withdrawal of ${numericAmount} ${wallet.currency} has been initiated.`,
      link: "/wallet",
      type: "WALLET_WITHDRAWAL",
      data: {
        type: "WALLET_WITHDRAWAL",
        reference: ref,
      },
    });

    return {
      reference: ref,
      transfer: response.data,
      transaction,
    };
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

    const txRef = buildWalletTopUpReference(user.id);
    const payload = {
      amount: numericAmount,
      email: user.email,
      fullname: `${user.firstName} ${user.lastName}`,
      phone_number: user.phone,
      tx_ref: txRef,
      currency: "NGN",
      redirect_url: "https://recycool.com/wallet/topup-success",
    };

    const providerResponse = await this.flutterwaveClient.chargeBank(payload);
    const transferDetails = extractFlutterwaveBankTransferDetails(
      providerResponse as FlutterwaveBankTransferResponse
    );

    const normalized = normalizeVirtualAccountTopUp(
      txRef,
      numericAmount,
      "NGN",
      transferDetails
    );

    if (!normalized.accountNumber) {
      throw new AppException(
        "Virtual account could not be generated. Please try again.",
        httpStatus.BAD_GATEWAY
      );
    }

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: user.id,
        amount: numericAmount,
        status: Status.PENDING,
        type: TransactionType.TOPUP,
        reference: txRef,
        description: "Pending NGN bank transfer top-up",
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        fee: 0,
        metadata: {
          provider: "flutterwave",
          chargeType: "bank_transfer",
          virtualAccount: normalized.virtualAccount,
          flutterwave: providerResponse as object,
        },
      },
    });

    return normalized;
  }

  public async getBanksList(user: User) {
    const wallet = await this.getWallet(user.id);

    if (wallet.currency === Currency.NGN) {
      return this.fetchNigerianBanks();
    }

    const country = flutterwaveBankCountryCode(user);
    const response = await this.flutterwaveClient.getBanks(country);
    return normalizeBankList(response.data);
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

    const result = await this.creditWallet(body.user, body.amount, "Wallet credit", null, { idempotent: body.idempotent });


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
      where: {
        userId,
        status: { not: Status.PENDING },
      },
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
    orderId?: string,
    options?: { idempotent?: string }
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
          reference: options?.idempotent ?? `${userId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
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
