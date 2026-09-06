import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateToMock = vi.fn();
const clearSessionMock = vi.fn();

vi.mock("#imports", () => ({
  navigateTo: (...args: unknown[]) => navigateToMock(...args),
  useRoute: () => ({ fullPath: "/me/settings" }),
  useUserSession: () => ({ clear: clearSessionMock }),
  defineNuxtPlugin: (fn: unknown) => fn,
}));

vi.mock("~/composables/use-csrf-fetch", () => ({
  useCsrfHeaders: () => ({
    headers: () => ({ "x-csrf-token": "token-xyz" }),
  }),
}));

if (!globalThis.$fetch) {
  const dummyFetch = vi.fn() as unknown as typeof $fetch;
  dummyFetch.create = vi.fn();
  globalThis.$fetch = dummyFetch;
}

import { useApi } from "~/composables/use-api";

describe("useApi composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("onRequest gắn x-csrf-token vào headers", () => {
    let capturedOnRequest:
      | ((ctx: { options: { headers?: Record<string, string> } }) => void)
      | undefined;

    const originalCreate = $fetch.create;
    $fetch.create = vi.fn((config: unknown) => {
      const opts = config as {
        onRequest: (ctx: {
          options: { headers?: Record<string, string> };
        }) => void;
      };
      capturedOnRequest = opts.onRequest;
      return vi.fn();
    }) as unknown as typeof $fetch.create;

    useApi();
    expect(capturedOnRequest).toBeDefined();

    const options: { headers?: Record<string, string> } = { headers: {} };
    capturedOnRequest?.({ options });

    expect(options.headers?.["x-csrf-token"]).toBe("token-xyz");
    $fetch.create = originalCreate;
  });

  it("401 UNAUTHENTICATED: dọn session và điều hướng về /login có redirect_to", async () => {
    let capturedOnResponseError:
      | ((ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>)
      | undefined;

    const originalCreate = $fetch.create;
    $fetch.create = vi.fn((config: unknown) => {
      const opts = config as {
        onResponseError: (ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>;
      };
      capturedOnResponseError = opts.onResponseError;
      return vi.fn();
    }) as unknown as typeof $fetch.create;

    useApi();
    expect(capturedOnResponseError).toBeDefined();

    const errorContext = {
      response: {
        status: 401,
        _data: {
          code: "UNAUTHENTICATED",
          message: "Chưa đăng nhập.",
        },
      },
    };

    await expect(
      capturedOnResponseError?.(errorContext)
    ).rejects.toThrowError();

    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(navigateToMock).toHaveBeenCalledWith(
      "/login?redirect_to=%2Fme%2Fsettings"
    );

    $fetch.create = originalCreate;
  });

  it("422 VALIDATION_FAILED: không điều hướng, giữ nguyên lỗi với fields[]", async () => {
    let capturedOnResponseError:
      | ((ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>)
      | undefined;

    const originalCreate = $fetch.create;
    $fetch.create = vi.fn((config: unknown) => {
      const opts = config as {
        onResponseError: (ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>;
      };
      capturedOnResponseError = opts.onResponseError;
      return vi.fn();
    }) as unknown as typeof $fetch.create;

    useApi();

    const validationData = {
      code: "VALIDATION_FAILED",
      message: "Dữ liệu không hợp lệ.",
      details: {
        fields: [{ field: "name", message: "Tên không được để trống" }],
      },
    };

    const errorContext = {
      response: {
        status: 422,
        _data: validationData,
      },
    };

    let thrownError: unknown;
    try {
      await capturedOnResponseError?.(errorContext);
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(navigateToMock).not.toHaveBeenCalled();
    expect((thrownError as { code: string }).code).toBe("VALIDATION_FAILED");
    expect((thrownError as { details: unknown }).details).toEqual(
      validationData.details
    );

    $fetch.create = originalCreate;
  });

  it("ca âm: 403 TIER_LOCKED không điều hướng và không bị nuốt", async () => {
    let capturedOnResponseError:
      | ((ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>)
      | undefined;

    const originalCreate = $fetch.create;
    $fetch.create = vi.fn((config: unknown) => {
      const opts = config as {
        onResponseError: (ctx: {
          error?: unknown;
          response?: { status: number; _data: unknown };
        }) => Promise<void>;
      };
      capturedOnResponseError = opts.onResponseError;
      return vi.fn();
    }) as unknown as typeof $fetch.create;

    useApi();

    const errorContext = {
      response: {
        status: 403,
        _data: {
          code: "TIER_LOCKED",
          message: "Nội dung này thuộc gói cao hơn.",
          details: { access_tier: "premium" },
        },
      },
    };

    let thrownError: unknown;
    try {
      await capturedOnResponseError?.(errorContext);
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(navigateToMock).not.toHaveBeenCalled();
    expect((thrownError as { code: string }).code).toBe("TIER_LOCKED");

    $fetch.create = originalCreate;
  });
});
