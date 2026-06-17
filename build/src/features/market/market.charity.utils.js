"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCharityHistoryItem = mapCharityHistoryItem;
exports.sortCharityHistoryItems = sortCharityHistoryItems;
exports.parseCharityHistoryScope = parseCharityHistoryScope;
const market_order_utils_1 = require("./market.order.utils");
function mapCharityHistoryItem(product, historyRole, resolvedMaterial) {
    const enriched = (0, market_order_utils_1.enrichOrderProduct)(product, resolvedMaterial);
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
        createdBy: product.createdBy,
        receivedBy: product.soldTo,
    };
}
function sortCharityHistoryItems(items) {
    return [...items].sort((a, b) => {
        const aTime = (a.confirmedAt ?? a.soldAt)?.getTime() ?? 0;
        const bTime = (b.confirmedAt ?? b.soldAt)?.getTime() ?? 0;
        return bTime - aTime;
    });
}
function parseCharityHistoryScope(scope) {
    const value = scope?.trim().toLowerCase();
    if (value === "donated")
        return "donated";
    if (value === "received")
        return "received";
    return "all";
}
