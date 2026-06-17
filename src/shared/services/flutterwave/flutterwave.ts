/* eslint-disable @typescript-eslint/no-explicit-any */

import { endpoints } from "./flutterwave.endpoints";
import { CreateCardChargeInput, IFlutterwaveBaseResponse } from "./flutterwave.interface";
import FlutterwaveUtil from "./flutterwave.utils";

export default class Flutterwave extends FlutterwaveUtil {
  constructor(build: { publicKey: string; secretKey: string }) {
    super(build);
  }

  async createCardCharge(data: CreateCardChargeInput): Promise<IFlutterwaveBaseResponse<any>> {
    const response = await this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<string>>(
      this.buildHeader(),
      data,
      endpoints.CREATE_CARD_CHARGE
    );

    if (response.status !== "success") {
      throw new Error(response.message || "Payment link creation failed");
    }

    return response;
  }

  async chargeCard(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<string>> {
    const response = await this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<string>>(
      this.buildHeader(),
      data,
      endpoints.CHARGE({ type: "card" })
    );

    if (response.status !== "success") {
      throw new Error(response.message || "Card charge failed");
    }
    return response;
  }

  async getBankAccountDetails(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<any>> {
    return this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      data,
      endpoints.BANK_ACCOUNT_DETAILS
    );
  }

  async resolveUK(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<any>> {
    return this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      data,
      endpoints.RESOLVE_UK,
      "https://api.flutterwave.com/"
    );
  }

  async transferToBank(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<any>> {
    return this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      data,
      endpoints.TRANSFER_TO_BANK
    );
  }

  async transferToBankUKUser(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<any>> {
    return this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      data,
      endpoints.TRANSFER_TO_BANK
    );
  }

  async getBanks(city: string): Promise<IFlutterwaveBaseResponse<any>> {
    return this.getRequest<IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      endpoints.BANKS(city)
    );
  }

  async chargeBank(data: { [key: string]: any }): Promise<IFlutterwaveBaseResponse<any>> {
    const response = await this.postRequest<{ [key: string]: any }, IFlutterwaveBaseResponse<any>>(
      this.buildHeader(),
      data,
      endpoints.CHARGE({ type: "bank_transfer" })
    );

    if (response.status !== "success") {
      throw new Error(response.message || "Bank charge failed");
    }
    return response;
  }
}
