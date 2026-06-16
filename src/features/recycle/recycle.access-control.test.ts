import assert from "node:assert/strict";
import { describe, it } from "node:test";
import StatusCodes from "http-status";
import AppException from "../../infastructure/https/exception/app.exception";
import { assertSelfScopeOnly } from "./recycle.controller";

type MockReq = {
  user: { id: string };
  query: Record<string, string | undefined>;
  ip?: string;
};

describe("recycle analytics access control", () => {
  it("allows self analytics request", () => {
    const req = {
      user: { id: "user-1" },
      query: { userId: "user-1" },
      ip: "127.0.0.1",
    } as unknown as MockReq;

    assert.doesNotThrow(() =>
      assertSelfScopeOnly(req as never, "GET /recycle/analytics")
    );
  });

  it("denies cross-user analytics request", () => {
    const req = {
      user: { id: "user-1" },
      query: { userId: "user-2" },
      ip: "127.0.0.1",
    } as unknown as MockReq;

    assert.throws(
      () => assertSelfScopeOnly(req as never, "GET /recycle/analytics"),
      (error: unknown) =>
        error instanceof AppException &&
        error.statusCode === StatusCodes.FORBIDDEN
    );
  });

  it("allows request without userId query", () => {
    const req = {
      user: { id: "user-1" },
      query: {},
      ip: "127.0.0.1",
    } as unknown as MockReq;

    assert.doesNotThrow(() =>
      assertSelfScopeOnly(req as never, "GET /recycle/completed")
    );
  });
});
