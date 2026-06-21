import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildUserRecyclingAnalyticsRows,
  filterAnalyticsRowsForMobile,
  filterSchedulesForAnalyticsYear,
  getScheduleEventDate,
  groupCompletedSchedulesByMaterial,
  parseAnalyticsYearQuery,
  scheduleMatchesAnalyticsYear,
  sumRecycleCounts,
} from "./recycle.public.utils";

const PLASTIC = "plastic-id";
const GLASS = "glass-id";

const multiYearSchedules = [
  {
    material: PLASTIC,
    dates: [new Date("2024-08-15T10:00:00.000Z")],
    updatedAt: new Date("2024-08-16T10:00:00.000Z"),
  },
  {
    material: PLASTIC,
    dates: [new Date("2025-03-10T10:00:00.000Z")],
    updatedAt: new Date("2025-03-12T14:00:00.000Z"),
  },
  {
    material: GLASS,
    dates: [new Date("2025-11-01T10:00:00.000Z")],
    updatedAt: new Date("2025-11-02T10:00:00.000Z"),
  },
  {
    material: GLASS,
    dates: [new Date("2026-01-20T10:00:00.000Z")],
    updatedAt: new Date("2026-01-21T10:00:00.000Z"),
  },
];

function analyticsCounts(
  schedules: typeof multiYearSchedules,
  year?: number,
  materials = [
    { id: PLASTIC, category: "Plastic", icon: "plastic.png" },
    { id: GLASS, category: "Glass", icon: "glass.png" },
  ]
) {
  const filtered = filterSchedulesForAnalyticsYear(schedules, year);
  const grouped = groupCompletedSchedulesByMaterial(filtered);
  const rows = filterAnalyticsRowsForMobile(
    buildUserRecyclingAnalyticsRows(grouped, materials)
  );

  return Object.fromEntries(rows.map((row) => [row.materialTitle, row.recycleCount]));
}

describe("recycle analytics year filter", () => {
  it("parses valid year query params", () => {
    const result = parseAnalyticsYearQuery("2026");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.year, 2026);
    }
  });

  it("treats omitted year as all-time", () => {
    const result = parseAnalyticsYearQuery(undefined);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.year, undefined);
    }
  });

  it("rejects invalid year values", () => {
    const result = parseAnalyticsYearQuery("abc");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, "Invalid year");
    }
  });

  it("uses dates[0] before updatedAt (matches mobile fallback)", () => {
    const schedule = {
      dates: [new Date("2024-08-15T10:00:00.000Z")],
      updatedAt: new Date("2025-03-12T14:00:00.000Z"),
    };

    assert.equal(getScheduleEventDate(schedule).toISOString(), "2024-08-15T10:00:00.000Z");
    assert.equal(scheduleMatchesAnalyticsYear(schedule, 2024), true);
    assert.equal(scheduleMatchesAnalyticsYear(schedule, 2025), false);
  });

  it("falls back to updatedAt when dates are missing", () => {
    const schedule = {
      dates: [],
      updatedAt: new Date("2025-03-12T14:00:00.000Z"),
    };

    assert.equal(scheduleMatchesAnalyticsYear(schedule, 2025), true);
    assert.equal(scheduleMatchesAnalyticsYear(schedule, 2024), false);
  });

  it("filters by UTC calendar year", () => {
    assert.equal(
      scheduleMatchesAnalyticsYear(
        { dates: [new Date("2025-12-31T23:59:59.000Z")], updatedAt: new Date("2026-01-01T00:00:00.000Z") },
        2025
      ),
      true
    );
  });

  it("returns all-time totals when year is omitted", () => {
    assert.deepEqual(analyticsCounts(multiYearSchedules), {
      Plastic: 2,
      Glass: 2,
    });
  });

  it("returns year-specific totals for 2025", () => {
    assert.deepEqual(analyticsCounts(multiYearSchedules, 2025), {
      Plastic: 1,
      Glass: 1,
    });
  });

  it("returns empty analytics for years with no events", () => {
    assert.deepEqual(analyticsCounts(multiYearSchedules, 2020), {});
    assert.deepEqual(filterAnalyticsRowsForMobile([]), []);
  });

  it("year-filtered totals are less than or equal to all-time totals", () => {
    const overall = sumRecycleCounts(
      filterAnalyticsRowsForMobile(
        buildUserRecyclingAnalyticsRows(
          groupCompletedSchedulesByMaterial(multiYearSchedules),
          [{ id: PLASTIC, category: "Plastic", icon: "" }, { id: GLASS, category: "Glass", icon: "" }]
        )
      )
    );
    const year2025 = sumRecycleCounts(
      filterAnalyticsRowsForMobile(
        buildUserRecyclingAnalyticsRows(
          groupCompletedSchedulesByMaterial(filterSchedulesForAnalyticsYear(multiYearSchedules, 2025)),
          [{ id: PLASTIC, category: "Plastic", icon: "" }, { id: GLASS, category: "Glass", icon: "" }]
        )
      )
    );

    assert.equal(overall, 4);
    assert.equal(year2025, 2);
    assert.ok(year2025 <= overall);
  });
});
