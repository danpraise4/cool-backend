import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  enrichProductListing,
  enrichUserWithRating,
  formatUserRating,
} from "./rating.service";

describe("user rating display helpers", () => {
  it("formats zero rating for users without reviews", () => {
    const payload = formatUserRating({ averageRating: 0, ratingCount: 0 });
    assert.equal(payload.rating, 0);
    assert.equal(payload.reviewCount, 0);
  });

  it("rounds average to one decimal", () => {
    const payload = formatUserRating({ averageRating: 4.666, ratingCount: 3 });
    assert.equal(payload.rating, 4.7);
    assert.equal(payload.reviewCount, 3);
  });

  it("enriches product listing with seller rating fields", () => {
    const product = enrichProductListing({
      id: "product-1",
      title: "Bottles",
      createdBy: {
        id: "seller-1",
        firstName: "Jane",
        lastName: "Doe",
        image: null,
        phone: "080",
        averageRating: 4.5,
        ratingCount: 2,
      },
    });

    assert.equal(product.rating, 4.5);
    assert.equal(product.sellerRating, 4.5);
    assert.equal(product.createdBy?.rating, 4.5);
    assert.equal(product.createdBy?.reviewCount, 2);
  });

  it("enriches user profile with reviewCount alias", () => {
    const user = enrichUserWithRating({
      id: "user-1",
      firstName: "Alex",
      averageRating: 3,
      ratingCount: 1,
    });

    assert.equal(user.rating, 3);
    assert.equal(user.reviewCount, 1);
  });
});
