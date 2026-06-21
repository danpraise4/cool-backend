import StatusCodes from "http-status";
import prismaClient from "../../infastructure/database/postgreSQL/connect";
import AppException from "../../infastructure/https/exception/app.exception";
import { RequestType } from "../../shared/helper/helper";
import { IFacilityData, IMaterialData } from "../../shared/services/admin/adminservice.interface";

export function pickRecycleTargetUserId(
  authUserId: string,
  requestedUserId?: string
): string {
  const trimmed = requestedUserId?.trim();
  if (!trimmed || trimmed === authUserId) {
    return authUserId;
  }
  return trimmed;
}

export function readRecycleTargetUserIdFromQuery(query: Record<string, unknown>): string | undefined {
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

export async function resolveRecycleTargetUserId(req: RequestType): Promise<string> {
  const authUserId = req.user?.id;

  if (!authUserId) {
    throw new AppException("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const targetUserId = pickRecycleTargetUserId(
    authUserId,
    readRecycleTargetUserIdFromQuery(req.query as Record<string, unknown>)
  );

  if (targetUserId === authUserId) {
    return authUserId;
  }

  const user = await prismaClient.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!user) {
    throw new AppException("User not found", StatusCodes.NOT_FOUND);
  }

  return targetUserId;
}

export function mapPublicMaterial(
  material: IMaterialData | { id: string | number; category?: string; icon?: string }
) {
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

export type RecycleScheduleEventDateInput = {
  completedAt?: Date | string | null;
  confirmedAt?: Date | string | null;
  dates?: Date[];
  updatedAt: Date | string;
};

/** Event date for analytics — UTC calendar year is derived from this value. */
export function getScheduleEventDate(schedule: RecycleScheduleEventDateInput): Date {
  if (schedule.completedAt) {
    return new Date(schedule.completedAt);
  }

  if (schedule.confirmedAt) {
    return new Date(schedule.confirmedAt);
  }

  if (schedule.dates?.[0]) {
    return new Date(schedule.dates[0]);
  }

  return new Date(schedule.updatedAt);
}

export function scheduleMatchesAnalyticsYear(
  schedule: RecycleScheduleEventDateInput,
  year: number
): boolean {
  return getScheduleEventDate(schedule).getUTCFullYear() === year;
}

export function parseAnalyticsYearQuery(
  year: unknown
): { ok: true; year?: number } | { ok: false; message: string } {
  if (year === undefined || year === null || year === "") {
    return { ok: true, year: undefined };
  }

  const rawYear = Array.isArray(year) ? year[0] : year;
  const yearNum = Number(rawYear);
  if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return { ok: false, message: "Invalid year" };
  }

  return { ok: true, year: yearNum };
}

export function filterSchedulesForAnalyticsYear<T extends RecycleScheduleEventDateInput>(
  schedules: T[],
  year?: number
): T[] {
  if (year === undefined) {
    return schedules;
  }

  return schedules.filter((schedule) => scheduleMatchesAnalyticsYear(schedule, year));
}

export function groupCompletedSchedulesByMaterial(
  schedules: { material: string }[]
): { material: string; _count: { id: number } }[] {
  const counts = new Map<string, number>();
  for (const schedule of schedules) {
    counts.set(schedule.material, (counts.get(schedule.material) ?? 0) + 1);
  }

  return [...counts.entries()].map(([material, count]) => ({
    material,
    _count: { id: count },
  }));
}

export function resolveAnalyticsMaterialLabel(row: {
  materialTitle?: string;
  material?: { title?: string; category?: string };
}): string {
  return (
    row.materialTitle?.trim() ||
    row.material?.title?.trim() ||
    row.material?.category?.trim() ||
    ""
  );
}

export function buildUserRecyclingAnalyticsRows(
  recyclingByMaterial: { material: string; _count: { id: number } }[],
  allMaterials: IMaterialData[]
) {
  const materialById = new Map<string, IMaterialData>();
  for (const material of allMaterials) {
    materialById.set(String(material.id), material);
    materialById.set(material.id.toString(), material);
  }

  const countMap = new Map(
    recyclingByMaterial.map((item) => [item.material, Math.max(0, item._count.id)])
  );

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
    if (a.recycleCount !== b.recycleCount) return b.recycleCount - a.recycleCount;
    return a.materialTitle.localeCompare(b.materialTitle);
  });

  return rows;
}

export function filterAnalyticsRowsForMobile<T extends { recycleCount: number }>(rows: T[]): T[] {
  const withActivity = rows.filter((row) => row.recycleCount > 0);
  return withActivity.length > 0 ? withActivity : [];
}

export function sumRecycleCounts(
  rows: { recycleCount: number }[]
): number {
  return rows.reduce((total, row) => total + Math.max(0, row.recycleCount), 0);
}

export function mapPublicFacility(facility: IFacilityData & {
  recyclingFee?: number;
  recyclingFeeCurrency?: string;
  reviewsCount?: number;
  images?: string[];
}) {
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

export function mapCompletedScheduleRow(input: {
  id: string;
  status: string;
  type: string;
  updatedAt: Date;
  userId: string;
  facilityId: string;
  materialId: string;
  quantity: number;
  dates: Date[];
  facility: ReturnType<typeof mapPublicFacility>;
  material: ReturnType<typeof mapPublicMaterial>;
}) {
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
