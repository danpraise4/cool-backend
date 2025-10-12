import { convertToObjT, ObjT } from "./flutterwave.utils";

const baseUrl = "https://api.flutterwave.com/v3";
const endpoints = Object.freeze({
  CHARGE: (params: ObjT): string => `/charges/?${convertToObjT(params)}`,
  BANKS: (country: string): string => `/banks/${country}`,
  BANK_ACCOUNT_DETAILS: `/accounts/resolve`,
  TRANSFER_TO_BANK: `/transfers`,
});

export { baseUrl, endpoints };
