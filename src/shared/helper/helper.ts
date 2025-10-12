import {
  RANDOM_STRING_TYPE,
  RECYCLE_REQUEST_STATUS,
} from "../config/app.constants";
import { Request } from "express";
import crypto from "crypto";
import { RecycleScheduleStatus } from "@prisma/client";

export type RequestType = {
  [prop: string]: any;
} & Request;

export class Helper {
  static generateRandomString(
    length = 32,
    type: RANDOM_STRING_TYPE = RANDOM_STRING_TYPE.ALPHA_NUM
  ): string {
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    switch (type) {
      case RANDOM_STRING_TYPE.NUM:
        characters = "0123456789";
        break;
      case RANDOM_STRING_TYPE.UPPER_NUM:
        characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789";
        break;
      case RANDOM_STRING_TYPE.LOWER_NUM:
        characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        break;
      case RANDOM_STRING_TYPE.UPPER:
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        break;
      case RANDOM_STRING_TYPE.LOWER:
        characters = "abcdefghijklmnopqrstuvwxyz";
        break;
      case RANDOM_STRING_TYPE.ALPHA:
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;
    }

    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static toDate(date_item: string | Date): Date {
    if (typeof date_item === "string") {
      const [day, month, year] = date_item.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      return date;
    }
    return date_item;
  }

  // Haversine formula to calculate distance in miles
  static getDistanceFromLatLonInMiles(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 3958.8; // Radius of the earth in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in miles
    return d;
  }

  static generateChatID(str1: string, str2: string): string {
    const sortedStrings = [str1, str2].sort();
    const combined = sortedStrings.join("|");

    // Generate a hash from the combined string
    const hash = crypto.createHash("sha256").update(combined).digest("hex");

    // Return first 8 characters for a shorter unique ID
    return hash.substring(0, 8);
  }
  static generateOrderReference(): string {
    return `ORD-${Helper.generateRandomString(
      5,
      RANDOM_STRING_TYPE.UPPER_NUM
    )}`;
  }

  static matchStatus(status: RECYCLE_REQUEST_STATUS): string {
    switch (status) {
      case RECYCLE_REQUEST_STATUS.Approved:
        return RecycleScheduleStatus.COMPLETED;
      case RECYCLE_REQUEST_STATUS.Pending:
        return RecycleScheduleStatus.PENDING;
      case RECYCLE_REQUEST_STATUS.Cancelled:
        return RecycleScheduleStatus.CANCELLED;
      case RECYCLE_REQUEST_STATUS.Rejected:
        return RecycleScheduleStatus.CANCELLED;
      default:
        return RecycleScheduleStatus.PENDING;
    }
  }
}
