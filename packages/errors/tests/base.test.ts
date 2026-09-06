import { describe, expect, it } from "vitest";
import {
  AppError,
  classNameFromCode,
  DEFAULT_ERROR_STATUS,
  defineError,
  isAppError,
} from "#src/base";
import {
  defineModelNotFound,
  isModelBoundError,
  ModelNotFoundError,
  modelErrorContext,
  ValidationError,
} from "#src/model";

const AnyBusinessError = defineError({
  code: "SOME_BUSINESS_RULE_BROKEN",
  message: "Thao tác không hợp lệ.",
});

const TierLockedError = defineError<{ readonly access_tier: string }>({
  code: "TIER_LOCKED",
  message: "Nội dung này thuộc gói cao hơn.",
  status: 403,
});

describe("AppError — cấu trúc chung", () => {
  it("lớp không khai status thì nhận 400 mặc định", () => {
    const error = new AnyBusinessError();

    expect(error.status).toBe(DEFAULT_ERROR_STATUS);
    expect(error.status).toBe(400);
    expect(error.statusCode).toBe(400);
  });

  it("lớp khai status thì status đó thắng", () => {
    expect(new TierLockedError().status).toBe(403);
  });

  it("statusMessage là MÃ lỗi, không phải thông báo (BR-ERR-06)", () => {
    const error = new TierLockedError();

    expect(error.statusMessage).toBe("TIER_LOCKED");
    expect(error.statusMessage).not.toBe(error.message);
  });

  it("toResponse dựng đúng ba trường của §7.1", () => {
    const error = new TierLockedError({ access_tier: "premium" });

    expect(error.toResponse()).toEqual({
      code: "TIER_LOCKED",
      message: "Nội dung này thuộc gói cao hơn.",
      details: { access_tier: "premium" },
    });
  });

  it("không có details thì body không có khoá details", () => {
    expect(Object.keys(new AnyBusinessError().toResponse())).toEqual([
      "code",
      "message",
    ]);
  });

  it("getter data của H3Error trả đúng body §7.1", () => {
    const error = new TierLockedError({ access_tier: "premium" });

    expect(error.data).toEqual(error.toResponse());
  });

  it("khai cờ __h3_error__ để h3 nhận diện là H3Error", () => {
    expect(AppError.__h3_error__).toBe(true);
    expect(TierLockedError.__h3_error__).toBe(true);
  });

  it("giữ tên lớp suy từ mã để đọc được trong log", () => {
    expect(new TierLockedError().name).toBe("TierLockedError");
    expect(TierLockedError.name).toBe("TierLockedError");
  });

  it("cho phép ghi đè thông báo mà không đổi mã", () => {
    const error = new AnyBusinessError(undefined, "Thông báo riêng.");

    expect(error.message).toBe("Thông báo riêng.");
    expect(error.code).toBe("SOME_BUSINESS_RULE_BROKEN");
  });

  it("isAppError nhận diện được lớp sinh từ defineError", () => {
    expect(isAppError(new TierLockedError())).toBe(true);
    expect(isAppError(new Error("trần"))).toBe(false);
  });

  it("classNameFromCode đổi SCREAMING_SNAKE sang tên lớp", () => {
    expect(classNameFromCode("RATE_LIMITED")).toBe("RateLimitedError");
    expect(classNameFromCode("INTERNAL_ERROR")).toBe("InternalError");
  });
});

const ChildNotFoundError = defineModelNotFound(
  "ChildNotFoundError",
  "child_profiles",
  "Không tìm thấy hồ sơ bé."
);

const PlaySessionNotFoundError = defineModelNotFound(
  "PlaySessionNotFoundError",
  "play_sessions",
  "Không tìm thấy phiên chơi.",
  "SESSION_NOT_FOUND"
);

describe("ModelNotFoundError", () => {
  it("map sang NOT_FOUND 404 cho mọi model", () => {
    const error = new ChildNotFoundError("uuid-abc");

    expect(error).toBeInstanceOf(ModelNotFoundError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });

  it("model có mã riêng thì giữ mã riêng, vẫn 404", () => {
    const error = new PlaySessionNotFoundError("sess-1");

    expect(error.code).toBe("SESSION_NOT_FOUND");
    expect(error.status).toBe(404);
  });

  it("giữ tên lớp riêng để đọc được trong log", () => {
    expect(new ChildNotFoundError().name).toBe("ChildNotFoundError");
  });

  it("ca âm: body KHÔNG chứa tên bảng hay id nội bộ (BR-ERR-03)", () => {
    const error = new ChildNotFoundError(4242);
    const body = JSON.stringify(error.toResponse());

    expect(body).not.toContain("child_profiles");
    expect(body).not.toContain("4242");
  });

  it("model và key ra được log qua modelErrorContext", () => {
    const error = new ChildNotFoundError(4242);

    expect(isModelBoundError(error)).toBe(true);
    expect(modelErrorContext(error)).toEqual({
      model: "child_profiles",
      key: 4242,
    });
  });

  it("ca âm: Error thường và ValidationError không phải lỗi gắn model", () => {
    expect(isModelBoundError(new Error("bất kỳ"))).toBe(false);
    expect(isModelBoundError(new ValidationError([]))).toBe(false);
  });

  it("không có key thì context ghi null, không ghi undefined", () => {
    expect(modelErrorContext(new ChildNotFoundError())).toEqual({
      model: "child_profiles",
      key: null,
    });
  });
});

describe("ValidationError", () => {
  it("là 422 kèm details.fields[] — đúng một hình dạng (§7.7)", () => {
    const error = new ValidationError([
      { path: "email", message: "Email không hợp lệ." },
    ]);

    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.toResponse().details).toEqual({
      fields: [{ path: "email", message: "Email không hợp lệ." }],
    });
  });

  it("ValidationError.field dựng lỗi một trường", () => {
    expect(
      ValidationError.field("birth_year", "Ngoài khoảng cho phép.").fields
    ).toEqual([{ path: "birth_year", message: "Ngoài khoảng cho phép." }]);
  });
});
