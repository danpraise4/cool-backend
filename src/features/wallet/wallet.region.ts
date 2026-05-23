import { Currency, User } from "@prisma/client";
import { getCurrencyForCity, getFlutterwaveBankCode } from "../../shared/config/region";

/** @deprecated Use getCurrencyForCity from shared/config/region directly. */
export function inferWalletCurrencyForNewUser(
  user: Pick<User, "cityOfResidence"> | null | undefined
): Currency {
  return getCurrencyForCity(user?.cityOfResidence);
}

/** @deprecated Use getFlutterwaveBankCode from shared/config/region directly. */
export function flutterwaveBankCountryCode(
  user: Pick<User, "cityOfResidence"> | null | undefined
): string {
  return getFlutterwaveBankCode(user?.cityOfResidence);
}
