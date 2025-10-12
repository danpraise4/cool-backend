/* eslint-disable @typescript-eslint/no-explicit-any */

import { endpoints } from "./flutterwave.endpoints";
import { IFlutterwaveBaseResponse } from "./flutterwave.interface";
import FlutterwaveUtil from "./flutterwave.utils";

export default class Flutterwave extends FlutterwaveUtil {
  constructor(build: { publicKey: string; secretKey: string }) {
    super(build);
  }

  async chargeCard(data: {
    [key: string]: any;
  }): Promise<IFlutterwaveBaseResponse<String>> {
    try {
      const response = await this.postRequest<
        { [key: string]: any },
        IFlutterwaveBaseResponse<String>
      >(this.buildHeader(), data, `${endpoints.CHARGE({ type: "card" })}`);

      console.log(response);

      if (response.status === "success") {
        return response;
      } else {
        throw new Error("Could not validate bvn");
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }

  // Get Bank Account Details
  async getBankAccountDetails(data: {
    [key: string]: any;
  }): Promise<IFlutterwaveBaseResponse<any>> {
    try {
      const response = await this.postRequest<
        { [key: string]: any },
        IFlutterwaveBaseResponse<any>
      >(this.buildHeader(), data, `${endpoints.BANK_ACCOUNT_DETAILS}`);

      return response;
    } catch (err: unknown) {
      console.log(err);
      throw new Error(err as string);
    }
  }

  // Transfer to Bank
  async transferToBank(data: {
    [key: string]: any;
  }): Promise<IFlutterwaveBaseResponse<any>> {
    try {
      const response = await this.postRequest<
        { [key: string]: any },
        IFlutterwaveBaseResponse<any>
      >(this.buildHeader(), data, `${endpoints.TRANSFER_TO_BANK}`);

      return response;
    } catch (err: unknown) {
      console.log(err);
      throw new Error(err as string);
    }
  }


  // Transfer to Bank
  async transferToBankUKUser(data: {
    [key: string]: any;
  }): Promise<IFlutterwaveBaseResponse<any>> {
    try {
      const response = await this.postRequest<
        { [key: string]: any },
        IFlutterwaveBaseResponse<any>
      >(this.buildHeader(), data, `${endpoints.TRANSFER_TO_BANK}`);

      return response;
    } catch (err: unknown) {
      console.log(err);
      throw new Error(err as string);
    }
  }

  // Get Banks List
  async getBanks(city: string): Promise<IFlutterwaveBaseResponse<any>> {
    try {
      const response = await this.getRequest<IFlutterwaveBaseResponse<any>>(
        this.buildHeader(),
        `${endpoints.BANKS(city)}`
      );

      return response;
    } catch (err: unknown) {
      console.log(err);
      throw new Error(err as string);
    }
  }

  // Charge Bank
  async chargeBank(data: {
    [key: string]: any;
  }): Promise<IFlutterwaveBaseResponse<any>> {
    try {
      const response = await this.postRequest<
        { [key: string]: any },
        IFlutterwaveBaseResponse<any>
      >(
        this.buildHeader(),
        data,
        `${endpoints.CHARGE({ type: "bank_transfer" })}`
      );

      if (response.status === "success") {
        return response;
      } else {
        throw new Error("Could not validate bvn");
      }
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error(err as string);
    }
  }
}
