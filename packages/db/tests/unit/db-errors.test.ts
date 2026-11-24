import { describe, expect, it } from "vitest";
import { isUniqueConstraintError } from "#src/db-errors";

function sqliteError(message: string, errcode: number): Error {
  return Object.assign(new Error(message), {
    code: "ERR_SQLITE_ERROR",
    errcode,
    errstr: "constraint failed",
  });
}

describe("isUniqueConstraintError (BR-ERR-03)", () => {
  it("nhận lỗi node:sqlite UNIQUE (2067) và PRIMARY KEY (1555)", () => {
    expect(
      isUniqueConstraintError(
        sqliteError("UNIQUE constraint failed: users.uuid", 2067)
      )
    ).toBe(true);
    expect(
      isUniqueConstraintError(
        sqliteError("UNIQUE constraint failed: users.id", 1555)
      )
    ).toBe(true);
  });

  it("nhận lỗi D1 chỉ có message, kể cả khi nằm ở cause", () => {
    const wrapped = new Error("Failed query", {
      cause: new Error(
        "D1_ERROR: UNIQUE constraint failed: payment_orders.user_id"
      ),
    });
    expect(isUniqueConstraintError(wrapped)).toBe(true);
  });

  it("không nhận mã Postgres 23505 hay lỗi ràng buộc khác", () => {
    expect(
      isUniqueConstraintError(
        Object.assign(new Error("dup"), { code: "23505" })
      )
    ).toBe(false);
    expect(
      isUniqueConstraintError(
        sqliteError("NOT NULL constraint failed: users.email", 1299)
      )
    ).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
  });

  it("columns giới hạn đúng ràng buộc", () => {
    const err = sqliteError(
      "UNIQUE constraint failed: payment_orders.user_id, payment_orders.package_code",
      2067
    );
    expect(
      isUniqueConstraintError(err, [
        "payment_orders.user_id",
        "payment_orders.package_code",
      ])
    ).toBe(true);
    expect(isUniqueConstraintError(err, ["entitlements.user_id"])).toBe(false);
  });

  it("dừng sau 5 tầng cause", () => {
    let node: Error = sqliteError("UNIQUE constraint failed: a.b", 2067);
    for (let i = 0; i < 6; i++) {
      node = new Error("wrap", { cause: node });
    }
    expect(isUniqueConstraintError(node)).toBe(false);
  });
});
