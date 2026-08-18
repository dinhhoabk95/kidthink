import { AppError, appError } from "@mindkid/auth";
import { createError, isError } from "h3";
import { describe, expect, it } from "vitest";

/**
 * `AppError` phải là H3Error hạng nhất để route KHÔNG cần try/catch chuyển đổi
 * lỗi domain sang lỗi HTTP. Hợp đồng này nằm giữa `packages/auth` (nơi định
 * nghĩa AppError, cố ý không phụ thuộc h3) và h3 v1 (nơi tiêu thụ), nên test
 * sống ở app — chỗ duy nhất có cả hai.
 *
 * Nếu h3 đổi duck-type `constructor.__h3_error__`, test đỏ ở đây thay vì đỏ
 * âm thầm ở hơn 200 route.
 */
describe("AppError là H3Error hạng nhất", () => {
  it("h3 isError() nhận AppError là lỗi HTTP", () => {
    expect(isError(appError("TIER_LOCKED"))).toBe(true);
  });

  it("phơi statusCode đúng HTTP status của mã lỗi", () => {
    expect(appError("TIER_LOCKED").statusCode).toBe(403);
    expect(appError("VALIDATION_FAILED").statusCode).toBe(422);
    expect(appError("NOT_FOUND").statusCode).toBe(404);
  });

  it("statusMessage là mã lỗi, không phải thông báo tiếng Việt (BR-ERR-06)", () => {
    const error = appError("TIER_LOCKED");

    expect(error.statusMessage).toBe("TIER_LOCKED");
    expect(error.statusMessage).not.toBe(error.message);
  });

  it("data là body ERROR-CODES §7.1 kèm details", () => {
    const error = appError("TIER_LOCKED", { access_tier: "premium" });

    expect(error.data).toEqual({
      code: "TIER_LOCKED",
      message: error.message,
      details: { access_tier: "premium" },
    });
  });

  it("createError trả lại chính AppError, không bọc thêm lớp", () => {
    const error = appError("NO_ACTIVE_CHILD");

    expect(createError(error)).toBe(error);
  });

  it("vẫn là Error và AppError để instanceof cũ không vỡ", () => {
    const error = appError("UNAUTHENTICATED");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("ca âm: Error thường KHÔNG được h3 nhận là lỗi HTTP", () => {
    expect(isError(new Error("lỗi lập trình"))).toBe(false);
  });

  it("ca âm: mã ngoài registry rơi về 500, không im lặng thành 200", () => {
    const error = new AppError(
      "MA_KHONG_TON_TAI" as Parameters<typeof appError>[0]
    );

    expect(error.statusCode).toBe(500);
  });
});
