import { Currency, Status, TransactionType, User, Wallet } from "@prisma/client";
import prisma from "../../infastructure/database/postgreSQL/connect";
import FlutterwaveClient from "../../shared/services/flutterwave/flutterwave.client";
import config from "../../shared/config/app.config";
import Flutterwave from "../../shared/services/flutterwave/flutterwave";
import TokenService from "../../shared/services/token.service";
import { ICard } from "./wallet.interface";

export class WalletService {
  FlutterwaveClient: Flutterwave;
  tokenService: TokenService;
  constructor() {
    this.tokenService = new TokenService();
    const flutterwaveClient = new FlutterwaveClient().initialize(
      config.FLUTTERWAVE.PUBLIC_KEY,
      config.FLUTTERWAVE.SECRET_KEY
    );
    this.FlutterwaveClient = flutterwaveClient.build();
  }

  public async paymentHook(payload: { [key: string]: any }) {
    const { event, data } = payload;

    if (event === "charge.completed") {
      const { tx_ref } = data;
      // find the originator of the transaction
      const account = await prisma.wallet.findUnique({
        where: {
          userId: tx_ref,
        },
      });

      if (!account) {
        throw new Error("Wallet not found");
      }

      // Idenpotent check
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          reference: data.flw_ref,
        },
      });

      if (existingTransaction) {
        return existingTransaction;
      }

      // Create the transaction
      const transaction = await prisma.transaction.create({
        data: {
          walletId: account.id,
          amount: data.amount,
          status: Status.COMPLETED,
          type: TransactionType.TOPUP,
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
      await prisma.wallet.update({
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

  private async _setupAccount(userId: string): Promise<Wallet> {
    let wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (wallet) {
      return wallet;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    wallet = await prisma.wallet.create({
      data: {
        userId,
        currency: user?.cityOfResidence === "Lagos" ? Currency.NGN : Currency.EUR,
      },
    });

    return wallet;
  }

  public async createCardCharge({ user, card }: { user: User; card: ICard }) {
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
      encryptionKey: config.FLUTTERWAVE.ENCRYPTION_KEY,
      payload,
    });

    const response = await this.FlutterwaveClient.chargeCard({ client: token });
    return response;
  }

  public async getBankAccountDetails(body: {
    account_number: string;
    account_bank: string;
  }) {
    const response = await this.FlutterwaveClient.getBankAccountDetails({
      account_number: body.account_number,
      account_bank: body.account_bank,
    });
    return response;
  }

  public async transferToBankUKUser({
    user,
    amount,
    account_number,
    bank_name,
    account_name,
    routing_number,
    swift_code,
  }: {
    user: User;
    amount: number;
    account_number: string;
    bank_name: string;
    account_name: string;
    routing_number: string;
    swift_code: string;
  }) {

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
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
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - amount },
    });

    // Create transfer
    const response = await this.FlutterwaveClient.transferToBankUKUser(
      {
        "amount": amount,
        "narration": "Sample UK Transfer",
        "currency": "GBP",
        "beneficiary_name": account_name,
        "meta": [
          {
            "account_number": account_number,
            "routing_number": routing_number,
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
      }
    );

    const account = await prisma.wallet.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Wallet not found");
    }

    // Create transaction record
    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: account.id,
        amount: amount,
        status: Status.COMPLETED,
        type: TransactionType.TOPUP,
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
    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
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
    await prisma.wallet.update({
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

    const account = await prisma.wallet.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Wallet not found");
    }

    // Create transaction record
    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: account.id,
        amount: amount,
        status: Status.COMPLETED,
        type: TransactionType.TOPUP,
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

  public async createBankCharge({
    user,
    amount,
  }: {
    user: User;
    amount: number;
  }) {
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

  public async getBanksList(city: string) {
    console.log(city);
    const response = await this.FlutterwaveClient.getBanks(city === "Lagos" ? "NG" : "US");
    return response;
  }

  public async creditUserWallet(body: {
    user: string; amount: number;
    idempotent: string
  }) {

    const userData = await prisma.user.findUnique({
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

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        reference: body.idempotent,
      },
    });

    if (existingTransaction) {
      throw new Error("Transaction already exists");
    }

    const transaction = await this.creditWallet(
      body.user,
      body.amount,
      "Credit User Wallet"
    );

    // return transaction;
    return {
      transactionId: transaction.transaction.id,
      amount: body.amount,
      currency: wallet.currency,
    };
  }

  public async getWallet(userId: string) {
    const wallet = await this._setupAccount(userId);
    return wallet;
  }

  public async getTransactions(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return transactions;
  }

  public async chargeWallet(
    userId: string,
    reason: string,
    amount: number,
    sendTo?: string,
    transactionType?: TransactionType
  ) {
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
    const result = await prisma.$transaction(async (prisma) => {
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
          status: Status.COMPLETED,
          type: transactionType || TransactionType.WITHDRAWAL,
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

      return transaction
    });

    return result;
  }

  public async creditWallet(
    userId: string,
    amount: number,
    reason: string,
    orderId?: string
  ) {
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const wallet = await this.getWallet(userId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (prisma) => {
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
          status: Status.COMPLETED,
          type: TransactionType.PAYMENT,
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
