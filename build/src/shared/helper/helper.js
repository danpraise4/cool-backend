"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Helper = void 0;
const app_constants_1 = require("../config/app.constants");
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
class Helper {
    static generateRandomString(length = 32, type = app_constants_1.RANDOM_STRING_TYPE.ALPHA_NUM) {
        let result = "";
        let characters = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        switch (type) {
            case app_constants_1.RANDOM_STRING_TYPE.NUM:
                characters = "0123456789";
                break;
            case app_constants_1.RANDOM_STRING_TYPE.UPPER_NUM:
                characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789";
                break;
            case app_constants_1.RANDOM_STRING_TYPE.LOWER_NUM:
                characters = "abcdefghijklmnopqrstuvwxyz0123456789";
                break;
            case app_constants_1.RANDOM_STRING_TYPE.UPPER:
                characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                break;
            case app_constants_1.RANDOM_STRING_TYPE.LOWER:
                characters = "abcdefghijklmnopqrstuvwxyz";
                break;
            case app_constants_1.RANDOM_STRING_TYPE.ALPHA:
                characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
                break;
        }
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    static toDate(date_item) {
        if (typeof date_item === "string") {
            const [day, month, year] = date_item.split("-");
            const date = new Date(`${year}-${month}-${day}`);
            return date;
        }
        return date_item;
    }
    // Haversine formula to calculate distance in miles
    static getDistanceFromLatLonInMiles(lat1, lon1, lat2, lon2) {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 3958.8; // Radius of the earth in miles
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in miles
        return d;
    }
    static generateChatID(str1, str2) {
        const sortedStrings = [str1, str2].sort();
        const combined = sortedStrings.join("|");
        // Generate a hash from the combined string
        const hash = crypto_1.default.createHash("sha256").update(combined).digest("hex");
        // Return first 8 characters for a shorter unique ID
        return hash.substring(0, 8);
    }
    static generateOrderReference() {
        return `ORD-${Helper.generateRandomString(5, app_constants_1.RANDOM_STRING_TYPE.UPPER_NUM)}`;
    }
    static matchStatus(status) {
        switch (status) {
            case app_constants_1.RECYCLE_REQUEST_STATUS.Approved:
                return client_1.RecycleScheduleStatus.COMPLETED;
            case app_constants_1.RECYCLE_REQUEST_STATUS.Pending:
                return client_1.RecycleScheduleStatus.PENDING;
            case app_constants_1.RECYCLE_REQUEST_STATUS.Cancelled:
                return client_1.RecycleScheduleStatus.CANCELLED;
            case app_constants_1.RECYCLE_REQUEST_STATUS.Rejected:
                return client_1.RecycleScheduleStatus.CANCELLED;
            default:
                return client_1.RecycleScheduleStatus.PENDING;
        }
    }
}
exports.Helper = Helper;
