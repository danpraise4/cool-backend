"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const client_1 = require("@prisma/client");
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const flutterwave_client_1 = __importDefault(require("../../shared/services/flutterwave/flutterwave.client"));
const app_config_1 = __importDefault(require("../../shared/config/app.config"));
const token_service_1 = __importDefault(require("../../shared/services/token.service"));
class WalletService {
    FlutterwaveClient;
    tokenService;
    constructor() {
        this.tokenService = new token_service_1.default();
        const flutterwaveClient = new flutterwave_client_1.default().initialize(app_config_1.default.FLUTTERWAVE.PUBLIC_KEY, app_config_1.default.FLUTTERWAVE.SECRET_KEY);
        this.FlutterwaveClient = flutterwaveClient.build();
    }
    async paymentHook(payload) {
        const { event, data } = payload;
        if (event === "charge.completed") {
            const { tx_ref } = data;
            // find the originator of the transaction
            const account = await connect_1.default.wallet.findUnique({
                where: {
                    userId: tx_ref,
                },
            });
            if (!account) {
                throw new Error("Wallet not found");
            }
            // Idenpotent check
            const existingTransaction = await connect_1.default.transaction.findFirst({
                where: {
                    reference: data.flw_ref,
                },
            });
            if (existingTransaction) {
                return existingTransaction;
            }
            // Create the transaction
            const transaction = await connect_1.default.transaction.create({
                data: {
                    walletId: account.id,
                    amount: data.amount,
                    status: client_1.Status.COMPLETED,
                    type: client_1.TransactionType.TOPUP,
                    reference: data.flw_ref,
                    description: "Topup from Flutterwave",
                    balanceBefore: account.balance,
                    balanceAfter: account.balance + data.amount,
                    fee: 0,
                    userId: account.userId,
                    metadata: {
                        flw_ref: data.flw_ref,
                        flw_otp: data.otp,
                    },
                },
            });
            // Update wallet balance
            await connect_1.default.wallet.update({
                where: {
                    id: account.id,
                },
                data: {
                    balance: account.balance + data.amount,
                    updatedAt: new Date(),
                },
            });
            return transaction;
        }
        return {
            message: "Hook received successfully",
        };
    }
    async _setupAccount(userId) {
        let wallet = await connect_1.default.wallet.findUnique({
            where: {
                userId,
            },
        });
        if (wallet) {
            return wallet;
        }
        const user = await connect_1.default.user.findUnique({
            where: {
                id: userId,
            },
        });
        wallet = await connect_1.default.wallet.create({
            data: {
                userId,
                currency: user?.cityOfResidence === "Lagos" ? client_1.Currency.NGN : client_1.Currency.EUR,
            },
        });
        return wallet;
    }
    async createCardCharge({ user, card }) {
        const payload = {
            preauthorize: false, // initiates a preauthorized charge
            usesecureauth: true, // set to true if you want to authorize the card payment with 3DS, set to false to charge with NoAuth
            ...card,
            email: user.email,
            fullname: `${user.firstName} ${user.lastName}`,
            phone_number: user.phone,
            tx_ref: user.id,
            redirect_url: "https://example_company.com/success",
            authorization: {
                mode: "pin",
                pin: 2245,
                city: "San Francisco",
                address: "333 Fremont Street, San Francisco, CA",
                state: "California",
                country: "US",
                zipcode: 94105,
            },
        };
        const token = await this.tokenService.generateFlutterwaveToken({
            encryptionKey: app_config_1.default.FLUTTERWAVE.ENCRYPTION_KEY,
            payload,
        });
        const response = await this.FlutterwaveClient.chargeCard({ client: token });
        return response;
    }
    async getBankAccountDetails(body) {
        const response = await this.FlutterwaveClient.getBankAccountDetails({
            account_number: body.account_number,
            account_bank: body.account_bank,
        });
        return response;
    }
    async transferToBankUKUser({ user, amount, account_number, bank_name, account_name, swift_code, }) {
        // Get user's wallet
        const wallet = await connect_1.default.wallet.findUnique({
            where: { userId: user.id },
        });
        amount = Number(amount);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        if (wallet.balance < amount) {
            throw new Error("Insufficient funds");
        }
        // Debit wallet
        await connect_1.default.wallet.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance - amount },
        });
        // Create transfer
        const response = await this.FlutterwaveClient.transferToBankUKUser({
            "amount": amount,
            "narration": "Sample UK Transfer",
            "currency": "GBP",
            "beneficiary_name": account_name,
            "meta": [
                {
                    "account_number": account_number,
                    "routing_number": swift_code,
                    "swift_code": swift_code,
                    "bank_name": bank_name,
                    "beneficiary_name": account_name,
                    "beneficiary_country": "UK",
                    "postal_code": "80489",
                    "street_number": "31",
                    "street_name": user.address,
                    "city": "London"
                }
            ]
        });
        const account = await connect_1.default.wallet.findUnique({
            where: {
                userId: user.id,
            },
        });
        if (!account) {
            throw new Error("Wallet not found");
        }
        // Create transaction record
        // Create the transaction
        const transaction = await connect_1.default.transaction.create({
            data: {
                walletId: account.id,
                amount: amount,
                status: client_1.Status.COMPLETED,
                type: client_1.TransactionType.TOPUP,
                reference: user.id,
                description: "Topup from Flutterwave",
                balanceBefore: account.balance,
                balanceAfter: account.balance - amount,
                fee: 0,
                userId: account.userId,
            },
        });
        return {
            transfer: response,
            trasaction: transaction,
        };
    }
    async transferToBank({ user, amount, account_number, account_bank, }) {
        // Get user's wallet
        const wallet = await connect_1.default.wallet.findUnique({
            where: { userId: user.id },
        });
        amount = Number(amount);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        if (wallet.balance < amount) {
            throw new Error("Insufficient funds");
        }
        // Debit wallet
        await connect_1.default.wallet.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance - amount },
        });
        // Create transfer
        const response = await this.FlutterwaveClient.transferToBank({
            amount,
            account_number,
            account_bank,
            currency: "NGN",
            tx_ref: user.id,
        });
        const account = await connect_1.default.wallet.findUnique({
            where: {
                userId: user.id,
            },
        });
        if (!account) {
            throw new Error("Wallet not found");
        }
        // Create transaction record
        // Create the transaction
        const transaction = await connect_1.default.transaction.create({
            data: {
                walletId: account.id,
                amount: amount,
                status: client_1.Status.COMPLETED,
                type: client_1.TransactionType.TOPUP,
                reference: user.id,
                description: "Topup from Flutterwave",
                balanceBefore: account.balance,
                balanceAfter: account.balance - amount,
                fee: 0,
                userId: account.userId,
            },
        });
        return {
            transfer: response,
            trasaction: transaction,
        };
    }
    async createBankCharge({ user, amount, }) {
        const payload = {
            amount: amount,
            email: user.email,
            fullname: `${user.firstName} ${user.lastName}`,
            phone_number: user.phone,
            tx_ref: user.id,
            currency: "NGN",
            redirect_url: "https://example_company.com/success",
        };
        const response = await this.FlutterwaveClient.chargeBank({ ...payload });
        return response;
    }
    async getBanksList(city) {
        console.log(city);
        const response = await this.FlutterwaveClient.getBanks(city === "Lagos" ? "NG" : "US");
        return response;
    }
    async creditUserWallet(body) {
        const userData = await connect_1.default.user.findUnique({
            where: {
                id: body.user,
            },
        });
        if (!userData) {
            throw new Error("User not found");
        }
        const wallet = await this.getWallet(body.user);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        const existingTransaction = await connect_1.default.transaction.findFirst({
            where: {
                reference: body.idempotent,
            },
        });
        if (existingTransaction) {
            throw new Error("Transaction already exists");
        }
        const transaction = await this.creditWallet(body.user, body.amount, "Credit User Wallet");
        // return transaction;
        return {
            transactionId: transaction.transaction.id,
            amount: body.amount,
            currency: wallet.currency,
        };
    }
    async getWallet(userId) {
        const wallet = await this._setupAccount(userId);
        return wallet;
    }
    async getTransactions(userId) {
        const transactions = await connect_1.default.transaction.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return transactions;
    }
    async chargeWallet(userId, reason, amount, sendTo, transactionType) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        const wallet = await this.getWallet(userId);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        if (wallet.balance < amount) {
            throw new Error("Insufficient funds");
        }
        // Use transaction to ensure atomicity
        const result = await connect_1.default.$transaction(async (prisma) => {
            // Debit wallet
            await prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: wallet.balance - amount,
                    updatedAt: new Date(),
                },
            });
            // Create transaction record
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    status: client_1.Status.COMPLETED,
                    type: transactionType || client_1.TransactionType.WITHDRAWAL,
                    reference: `${userId}-${Date.now()}`, // More unique reference
                    description: reason,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance - amount,
                    fee: 0,
                    userId: wallet.userId,
                    metadata: {
                        orderId: sendTo || null,
                        reason: reason,
                    },
                },
            });
            return transaction;
        });
        return result;
    }
    async creditWallet(userId, amount, reason, orderId) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        const wallet = await this.getWallet(userId);
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        // Use transaction to ensure atomicity
        const result = await connect_1.default.$transaction(async (prisma) => {
            // Credit wallet
            const updatedWallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: wallet.balance + amount,
                    updatedAt: new Date(),
                },
            });
            // Create transaction record
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    status: client_1.Status.COMPLETED,
                    type: client_1.TransactionType.PAYMENT,
                    reference: `${userId}-${Date.now()}`,
                    description: reason,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance + amount,
                    fee: 0,
                    userId: wallet.userId,
                    metadata: {
                        orderId: orderId || null,
                        reason: reason,
                    },
                },
            });
            return { transaction, wallet: updatedWallet };
        });
        return result;
    }
}
exports.WalletService = WalletService;
