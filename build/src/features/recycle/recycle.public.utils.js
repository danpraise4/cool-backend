"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickRecycleTargetUserId = pickRecycleTargetUserId;
exports.readRecycleTargetUserIdFromQuery = readRecycleTargetUserIdFromQuery;
exports.resolveRecycleTargetUserId = resolveRecycleTargetUserId;
exports.mapPublicMaterial = mapPublicMaterial;
exports.resolveAnalyticsMaterialLabel = resolveAnalyticsMaterialLabel;
exports.buildUserRecyclingAnalyticsRows = buildUserRecyclingAnalyticsRows;
exports.filterAnalyticsRowsForMobile = filterAnalyticsRowsForMobile;
exports.sumRecycleCounts = sumRecycleCounts;
exports.mapPublicFacility = mapPublicFacility;
exports.mapCompletedScheduleRow = mapCompletedScheduleRow;
const http_status_1 = __importDefault(require("http-status"));
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
function pickRecycleTargetUserId(authUserId, requestedUserId) {
    const trimmed = requestedUserId?.trim();
    if (!trimmed || trimmed === authUserId) {
        return authUserId;
    }
    return trimmed;
}
function readRecycleTargetUserIdFromQuery(query) {
    const userId = query.userId;
    const recyclerId = query.recyclerId;
    if (typeof userId === "string" && userId.trim()) {
        return userId;
    }
    if (typeof recyclerId === "string" && recyclerId.trim()) {
        return recyclerId;
    }
    return undefined;
}
async function resolveRecycleTargetUserId(req) {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new app_exception_1.default("Unauthorized", http_status_1.default.UNAUTHORIZED);
    }
    const targetUserId = pickRecycleTargetUserId(authUserId, readRecycleTargetUserIdFromQuery(req.query));
    if (targetUserId === authUserId) {
        return authUserId;
    }
    const user = await connect_1.default.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
    });
    if (!user) {
        throw new app_exception_1.default("User not found", http_status_1.default.NOT_FOUND);
    }
    return targetUserId;
}
function mapPublicMaterial(material) {
    const category = ("category" in material ? material.category : undefined)?.trim();
    const title = category || String(material.id);
    return {
        id: material.id,
        title,
        category: category || title,
        description: category || title,
        ...("icon" in material && material.icon ? { icon: material.icon } : {}),
    };
}
function resolveAnalyticsMaterialLabel(row) {
    return (row.materialTitle?.trim() ||
        row.material?.title?.trim() ||
        row.material?.category?.trim() ||
        "");
}
function buildUserRecyclingAnalyticsRows(recyclingByMaterial, allMaterials) {
    const materialById = new Map();
    for (const material of allMaterials) {
        materialById.set(String(material.id), material);
        materialById.set(material.id.toString(), material);
    }
    const countMap = new Map(recyclingByMaterial.map((item) => [item.material, Math.max(0, item._count.id)]));
    const countedMaterialIds = new Set(recyclingByMaterial.map((item) => item.material));
    const rows = [...countedMaterialIds].map((materialId) => {
        const catalogMaterial = materialById.get(materialId);
        const mapped = catalogMaterial
            ? mapPublicMaterial(catalogMaterial)
            : mapPublicMaterial({ id: materialId, category: materialId });
        return {
            materialId: String(materialId),
            materialTitle: mapped.title,
            recycleCount: countMap.get(materialId) ?? 0,
            material: mapped,
        };
    });
    for (const material of allMaterials) {
        const materialId = String(material.id);
        if (countedMaterialIds.has(materialId) || countedMaterialIds.has(material.id.toString())) {
            continue;
        }
        const mapped = mapPublicMaterial(material);
        rows.push({
            materialId,
            materialTitle: mapped.title,
            recycleCount: 0,
            material: mapped,
        });
    }
    rows.sort((a, b) => {
        if (a.recycleCount !== b.recycleCount)
            return b.recycleCount - a.recycleCount;
        return a.materialTitle.localeCompare(b.materialTitle);
    });
    return rows;
}
function filterAnalyticsRowsForMobile(rows) {
    const withActivity = rows.filter((row) => row.recycleCount > 0);
    return withActivity.length > 0 ? withActivity : [];
}
function sumRecycleCounts(rows) {
    return rows.reduce((total, row) => total + Math.max(0, row.recycleCount), 0);
}
function mapPublicFacility(facility) {
    const images = facility.images?.length
        ? facility.images
        : facility.profilePhoto
            ? [facility.profilePhoto]
            : [];
    return {
        id: facility.id,
        name: facility.name,
        profilePhoto: facility.profilePhoto || images[0] || "",
        images,
        recyclingFee: facility.recyclingFee ?? 0,
        recyclingFeeCurrency: facility.recyclingFeeCurrency ?? facility.currency,
        reviewsCount: facility.reviewsCount ?? 0,
    };
}
function mapCompletedScheduleRow(input) {
    return {
        id: input.id,
        status: input.status,
        type: input.type,
        updatedAt: input.updatedAt,
        userId: input.userId,
        facilityId: input.facilityId,
        materialId: input.materialId,
        quantity: input.quantity,
        dates: input.dates,
        facility: input.facility,
        material: input.material,
    };
}
