import { convertToObjT, ObjT } from "./adminservice.utils";

const baseUrl = "https://recycool-api-stg.azurewebsites.net";

const endpoints = Object.freeze({
  // CHARGE: (params: ObjT): string => `/charges/?${convertToObjT(params)}`,
  // BANKS: (country: string): string => `/banks/${country}`,
  // BANK_ACCOUNT_DETAILS: `/accounts/resolve`,
  GET_FACILITIES: (params: ObjT): string =>
    `/facility/facilities?${convertToObjT(params)}`,
  GET_FACILITY_BY_ID: (id: string): string => `/facility/${id}`,
  GET_MATERIAL_CATEGORIES: (): string => `/settings/material-categories`,

  CREATE_RECYCLE_REQUEST: `/recyclers/recycle`,
  PATCH_RECYCLE_REQUEST: (id: string): string => `/recyclers/transaction/${id}`,
  // GET_RECYCLE_REQUEST_BY_ID: (config: {recyclerId: string, transactionId: string}): string => '',
});

export { baseUrl, endpoints };
