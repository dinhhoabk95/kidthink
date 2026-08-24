import { describe, expect, it } from "vitest";
import { AppError } from "#src/errors";
import {
  ChildNotFoundError,
  isModelBoundError,
  LessonPlanNotFoundError,
  ModelNotFoundError,
  modelErrorContext,
  PlaySessionNotFoundError,
  ValidationError,
} from "#src/model-errors";

describe("ModelNotFoundError", () => {
  it("map sang NOT_FOUND 404 cho mọi model", () => {
    const error = new ChildNotFoundError("uuid-abc");

    expect(error).toBeInstanceOf(ModelNotFoundError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });

  it("giữ tên lớp riêng để đọc được trong log", () => {
    expect(new ChildNotFoundError().name).toBe("ChildNotFoundError");
    expect(new LessonPlanNotFoundError().name).toBe("LessonPlanNotFoundError");
  });

  it("thông báo là tiếng Việt hướng người dùng (BR-ERR-04)", () => {
    expect(new LessonPlanNotFoundError().message).toBe(
      "Không tìm thấy giáo án."
    );
  });

  it("ca âm: body KHÔNG chứa tên bảng hay id nội bộ (BR-ERR-03)", () => {
    const error = new ChildNotFoundError(4242);
    const body = JSON.stringify(error.toResponse());

    expect(body).not.toContain("child_profiles");
    expect(body).not.toContain("4242");
  });

  it("model và key chỉ lấy được qua ngữ cảnh log", () => {
    const error = new ChildNotFoundError(4242);

    expect(isModelBoundError(error)).toBe(true);
    expect(modelErrorContext(error)).toEqual({
      model: "child_profiles",
      key: 4242,
    });
  });

  it("phiên chơi dùng mã riêng SESSION_NOT_FOUND (§7.5)", () => {
    const error = new PlaySessionNotFoundError("sess-1");

    expect(error.code).toBe("SESSION_NOT_FOUND");
    expect(error.status).toBe(404);
    expect(isModelBoundError(error)).toBe(true);
  });

  it("ca âm: Error thường không phải lỗi gắn model", () => {
    expect(isModelBoundError(new Error("bất kỳ"))).toBe(false);
    expect(isModelBoundError(new ValidationError([]))).toBe(false);
  });
});

describe("ValidationError", () => {
  it("body luôn là details.fields[] (§7.7)", () => {
    const error = new ValidationError([
      { path: "birth_year", message: "Năm sinh không hợp lệ." },
    ]);

    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.status).toBe(422);
    expect(error.toResponse()).toEqual({
      code: "VALIDATION_FAILED",
      message: error.message,
      details: {
        fields: [{ path: "birth_year", message: "Năm sinh không hợp lệ." }],
      },
    });
  });

  it("ValidationError.field dựng lỗi một trường", () => {
    const error = ValidationError.field("email", "Email không hợp lệ.");

    expect(error.fields).toEqual([
      { path: "email", message: "Email không hợp lệ." },
    ]);
  });
});
