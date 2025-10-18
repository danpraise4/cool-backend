import fetch from "node-fetch";
import { baseUrl } from "./flutterwave.endpoints";
// import axios from 'axios';

export interface ObjT {
  [key: string]: string;
}

export const convertToObjT = (params: ObjT) => {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
};

export default class FlutterwaveUtil {
  publicKey: string;
  secretKey: string;

  
  constructor(build: {
    publicKey: string;
    secretKey: string;
  }) {
    this.publicKey = build.publicKey;
    this.secretKey = build.secretKey;
  }


  buildHeader(): ObjT {
    return {
      "Content-type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.secretKey}`,
    };
  }
  async postRequest<T, K>(headers: ObjT, jsonData: T, url: string , baseUL?: string): Promise<K> {

    const data = await fetch(`${baseUL || baseUrl}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonData),
      timeout: 10000,
    });

    const respStr = await data.text();

    console.log(respStr);
    let resp;
    try {
      resp = JSON.parse(respStr);
      if (resp.status === "error") {
        throw new Error(resp.message || "Request failed");
      }
      return resp as K;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Invalid response format");
    }
  }

  async getRequest<T>(headers: ObjT, url: string): Promise<T> {
    const data = await fetch(`${baseUrl}${url}`, {
      method: "GET", 
      headers,
      timeout: 10000,
    });
    const respStr = await data.text();
    let resp;
    try {
      resp = JSON.parse(respStr);
      if (resp.status === "error") {
        throw new Error(resp.message || "Request failed");
      }
      return resp as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Invalid response format");
    }
  }
}
