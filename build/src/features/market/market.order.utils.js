"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMaterialLabel = buildMaterialLabel;
exports.enrichOrderProduct = enrichOrderProduct;
exports.assertOrderProductPresent = assertOrderProductPresent;
exports.hasMaterialLabel = hasMaterialLabel;
exports.mapAdminMaterialPayload = mapAdminMaterialPayload;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
function buildMaterialLabel(material, fallbackMaterialId) {
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
function enrichOrderProduct(product, resolvedMaterial, materialTitleSnapshot) {
    const { material: materialId, ...rest } = product;
    const material = buildMaterialLabel(resolvedMaterial, materialId);
    const materialTitle = materialTitleSnapshot?.trim() || material.title || material.category;
    return {
        ...rest,
        images: product.images ?? [],
        material,
        materialTitle,
    };
}
function assertOrderProductPresent(product, orderId) {
    if (!product || typeof product !== "object") {
        throw new app_exception_1.default(`Order ${orderId} is missing product data`, http_status_1.default.INTERNAL_SERVER_ERROR);
    }
}
function hasMaterialLabel(product) {
    const materialTitle = product.materialTitle?.trim();
    const relationTitle = product.material?.title?.trim();
    const relationCategory = product.material?.category?.trim();
    return Boolean(materialTitle || relationTitle || relationCategory);
}
function mapAdminMaterialPayload(payload) {
    return {
        id: payload.id,
        title: payload.category,
        category: payload.category,
        icon: payload.icon,
    };
}
