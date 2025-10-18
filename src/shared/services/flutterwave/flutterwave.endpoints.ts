import { convertToObjT, ObjT } from "./flutterwave.utils";

const baseUrl = "https://api.flutterwave.com/v3";
const endpoints = Object.freeze({
  CHARGE: (params: ObjT): string => `/charges/?${convertToObjT(params)}`,
  BANKS: (country: string): string => `/banks/${country}`,
  BANK_ACCOUNT_DETAILS: `/accounts/resolve`,
  TRANSFER_TO_BANK: `/transfers`,
  RESOLVE_UK: `/banks/account-resolve`,
});

export { baseUrl, endpoints };
