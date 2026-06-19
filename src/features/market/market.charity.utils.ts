import { ResolvedMaterial, enrichOrderProduct } from "./market.order.utils";
import { enrichUserWithRating } from "../user/rating.service";

export type CharityHistoryRole = "DONATED" | "RECEIVED";

export type CharityHistoryUser = {
  id: string;
  firstName: string;
  lastName: string;
  image: string | null;
  averageRating?: number | null;
  ratingCount?: number | null;
  rating?: number;
  reviewCount?: number;
};

export type CharityHistoryItem = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  status: string;
  isSold: boolean;
  userId: string;
  soldToId: string | null;
  confirmedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  materialId: string;
  materialTitle: string;
  material: ResolvedMaterial;
  historyRole: CharityHistoryRole;
  createdBy: CharityHistoryUser;
  receivedBy: CharityHistoryUser | null;
};

type CharityHistoryProduct = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  status: string;
  isSold: boolean;
  userId: string;
  soldToId: string | null;
  confirmedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  material: string;
  createdBy: CharityHistoryUser;
  soldTo: CharityHistoryUser | null;
};

export function mapCharityHistoryItem(
  product: CharityHistoryProduct,
  historyRole: CharityHistoryRole,
  resolvedMaterial: ResolvedMaterial | null
): CharityHistoryItem {
  const enriched = enrichOrderProduct(product, resolvedMaterial);

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    status: product.status,
    isSold: product.isSold,
    userId: product.userId,
    soldToId: product.soldToId,
    confirmedAt: product.confirmedAt,
    soldAt: product.soldAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: enriched.images,
    materialId: enriched.materialId,
    materialTitle: enriched.materialTitle,
    material: enriched.material,
    historyRole,
    createdBy: enrichUserWithRating(product.createdBy),
    receivedBy: product.soldTo ? enrichUserWithRating(product.soldTo) : null,
  };
}

export function sortCharityHistoryItems<T extends { confirmedAt?: Date | null; soldAt?: Date | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aTime = (a.confirmedAt ?? a.soldAt)?.getTime() ?? 0;
    const bTime = (b.confirmedAt ?? b.soldAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function parseCharityHistoryScope(scope?: string): "all" | "donated" | "received" {
  const value = scope?.trim().toLowerCase();

  if (value === "donated") return "donated";
  if (value === "received") return "received";
  return "all";
}
