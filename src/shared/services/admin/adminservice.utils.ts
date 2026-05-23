import fetch from "node-fetch";
import { baseUrl } from "./adminservice.endpoints";

/** Thrown when the Admin API returns an error (4xx/5xx or non-JSON). Callers can use statusCode to decide retry (e.g. don't retry on 4xx). */
export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AdminApiError";
    Object.setPrototypeOf(this, AdminApiError.prototype);
  }
}

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
    const data = await fetch(`${baseUrl}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(jsonData),
      timeout: 10000,
    });

    const respStr = await data.text();

    if (!data.ok) {
      const preview = respStr.trim().slice(0, 100);
      throw new AdminApiError(
        `Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`,
        data.status,
      );
    }

    const trimmed = respStr.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new AdminApiError(
        `Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${baseUrl}${url}`,
        data.status,
      );
    }

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

    if (!data.ok) {
      const preview = respStr.trim().slice(0, 100);
      throw new AdminApiError(
        `Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`,
        data.status,
      );
    }

    const trimmed = respStr.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new AdminApiError(
        `Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${baseUrl}${url}`,
        data.status,
      );
    }

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

    if (!data.ok) {
      const preview = respStr.trim().slice(0, 100);
      throw new AdminApiError(
        `Admin API error ${data.status} ${data.statusText}: ${preview}${respStr.length > 100 ? "..." : ""}`,
        data.status,
      );
    }

    const trimmed = respStr.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new AdminApiError(
        `Admin API returned non-JSON (e.g. HTML). Status: ${data.status}. URL: ${baseUrl}${url}`,
        data.status,
      );
    }

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
