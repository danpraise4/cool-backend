import { Currency, User } from "@prisma/client";

/** Nigeria vs UK (Luton) flows — aligned with mobile-app map / signup city choices. */
export function inferWalletCurrencyForNewUser(
  user: Pick<User, "cityOfResidence"> | null | undefined
): Currency {
  const city = (user?.cityOfResidence || "").trim().toLowerCase();
  if (city === "lagos") return Currency.NGN;
  if (city === "luton") return Currency.GBP;
  return Currency.EUR;
}

/** Flutterwave bank list country code (NG / GB / US). */
export function flutterwaveBankCountryCode(
  user: Pick<User, "cityOfResidence"> | null | undefined
): string {
  const city = (user?.cityOfResidence || "").trim().toLowerCase();
  if (city === "lagos") return "NG";
  if (city === "luton") return "GB";
  return "US";
}
