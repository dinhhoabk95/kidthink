import { appError, ChildNotFoundError } from "@mindkid/auth";
import { RateLimitedError } from "@mindkid/errors";
import { createError } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import errorHandler from "#server/error";

/**
 * Handler lỗi chung của `/api/*` — ERROR-CODES §4 và §8.
 * Test khoá đúng hình dạng body §7.1 và các điều cấm của `BR-ERR-03`.
 */

const sent: { status?: number; statusText?: string; body?: string } = {};
const headers: Record<string, string> = {};

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    getRequestURL: (event: { path?: string }) =>
      new URL(`https://mindkid.test${event.path ?? "/"}`),
    setResponseHeaders: (_event: unknown, next: Record<string, string>) => {
      Object.assign(headers, next);
    },
    setResponseStatus: (_event: unknown, status: number, text?: string) => {
      sent.status = status;
      sent.statusText = text;
    },
    send: (_event: unknown, body: string) => {
      sent.body = body;
      return body;
    },
  };
});

/**
 * Event giả tối thiểu. Ép kiểu một lần ở đây thay vì rải `as` khắp test —
 * test double không có cách nào dựng H3Event thật mà không mở server.
 */
function fakeEvent(path: string) {
  return { path, method: "GET" } as unknown as Parameters<
    typeof errorHandler
  >[1];
}

function callHandler(error: unknown, path = "/api/users/me") {
  return errorHandler(
    error as Parameters<typeof errorHandler>[0],
    fakeEvent(path),
    { defaultHandler: vi.fn() } as unknown as Parameters<typeof errorHandler>[2]
  );
}

function bodyOf(): Record<string, unknown> {
  return JSON.parse(sent.body ?? "{}");
}

describe("handler lỗi chung /api/*", () => {
  beforeEach(() => {
    sent.status = undefined;
    sent.statusText = undefined;
    sent.body = undefined;
    for (const key of Object.keys(headers)) {
      delete headers[key];
    }
  });

  it("AppError ra đúng body §7.1: code, message, details", async () => {
    await callHandler(appError("TIER_LOCKED", { access_tier: "premium" }));

    expect(sent.status).toBe(403);
    expect(sent.statusText).toBe("TIER_LOCKED");
    expect(bodyOf()).toEqual({
      code: "TIER_LOCKED",
      message: "Nội dung này thuộc gói cao hơn.",
      details: { access_tier: "premium" },
    });
  });

  it("body KHÔNG còn phong bì statusCode/url/stack của Nitro", async () => {
    await callHandler(appError("UNAUTHENTICATED"));

    expect(Object.keys(bodyOf()).sort()).toEqual(["code", "message"]);
  });

  it("lỗi h3 thường dùng statusMessage làm mã", async () => {
    await callHandler(
      createError({
        statusCode: 409,
        statusMessage: "VERSION_CONFLICT",
        message: "Phiên bản đã thay đổi.",
      })
    );

    expect(sent.status).toBe(409);
    expect(bodyOf()).toEqual({
      code: "VERSION_CONFLICT",
      message: "Phiên bản đã thay đổi.",
    });
  });

  it("lỗi h3 đã mang data.code thì giữ nguyên data", async () => {
    await callHandler(
      createError({
        statusCode: 400,
        statusMessage: "AVATAR_NOT_IN_PRESET",
        data: { code: "AVATAR_NOT_IN_PRESET", message: "Sai preset." },
      })
    );

    expect(bodyOf()).toEqual({
      code: "AVATAR_NOT_IN_PRESET",
      message: "Sai preset.",
    });
  });

  it("ca âm BR-ERR-03: lỗi 500 KHÔNG lộ thông báo gốc, tên bảng hay stack", async () => {
    await callHandler(new Error('relation "users" does not exist'));

    expect(sent.status).toBe(500);
    const body = bodyOf();
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("users");
    expect(body).not.toHaveProperty("stack");
  });

  it("ca âm BR-ERR-03: ModelNotFoundError không đưa tên bảng vào body", async () => {
    await callHandler(new ChildNotFoundError(4242));

    expect(sent.status).toBe(404);
    const raw = JSON.stringify(bodyOf());
    expect(raw).not.toContain("child_profiles");
    expect(raw).not.toContain("4242");
  });

  it("ca âm: đường không phải /api/ thì nhường handler mặc định của Nitro", async () => {
    await callHandler(appError("UNAUTHENTICATED"), "/me/settings");

    expect(sent.status).toBeUndefined();
    expect(sent.body).toBeUndefined();
  });

  it("lớp domain mới từ @mindkid/errors ra đúng body §7.1", async () => {
    await callHandler(new RateLimitedError({ retry_after_s: 30 }));

    expect(sent.status).toBe(429);
    expect(sent.statusText).toBe("RATE_LIMITED");
    expect(bodyOf()).toEqual({
      code: "RATE_LIMITED",
      message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
      details: { retry_after_s: 30 },
    });
  });

  it("lỗi unique Postgres map sang mã nghiệp vụ CODE_ALREADY_EXISTS và không chứa tên constraint", async () => {
    const pgError = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "users_email_unique"'
      ),
      { code: "23505" }
    );
    await callHandler(pgError);

    expect(sent.status).toBe(409);
    expect(sent.statusText).toBe("CODE_ALREADY_EXISTS");
    const body = bodyOf();
    expect(body.code).toBe("CODE_ALREADY_EXISTS");
    expect(JSON.stringify(body)).not.toContain("users_email_unique");
    expect(JSON.stringify(body)).not.toContain("23505");
  });

  it("đặt đủ header bảo vệ trang lỗi", async () => {
    await callHandler(appError("CSRF_INVALID"));

    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["cache-control"]).toBe("no-cache");
  });
});
