import { describe, expect, it } from "vitest";
import {
  ApiError,
  getFieldErrors,
  isApiError,
  isApiErrorCode,
  normalizeApiError,
} from "#src/client";

describe("client error helpers (BR-AEC-01, BR-AEC-03, BR-AEC-05)", () => {
  it("normalizeApiError: chuẩn hóa response data có code và message", () => {
    const fetchErr = {
      status: 403,
      data: {
        code: "TIER_LOCKED",
        message: "Nội dung này thuộc gói cao hơn.",
        details: { access_tier: "premium" },
      },
    };

    const err = normalizeApiError(fetchErr);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("TIER_LOCKED");
    expect(err.message).toBe("Nội dung này thuộc gói cao hơn.");
    expect(err.statusCode).toBe(403);
    expect(err.details).toEqual({ access_tier: "premium" });
  });

  it("BR-AEC-05: normalizeApiError biến lỗi mạng thành mã client-only NETWORK_ERROR, không lộ chi tiết kỹ thuật", () => {
    const networkErr = new TypeError("Failed to fetch");
    const err = normalizeApiError(networkErr);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.statusCode).toBe(0);
    expect(err.message).toContain("kiểm tra đường truyền");
    expect(err.message).not.toContain("TypeError");
  });

  it("BR-AEC-01: isApiError và isApiErrorCode nhận diện đúng và lọc theo mã lỗi", () => {
    const err = new ApiError({
      code: "CONSENT_REQUIRED",
      message: "Cần đồng ý",
      statusCode: 403,
    });

    expect(isApiError(err)).toBe(true);
    expect(isApiError(err, "CONSENT_REQUIRED")).toBe(true);
    expect(isApiError(err, "UNAUTHENTICATED")).toBe(false);
    expect(isApiError(new Error("khác"))).toBe(false);

    expect(isApiErrorCode(err, "CONSENT_REQUIRED")).toBe(true);
    expect(isApiErrorCode(err, "QUOTA_EXCEEDED")).toBe(false);
    expect(isApiErrorCode(new Error("khác"), "CONSENT_REQUIRED")).toBe(false);

    const netErr = normalizeApiError(new TypeError("Failed to fetch"));
    expect(isApiErrorCode(netErr, "NETWORK_ERROR")).toBe(true);
  });

  it("BR-AEC-03: getFieldErrors trích xuất đúng danh sách lỗi validation theo trường", () => {
    const validationErr = {
      statusCode: 422,
      data: {
        code: "VALIDATION_FAILED",
        message: "Dữ liệu không hợp lệ.",
        details: {
          fields: [
            { field: "name", message: "Tên không được để trống" },
            { field: "age", message: "Tuổi từ 3 đến 6" },
          ],
        },
      },
    };

    const fields = getFieldErrors(validationErr);
    expect(fields).toHaveLength(2);
    expect(fields[0]).toEqual({
      field: "name",
      message: "Tên không được để trống",
    });
    expect(fields[1]).toEqual({ field: "age", message: "Tuổi từ 3 đến 6" });
  });

  it("BR-AEC-03: getFieldErrors trả mảng rỗng nếu không có details.fields", () => {
    const plainErr = {
      status: 404,
      data: { code: "NOT_FOUND", message: "Không tìm thấy" },
    };
    expect(getFieldErrors(plainErr)).toEqual([]);
  });
});
