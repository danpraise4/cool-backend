export interface AdminServiceBaseResponse<T> {
  isOk: boolean;
  message: string;
  statusCode: number;
  payload: T;
}

export type IAdminServiceFacility = AdminServiceBaseResponse<{
  items: IFacilityData[];
}>;
export type IAdminServiceMaterials = AdminServiceBaseResponse<IMaterialData[]>;
export type IAdminServiceFacilityById = AdminServiceBaseResponse<IFacilityData>;
export type IAdminServiceMaterialById = AdminServiceBaseResponse<IMaterialData>;

export interface IFacilityData {
  id: string;
  name: string;
  rating: number;
  profilePhoto: string;
  address?: string;
  currency: string;
  workingDays: string[];
  materialUnitPrice: {
    id: number;
    category: string;
    icon: string;
    unit: string;
    abbr: string | null;
    price: {
      currency: string;
      amount: number;
    };
  }[];
  distanceInMiles: number;
}

export interface IMaterialData {
  id: number;
  category: string;
  icon: string;
}

export interface IUpateRequest {
  recyclerAppId: string;
  collectionMethod: string | null;
  quantity: number | null;
  scheduledCollectionDate: string | null;
  transactionStatus: number;
  note: string | null;
}

export interface ICreaterRequest {
  facilityId: string;
  recycler: {
    recyclerAppId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: {
      lineOne: string;
      lineTwo?: string | null;
      lineThree?: string | null;
      postCode: string;
      state: string;
      city: string;
      country: string;
    };
  };
  recycle: {
    collectionMethod: number;
    materialId: number;
    quantity: number;
    scheduledCollectionDate: string;
  };
}
