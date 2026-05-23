import fetch from "node-fetch";
import { baseUrl } from "./flutterwave.endpoints";

export interface ObjT {
  [key: string]: string;
}

export const convertToObjT = (params: ObjT): string =>
  Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");

export default class FlutterwaveUtil {
  publicKey: string;
  secretKey: string;

  constructor(build: { publicKey: string; secretKey: string }) {
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

  async postRequest<T, K>(
    headers: ObjT,
    jsonData: T,
    url: string,
    baseUL?: string
  ): Promise<K> {
    const res = await fetch(`${baseUL || baseUrl}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonData),
      timeout: 10000,
    });

    const respStr = await res.text();

    let resp: { status?: string; message?: string };
    try {
      resp = JSON.parse(respStr);
    } catch {
      throw new Error("Invalid JSON response from Flutterwave");
    }

    if (resp.status === "error") {
      throw new Error(resp.message || "Flutterwave request failed");
    }

    return resp as K;
  }

  async getRequest<T>(headers: ObjT, url: string): Promise<T> {
    const res = await fetch(`${baseUrl}${url}`, {
      method: "GET",
      headers,
      timeout: 10000,
    });

    const respStr = await res.text();

    let resp: { status?: string; message?: string };
    try {
      resp = JSON.parse(respStr);
    } catch {
      throw new Error("Invalid JSON response from Flutterwave");
    }

    if (resp.status === "error") {
      throw new Error(resp.message || "Flutterwave request failed");
    }

    return resp as T;
  }
}
