"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferWalletCurrencyForNewUser = inferWalletCurrencyForNewUser;
exports.flutterwaveBankCountryCode = flutterwaveBankCountryCode;
const region_1 = require("../../shared/config/region");
/** @deprecated Use getCurrencyForCity from shared/config/region directly. */
function inferWalletCurrencyForNewUser(user) {
    return (0, region_1.getCurrencyForCity)(user?.cityOfResidence);
}
/** @deprecated Use getFlutterwaveBankCode from shared/config/region directly. */
function flutterwaveBankCountryCode(user) {
    return (0, region_1.getFlutterwaveBankCode)(user?.cityOfResidence);
}
