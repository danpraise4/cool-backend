"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrencyForCity = getCurrencyForCity;
exports.getCountryForCity = getCountryForCity;
exports.getFlutterwaveBankCode = getFlutterwaveBankCode;
exports.isNigerianRegion = isNigerianRegion;
const client_1 = require("@prisma/client");
/**
 * Canonical city slugs that map to supported regions.
 * Add new entries here when a new city is onboarded — nothing else needs to change.
 */
const REGIONS = {
    lagos: {
        currency: client_1.Currency.NGN,
        country: "Nigeria",
        countryCode: "NG",
        flutterwaveBankCode: "NG",
    },
    luton: {
        currency: client_1.Currency.GBP,
        country: "UK",
        countryCode: "GB",
        flutterwaveBankCode: "GB",
    },
};
const DEFAULT_REGION = {
    currency: client_1.Currency.EUR,
    country: "UK",
    countryCode: "GB",
    flutterwaveBankCode: "GB",
};
function getRegion(cityOfResidence) {
    const key = (cityOfResidence ?? "").trim().toLowerCase();
    return REGIONS[key] ?? DEFAULT_REGION;
}
/** Wallet currency derived from the user's city of residence. */
function getCurrencyForCity(cityOfResidence) {
    return getRegion(cityOfResidence).currency;
}
/** ISO country name for address building. */
function getCountryForCity(cityOfResidence) {
    return getRegion(cityOfResidence).country;
}
/** Flutterwave bank list country code (e.g. "NG", "GB"). */
function getFlutterwaveBankCode(cityOfResidence) {
    return getRegion(cityOfResidence).flutterwaveBankCode;
}
/** True when the city maps to the NGN (Nigeria) region. */
function isNigerianRegion(cityOfResidence) {
    return getRegion(cityOfResidence).currency === client_1.Currency.NGN;
}
