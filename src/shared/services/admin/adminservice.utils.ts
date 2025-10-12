import fetch from "node-fetch";
import { baseUrl } from "./adminservice.endpoints";

export interface ObjT {
  [key: string]: string;
}

export const convertToObjT = (params: ObjT) => {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
};

export default class AdminServiceUtil {
  constructor() {}

  buildHeader(): ObjT {
    return {
      "Content-type": "application/json",
      Accept: "application/json",
    };
  }
  async postRequest<T, K>(headers: ObjT, jsonData: T, url: string): Promise<K> {
    console.log(`${baseUrl}${url}`);
    const data = await fetch(`${baseUrl}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonData),
      timeout: 10000,
    });

    const respStr = await data.text();
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

  async patchRequest<T, K>(headers: ObjT, jsonData: T, url: string): Promise<K> {
    const data = await fetch(`${baseUrl}${url}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(jsonData),
      timeout: 10000,
    });

    const respStr = await data.text();
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
      timeout: 30000,
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
