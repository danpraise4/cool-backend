import { ProductType, Status } from "@prisma/client";

export interface IMarketCreateProduct {
  media?: string[];
  description: string;
  title: string;
  price?: number;
  material: any;
  type?: ProductType;
}

export interface IMarketUpdateProduct {
  title?: string;
  body?: string;
  price?: number;
  newImages?: string[];
  removeImages?: string[];
  status?: Status;
}
