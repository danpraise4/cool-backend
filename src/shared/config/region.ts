import { Currency } from "@prisma/client";

/**
 * Canonical city slugs that map to supported regions.
 * Add new entries here when a new city is onboarded — nothing else needs to change.
 */
const REGIONS = {
  lagos: {
    currency: Currency.NGN,
    country: "Nigeria",
    countryCode: "NG",
    flutterwaveBankCode: "NG",
  },
  luton: {
    currency: Currency.GBP,
    country: "UK",
    countryCode: "GB",
    flutterwaveBankCode: "GB",
  },
} as const;

type RegionKey = keyof typeof REGIONS;

const DEFAULT_REGION = {
  currency: Currency.EUR,
  country: "UK",
  countryCode: "GB",
  flutterwaveBankCode: "GB",
} as const;

function getRegion(cityOfResidence: string | null | undefined) {
  const key = (cityOfResidence ?? "").trim().toLowerCase() as RegionKey;
  return REGIONS[key] ?? DEFAULT_REGION;
}

/** Wallet currency derived from the user's city of residence. */
export function getCurrencyForCity(
  cityOfResidence: string | null | undefined
): Currency {
  return getRegion(cityOfResidence).currency;
}

/** ISO country name for address building. */
export function getCountryForCity(
  cityOfResidence: string | null | undefined
): string {
  return getRegion(cityOfResidence).country;
}

/** Flutterwave bank list country code (e.g. "NG", "GB"). */
export function getFlutterwaveBankCode(
  cityOfResidence: string | null | undefined
): string {
  return getRegion(cityOfResidence).flutterwaveBankCode;
}

/** True when the city maps to the NGN (Nigeria) region. */
export function isNigerianRegion(cityOfResidence: string | null | undefined): boolean {
  return getRegion(cityOfResidence).currency === Currency.NGN;
}
