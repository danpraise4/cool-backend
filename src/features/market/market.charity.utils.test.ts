import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapCharityHistoryItem,
  parseCharityHistoryScope,
  sortCharityHistoryItems,
} from "./market.charity.utils";

const baseProduct = {
  id: "product-1",
  title: "Winter Jacket",
  description: "Warm jacket",
  price: 0,
  currency: "NGN",
  status: "APPROVED",
  isSold: true,
  userId: "giver-id",
  soldToId: "taker-id",
  confirmedAt: new Date("2026-06-16T15:40:00.000Z"),
  soldAt: new Date("2026-06-16T15:40:00.000Z"),
  createdAt: new Date("2026-06-10T10:00:00.000Z"),
  updatedAt: new Date("2026-06-16T15:40:00.000Z"),
  images: ["https://example.com/jacket.png"],
  material: "3",
  createdBy: {
    id: "giver-id",
    firstName: "Jane",
    lastName: "Donor",
    image: "https://example.com/giver.png",
  },
  soldTo: {
    id: "taker-id",
    firstName: "John",
    lastName: "Receiver",
    image: "https://example.com/taker.png",
  },
};

describe("charity history scope", () => {
  it("defaults to all when scope is omitted", () => {
    assert.equal(parseCharityHistoryScope(undefined), "all");
  });

  it("parses donated and received scopes", () => {
    assert.equal(parseCharityHistoryScope("donated"), "donated");
    assert.equal(parseCharityHistoryScope("received"), "received");
    assert.equal(parseCharityHistoryScope("all"), "all");
  });
});

describe("charity history payload", () => {
  it("maps donated rows with giver and recipient profiles", () => {
    const item = mapCharityHistoryItem(baseProduct, "DONATED", {
      id: 3,
      title: "Clothing",
      category: "Clothing",
      icon: "clothing-icon",
    });

    assert.equal(item.historyRole, "DONATED");
    assert.equal(item.userId, "giver-id");
    assert.equal(item.soldToId, "taker-id");
    assert.equal(item.createdBy.firstName, "Jane");
    assert.equal(item.receivedBy?.firstName, "John");
    assert.equal(item.material.category, "Clothing");
    assert.ok(item.images.length > 0);
  });

  it("maps received rows for taker history", () => {
    const item = mapCharityHistoryItem(baseProduct, "RECEIVED", {
      id: 3,
      title: "Clothing",
      category: "Clothing",
    });

    assert.equal(item.historyRole, "RECEIVED");
    assert.equal(item.soldToId, "taker-id");
  });

  it("sorts by confirmedAt or soldAt descending", () => {
    const sorted = sortCharityHistoryItems([
      { confirmedAt: new Date("2026-06-10T10:00:00.000Z"), soldAt: null },
      { confirmedAt: new Date("2026-06-16T15:40:00.000Z"), soldAt: null },
    ]);

    assert.equal(sorted[0].confirmedAt?.toISOString(), "2026-06-16T15:40:00.000Z");
  });
});
