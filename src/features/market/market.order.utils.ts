import httpStatus from "http-status";
import AppException from "../../infastructure/https/exception/app.exception";

export type ResolvedMaterial = {
  id: string | number;
  title: string;
  category: string;
  icon?: string;
};

export type OrderProductInput = {
  id: string;
  title: string;
  material: string;
  images?: string[] | null;
  [key: string]: unknown;
};

export type EnrichedOrderProduct = Omit<OrderProductInput, "material"> & {
  material: ResolvedMaterial;
  materialTitle: string;
  images: string[];
};

export function buildMaterialLabel(
  material: Partial<ResolvedMaterial> | null | undefined,
  fallbackMaterialId?: string
): ResolvedMaterial {
  const category = material?.category?.trim();
  const title = material?.title?.trim() || category;

  if (title) {
    return {
      id: material?.id ?? fallbackMaterialId ?? "unknown",
      title,
      category: category || title,
      ...(material?.icon ? { icon: material.icon } : {}),
    };
  }

  const fallback = fallbackMaterialId?.trim() || "Unknown";
  return { id: fallback, title: fallback, category: fallback };
}

export function enrichOrderProduct(
  product: OrderProductInput,
  resolvedMaterial: Partial<ResolvedMaterial> | null | undefined,
  materialTitleSnapshot?: string | null
): EnrichedOrderProduct {
  const { material: materialId, ...rest } = product;
  const material = buildMaterialLabel(resolvedMaterial, materialId);
  const materialTitle =
    materialTitleSnapshot?.trim() || material.title || material.category;

  return {
    ...rest,
    images: product.images ?? [],
    material,
    materialTitle,
  };
}

export function assertOrderProductPresent(
  product: unknown,
  orderId: string
): asserts product is OrderProductInput {
  if (!product || typeof product !== "object") {
    throw new AppException(
      `Order ${orderId} is missing product data`,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export function hasMaterialLabel(product: EnrichedOrderProduct): boolean {
  const materialTitle = product.materialTitle?.trim();
  const relationTitle = product.material?.title?.trim();
  const relationCategory = product.material?.category?.trim();
  return Boolean(materialTitle || relationTitle || relationCategory);
}

export function mapAdminMaterialPayload(payload: {
  id: number;
  category: string;
  icon: string;
}): ResolvedMaterial {
  return {
    id: payload.id,
    title: payload.category,
    category: payload.category,
    icon: payload.icon,
  };
}
