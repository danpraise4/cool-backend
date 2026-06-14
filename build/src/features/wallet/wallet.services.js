"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const flutterwave_client_1 = __importDefault(require("../../shared/services/flutterwave/flutterwave.client"));
const app_config_1 = __importDefault(require("../../shared/config/app.config"));
const token_service_1 = __importDefault(require("../../shared/services/token.service"));
const adminservice_client_1 = __importDefault(require("../../shared/services/admin/adminservice.client"));
const adminservice_1 = __importDefault(require("../../shared/services/admin/adminservice"));
const wallet_region_1 = require("./wallet.region");
const logger_1 = __importDefault(require("../../shared/services/logger"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
const email_notification_service_1 = require("../../shared/services/email/email-notification.service");
const wallet_withdraw_utils_1 = require("./wallet.withdraw.utils");
const NGN_BANKS_CACHE_TTL_MS = 60 * 60 * 1000;
let ngnBanksCache = null;
class WalletService {
    flutterwaveClient;
    tokenService;
    adminClient;
    constructor() {
        this.tokenService = new token_service_1.default();
        this.flutterwaveClient = new flutterwave_client_1.default()
            .initialize(app_config_1.default.FLUTTERWAVE.PUBLIC_KEY, app_config_1.default.FLUTTERWAVE.SECRET_KEY)
            .build();
        this.adminClient = new adminservice_client_1.default(new adminservice_1.default()).build();
    }
    /**
     * Verify that the incoming webhook actually came from Flutterwave.
     * Set FLW_WEBHOOK_HASH in your env to the secret hash configured in the
     * Flutterwave dashboard. Requests without a matching header are rejected.
     */
    verifyWebhookSignature(secretHash, header) {
        if (!secretHash) {
            logger_1.default.warn("FLW_WEBHOOK_HASH not configured — skipping webhook signature check");
            return true;
        }
        return header === secretHash;
    }
    async paymentHook(payload, webhookHeader) {
        const flwWebhookHash = process.env.FLW_WEBHOOK_HASH;
        if (!this.verifyWebhookSignature(flwWebhookHash, webhookHeader)) {
            throw new app_exception_1.default("Invalid webhook signature", http_status_1.default.UNAUTHORIZED);
        }
        const { event, data } = payload;
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
    async handleChargeCompleted(data) {
        const { tx_ref, flw_ref, amount } = data;
        // Confirm recycle transaction in background — failure must not block wallet credit
        this.adminClient.confirmRecycleTransaction(flw_ref, data).catch((err) => {
            logger_1.default.error({ err }, "Failed to confirm recycle transaction");
        });
        const account = await connect_1.default.wallet.findFirst({
            where: { userId: tx_ref },
        });
        if (!account) {
            logger_1.default.warn({ tx_ref }, "paymentHook: wallet not found for tx_ref");
            return { message: "Wallet not found" };
        }
        // Idempotency — skip duplicate events
        const existingTransaction = await connect_1.default.transaction.findFirst({
            where: { reference: flw_ref },
        });
        if (existingTransaction) {
            return existingTransaction;
        }
        const transaction = await connect_1.default.$transaction(async (tx) => {
            const wallet = await tx.wallet.update({
                where: { id: account.id },
                data: { balance: { increment: amount } },
            });
            return tx.transaction.create({
                data: {
                    walletId: account.id,
                    amount,
                    status: client_1.Status.COMPLETED,
                    type: client_1.TransactionType.TOPUP,
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
        email_notification_service_1.emailNotificationService.notifyUser(account.userId, email_notification_service_1.EmailNotificationType.WALLET_TOPUP, {
            amount,
            currency: account.currency,
            reference: flw_ref,
        });
        return transaction;
    }
    async handleTransferCompleted(data) {
        const reference = data.reference ||
            data.tx_ref;
        if (!reference) {
            logger_1.default.warn({ data }, "transfer.completed webhook missing reference");
            return { message: "No reference" };
        }
        const transaction = await connect_1.default.transaction.findFirst({ where: { reference } });
        if (!transaction) {
            logger_1.default.warn({ reference }, "transfer.completed: transaction not found");
            return { message: "Transaction not found" };
        }
        if (transaction.status === client_1.Status.COMPLETED) {
            return transaction;
        }
        return connect_1.default.transaction.update({
            where: { id: transaction.id },
            data: {
                status: client_1.Status.COMPLETED,
                metadata: {
                    ...transaction.metadata,
                    flutterwaveTransfer: data,
                },
            },
        });
    }
    async handleTransferFailed(data) {
        const reference = data.reference ||
            data.tx_ref;
        if (!reference) {
            logger_1.default.warn({ data }, "transfer.failed webhook missing reference");
            return { message: "No reference" };
        }
        const transaction = await connect_1.default.transaction.findFirst({
            where: { reference },
            include: { wallet: true },
        });
        if (!transaction) {
            logger_1.default.warn({ reference }, "transfer.failed: transaction not found");
            return { message: "Transaction not found" };
        }
        if (transaction.status === client_1.Status.REJECTED) {
            return transaction;
        }
        return connect_1.default.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { id: transaction.walletId } });
            if (!wallet) {
                throw new app_exception_1.default("Wallet not found", http_status_1.default.NOT_FOUND);
            }
            const refundedBalance = wallet.balance + transaction.amount;
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: refundedBalance },
            });
            return tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: client_1.Status.REJECTED,
                    description: `${transaction.description} (failed — refunded)`,
                    metadata: {
                        ...transaction.metadata,
                        flutterwaveTransferFailure: data,
                    },
                },
            });
        });
    }
    mapFlutterwaveError(err) {
        const message = err instanceof Error ? err.message : "Payment provider request failed";
        return new app_exception_1.default(message, http_status_1.default.BAD_REQUEST);
    }
    async fetchNigerianBanks(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh &&
            ngnBanksCache &&
            now - ngnBanksCache.fetchedAt < NGN_BANKS_CACHE_TTL_MS) {
            return ngnBanksCache.banks;
        }
        const response = await this.flutterwaveClient.getBanks("NG");
        const banks = (0, wallet_withdraw_utils_1.normalizeBankList)(response.data);
        ngnBanksCache = { fetchedAt: now, banks };
        return banks;
    }
    async assertNgnWallet(userId) {
        const wallet = await connect_1.default.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            throw new app_exception_1.default("Wallet not found", http_status_1.default.NOT_FOUND);
        }
        if (wallet.currency !== client_1.Currency.NGN) {
            throw new app_exception_1.default("This action is only available for NGN wallets", http_status_1.default.BAD_REQUEST);
        }
        return wallet;
    }
    async resolveNigerianAccount(account_number, account_bank) {
        const bankCode = (0, wallet_withdraw_utils_1.normalizeBankCode)(account_bank);
        const banks = await this.fetchNigerianBanks();
        if (!(0, wallet_withdraw_utils_1.bankCodeExists)(banks, bankCode)) {
            throw new app_exception_1.default("Invalid bank code", http_status_1.default.BAD_REQUEST);
        }
        let response;
        try {
            response = await this.flutterwaveClient.getBankAccountDetails({
                account_number,
                account_bank: bankCode,
            });
        }
        catch (err) {
            throw this.mapFlutterwaveError(err);
        }
        if (response.status !== "success" || !response.data?.account_name) {
            throw new app_exception_1.default(response.message || "Could not resolve bank account", http_status_1.default.BAD_REQUEST);
        }
        return {
            account_number: response.data.account_number ?? account_number,
            account_name: response.data.account_name,
            account_bank: bankCode,
        };
    }
    async _setupAccount(userId) {
        const existing = await connect_1.default.wallet.findUnique({ where: { userId } });
        if (existing)
            return existing;
        const user = await connect_1.default.user.findUnique({ where: { id: userId } });
        return connect_1.default.wallet.create({
            data: {
                userId,
                currency: (0, wallet_region_1.inferWalletCurrencyForNewUser)(user),
            },
        });
    }
    async createCardCharge({ user, card }) {
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
            encryptionKey: app_config_1.default.FLUTTERWAVE.ENCRYPTION_KEY,
            payload,
        });
        return this.flutterwaveClient.chargeCard({ client: token });
    }
    async createCardChargeURL({ user, amount, }) {
        const wallet = await this.getWallet(user.id);
        const currencyIso = {
            [client_1.Currency.NGN]: "NGN",
            [client_1.Currency.GBP]: "GBP",
            [client_1.Currency.USD]: "USD",
            [client_1.Currency.EUR]: "EUR",
        };
        const currency = currencyIso[wallet.currency] || "EUR";
        const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        if (!numericAmount || numericAmount <= 0 || Number.isNaN(numericAmount)) {
            throw new app_exception_1.default("Invalid top-up amount", http_status_1.default.BAD_REQUEST);
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
    async getBankAccountDetails(userId, body) {
        await this.assertNgnWallet(userId);
        return this.resolveNigerianAccount(body.account_number, body.account_bank);
    }
    async resolveUK(body) {
        return this.flutterwaveClient.resolveUK(body);
    }
    async transferToBankUKUser({ user, amount, account_number, bank_name, account_name, swift_code, }) {
        const wallet = await connect_1.default.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet) {
            throw new app_exception_1.default("Wallet not found", http_status_1.default.NOT_FOUND);
        }
        if (wallet.currency !== client_1.Currency.GBP) {
            throw new app_exception_1.default("UK bank withdrawals are only available for GBP wallets", http_status_1.default.BAD_REQUEST);
        }
        const numericAmount = Number(amount);
        if (wallet.balance < numericAmount) {
            throw new app_exception_1.default("Insufficient funds", http_status_1.default.BAD_REQUEST);
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
        const transaction = await connect_1.default.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            });
            return tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: numericAmount,
                    status: client_1.Status.COMPLETED,
                    type: client_1.TransactionType.WITHDRAWAL,
                    reference: ref,
                    description: "Withdrawal to UK bank account",
                    balanceBefore,
                    balanceAfter,
                    fee: 0,
                    userId: wallet.userId,
                    metadata: { flutterwave: response },
                },
            });
        });
        email_notification_service_1.emailNotificationService.notifyUser(wallet.userId, email_notification_service_1.EmailNotificationType.WALLET_WITHDRAWAL, {
            amount: numericAmount,
            currency: wallet.currency,
            reference: ref,
        });
        return { transfer: response, transaction };
    }
    async transferToBank({ user, amount, account_number, account_bank, idempotencyKey, }) {
        const wallet = await this.assertNgnWallet(user.id);
        const bankCode = (0, wallet_withdraw_utils_1.normalizeBankCode)(account_bank);
        let numericAmount;
        try {
            numericAmount = (0, wallet_withdraw_utils_1.parseWithdrawalAmount)(amount);
            (0, wallet_withdraw_utils_1.assertWithdrawalAmountInRange)(numericAmount);
        }
        catch (err) {
            throw new app_exception_1.default(err instanceof Error ? err.message : "Invalid withdrawal amount", http_status_1.default.BAD_REQUEST);
        }
        if (wallet.balance < numericAmount) {
            throw new app_exception_1.default("Insufficient funds", http_status_1.default.BAD_REQUEST);
        }
        const ref = idempotencyKey || `ng-withdraw-${user.id}-${Date.now()}`;
        const existingTransaction = await connect_1.default.transaction.findFirst({
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
        let response;
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
        }
        catch (err) {
            throw this.mapFlutterwaveError(err);
        }
        if (response.status !== "success") {
            throw new app_exception_1.default(response.message || "Transfer could not be initiated", http_status_1.default.BAD_REQUEST);
        }
        const flwTransferId = response.data?.id;
        logger_1.default.info({ reference: ref, flwTransferId, userId: user.id, amount: numericAmount }, "NGN withdrawal transfer queued");
        const balanceBefore = wallet.balance;
        const balanceAfter = wallet.balance - numericAmount;
        const transaction = await connect_1.default.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: balanceAfter },
            });
            return tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: numericAmount,
                    status: client_1.Status.PENDING,
                    type: client_1.TransactionType.WITHDRAWAL,
                    reference: ref,
                    description: "Withdrawal to Nigerian bank account",
                    balanceBefore,
                    balanceAfter,
                    fee: 0,
                    userId: wallet.userId,
                    metadata: {
                        flutterwave: (response.data ?? {}),
                        account_name: resolved.account_name,
                        account_bank: bankCode,
                        account_number: resolved.account_number,
                    },
                },
            });
        });
        email_notification_service_1.emailNotificationService.notifyUser(wallet.userId, email_notification_service_1.EmailNotificationType.WALLET_WITHDRAWAL, {
            amount: numericAmount,
            currency: wallet.currency,
            reference: ref,
        });
        return {
            reference: ref,
            transfer: response.data,
            transaction,
        };
    }
    async createBankCharge({ user, amount, }) {
        const wallet = await connect_1.default.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet || wallet.currency !== client_1.Currency.NGN) {
            throw new app_exception_1.default("Bank transfer top-up is only available for NGN wallets", http_status_1.default.BAD_REQUEST);
        }
        const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
        if (!numericAmount || numericAmount <= 0 || Number.isNaN(numericAmount)) {
            throw new app_exception_1.default("Invalid top-up amount", http_status_1.default.BAD_REQUEST);
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
    async getBanksList(user) {
        const wallet = await this.getWallet(user.id);
        if (wallet.currency === client_1.Currency.NGN) {
            return this.fetchNigerianBanks();
        }
        const country = (0, wallet_region_1.flutterwaveBankCountryCode)(user);
        const response = await this.flutterwaveClient.getBanks(country);
        return (0, wallet_withdraw_utils_1.normalizeBankList)(response.data);
    }
    async creditUserWallet(body) {
        const userData = await connect_1.default.user.findUnique({ where: { id: body.user } });
        const isExistingTransaction = await connect_1.default.transaction.findFirst({ where: { reference: body.idempotent } });
        if (isExistingTransaction) {
            throw new app_exception_1.default("Transaction already processed", http_status_1.default.CONFLICT);
        }
        if (!userData) {
            throw new app_exception_1.default("User not found", http_status_1.default.NOT_FOUND);
        }
        const wallet = await this.getWallet(body.user);
        const existingTransaction = await connect_1.default.transaction.findFirst({
            where: { reference: body.idempotent },
        });
        if (existingTransaction) {
            throw new app_exception_1.default("Transaction already processed", http_status_1.default.CONFLICT);
        }
        const result = await this.creditWallet(body.user, body.amount, "Wallet credit", null, { idempotent: body.idempotent });
        return {
            transactionId: result.transaction.id,
            amount: body.amount,
            currency: wallet.currency,
        };
    }
    async getWallet(userId) {
        return this._setupAccount(userId);
    }
    async getTransactions(userId) {
        return connect_1.default.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async chargeWallet(userId, reason, amount, sendTo, transactionType) {
        if (amount <= 0) {
            throw new app_exception_1.default("Amount must be greater than 0", http_status_1.default.BAD_REQUEST);
        }
        const wallet = await this.getWallet(userId);
        if (wallet.balance < amount) {
            throw new app_exception_1.default("Insufficient funds", http_status_1.default.BAD_REQUEST);
        }
        return connect_1.default.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: wallet.balance - amount },
            });
            return tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    status: client_1.Status.COMPLETED,
                    type: transactionType || client_1.TransactionType.WITHDRAWAL,
                    reference: `${userId}-${Date.now()}-${crypto_1.default.randomBytes(4).toString("hex")}`,
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
    async creditWallet(userId, amount, reason, orderId, options) {
        if (amount <= 0) {
            throw new app_exception_1.default("Amount must be greater than 0", http_status_1.default.BAD_REQUEST);
        }
        const wallet = await this.getWallet(userId);
        return connect_1.default.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: wallet.balance + amount },
            });
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    status: client_1.Status.COMPLETED,
                    type: client_1.TransactionType.PAYMENT,
                    reference: options?.idempotent ?? `${userId}-${Date.now()}-${crypto_1.default.randomBytes(4).toString("hex")}`,
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
exports.WalletService = WalletService;
