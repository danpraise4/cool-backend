import assert from "node:assert/strict";
import { describe, it } from "node:test";
import httpStatus from "http-status";
import AppException from "../../infastructure/https/exception/app.exception";
import {
  assertOrderProductPresent,
  buildMaterialLabel,
  enrichOrderProduct,
  hasMaterialLabel,
} from "./market.order.utils";

const baseProduct = {
  id: "product-id",
  title: "Plastic Bottles",
  material: "material-id",
  images: ["https://example.com/image.png"],
};

describe("market order material payload", () => {
  it("returns product.material.title when material relation is resolved", () => {
    const product = enrichOrderProduct(baseProduct, {
      id: 12,
      title: "Plastic",
      category: "Plastic",
      icon: "plastic-icon",
    });

    assert.equal(product.material.title, "Plastic");
    assert.equal(product.material.category, "Plastic");
    assert.equal(product.materialTitle, "Plastic");
    assert.equal(product.materialId, "material-id");
  });

  it("returns non-empty product.materialTitle when material relation is missing", () => {
    const product = enrichOrderProduct(baseProduct, null);

    assert.equal(product.materialTitle, "material-id");
    assert.equal(product.materialId, "material-id");
    assert.equal(product.material.title, "material-id");
    assert.equal(product.material.category, "material-id");
  });

  it("uses materialTitle snapshot when relation is missing", () => {
    const product = enrichOrderProduct(baseProduct, null, "Glass");

    assert.equal(product.materialTitle, "Glass");
    assert.equal(product.material.title, "material-id");
  });

  it("ensures mixed order list rows always have a material label source", () => {
    const orders = [
      enrichOrderProduct(baseProduct, { id: 1, title: "Plastic", category: "Plastic" }),
      enrichOrderProduct(
        { ...baseProduct, id: "product-2", material: "deleted-material" },
        null,
        "Metal"
      ),
      enrichOrderProduct(
        { ...baseProduct, id: "product-3", material: "orphan-material" },
        null
      ),
    ];

    assert.ok(orders.every(hasMaterialLabel));
  });

  it("contract: enriched product always includes product, images array, and material label", () => {
    const product = enrichOrderProduct({ ...baseProduct, images: null }, null);

    assert.ok(product.id);
    assert.ok(Array.isArray(product.images));
    assert.ok(product.materialTitle);
    assert.ok(product.material.title);
    assert.ok(product.material.category);
  });

  it("throws when order product is missing", () => {
    assert.throws(
      () => assertOrderProductPresent(null, "order-id"),
      (error: unknown) =>
        error instanceof AppException &&
        error.statusCode === httpStatus.INTERNAL_SERVER_ERROR
    );
  });

  it("buildMaterialLabel falls back to category when title is absent", () => {
    const material = buildMaterialLabel({ id: 3, category: "Paper" }, "fallback-id");

    assert.equal(material.title, "Paper");
    assert.equal(material.category, "Paper");
  });
});

describe("market cart material payload", () => {
  it("cart with populated material relation includes product.material.category", () => {
    const cartItem = {
      id: "cart-1",
      createdAt: new Date("2026-06-16T10:00:00.000Z"),
      product: enrichOrderProduct(baseProduct, {
        id: "material-uuid",
        title: "Plastic",
        category: "Plastic",
      }),
    };

    assert.equal(cartItem.product.material.category, "Plastic");
    assert.equal(cartItem.product.materialId, "material-id");
  });

  it("cart with missing material relation still includes product.materialTitle", () => {
    const cartItem = {
      id: "cart-2",
      createdAt: new Date("2026-06-16T10:00:00.000Z"),
      product: enrichOrderProduct(baseProduct, null),
    };

    assert.equal(cartItem.product.materialTitle, "material-id");
    assert.ok(hasMaterialLabel(cartItem.product));
  });

  it("cart product id stays stable for toggle and check endpoints", () => {
    const productId = "product-id";
    const product = enrichOrderProduct({ ...baseProduct, id: productId }, {
      id: "material-uuid",
      title: "Plastic",
      category: "Plastic",
    });

    assert.equal(product.id, productId);
    assert.equal(product.materialId, "material-id");
  });

  it("contract: every cart product has a material label source", () => {
    const cartProducts = [
      enrichOrderProduct(baseProduct, { id: 1, title: "Plastic", category: "Plastic" }),
      enrichOrderProduct(
        { ...baseProduct, id: "product-2", material: "deleted-material" },
        null,
        "Glass"
      ),
    ];

    assert.ok(cartProducts.every(hasMaterialLabel));
    assert.ok(cartProducts.every((product) => Array.isArray(product.images)));
  });
});
