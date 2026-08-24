import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Hai test cũ ở đây đọc source bằng `readFileSync` rồi assert chuỗi
 * (`toContain("ssr: false")`). Chúng trùng với cổng `lint:runtime-boundary` và
 * vẫn xanh khi client gọi API bằng URL tương đối — nghĩa là không chứng minh
 * hành vi nào. Thay bằng test chạy thật `useApiClient`.
 */

const fetchCalls: Array<{ url: string; options: Record<string, unknown> }> = [];
let apiBaseUrl = "https://mindkid.test";
let sessionFails = false;
let sessionResponse: unknown = {
  manager: { manager_id: 1 },
  csrf_token: "t0",
};

vi.mock("#imports", () => {
  // `useState` chỉ cần một ô có `.value`; `vue` không phải dependency trực tiếp
  // của apps/admin nên không import được từ test.
  const states = new Map<string, { value: unknown }>();

  return {
    $fetch: (url: string, options: Record<string, unknown> = {}) => {
      fetchCalls.push({ url, options });
      if (url.endsWith("/api/managers/auth/session")) {
        return sessionFails
          ? Promise.reject(new Error("UNAUTHENTICATED"))
          : Promise.resolve(sessionResponse);
      }
      return Promise.resolve({ ok: true });
    },
    useRuntimeConfig: () => ({ public: { apiBaseUrl } }),
    useState: (key: string) => {
      const found = states.get(key) ?? { value: undefined };
      states.set(key, found);
      return found;
    },
    useAsyncData: (_key: string, handler: () => Promise<unknown>) =>
      handler().then((data) => ({ data })),
    // `useState` là state dùng chung của SPA; test phải xoá giữa các ca, nếu
    // không token CSRF của ca trước sẽ làm ca sau bỏ qua bước nạp session.
    __resetSharedState: () => states.clear(),
  };
});

const { __resetSharedState } = (await import("#imports")) as unknown as {
  __resetSharedState: () => void;
};

const { apiUrl, useApiClient } = await import("~/composables/use-api-client");

type FetchCall = (typeof fetchCalls)[number] | undefined;

function headerOf(call: FetchCall): string | null {
  const headers = call?.options.headers as Headers | undefined;
  return headers ? headers.get("x-csrf-token") : null;
}

describe("admin API client", () => {
  beforeEach(() => {
    __resetSharedState();
    fetchCalls.length = 0;
    apiBaseUrl = "https://mindkid.test";
    sessionFails = false;
    sessionResponse = { manager: { manager_id: 1 }, csrf_token: "t0" };
  });

  // BR-ARB-04: admin.{domain} là host tĩnh, URL tương đối sẽ trỏ về chính nó.
  it("builds an absolute URL from the configured API origin", () => {
    expect(apiUrl("/api/managers/users")).toBe(
      "https://mindkid.test/api/managers/users"
    );
  });

  it("joins the origin and the path exactly once", () => {
    apiBaseUrl = "https://mindkid.test/";
    expect(apiUrl("/api/managers/users")).toBe(
      "https://mindkid.test/api/managers/users"
    );
  });

  it("refuses to build a URL when the API origin is missing", () => {
    apiBaseUrl = "";
    expect(() => apiUrl("/api/managers/users")).toThrow(
      "NUXT_PUBLIC_API_BASE_URL is not configured"
    );
  });

  it("sends cookies and no CSRF header on a safe request", async () => {
    await useApiClient().get("/api/managers/users");

    expect(fetchCalls).toHaveLength(1);
    const [call] = fetchCalls;
    expect(call?.url).toBe("https://mindkid.test/api/managers/users");
    expect(call?.options.credentials).toBe("include");
    expect(headerOf(call)).toBeNull();
  });

  // Token CSRF của manager sống trong memory: cookie CSRF là host-only trên
  // {domain} nên JS ở admin.{domain} không đọc được nó.
  it("loads the session once and then signs mutations with its CSRF token", async () => {
    const api = useApiClient();
    await api.post("/api/managers/users", { body: { name: "A" } });

    expect(fetchCalls.map((call) => call.url)).toEqual([
      "https://mindkid.test/api/managers/auth/session",
      "https://mindkid.test/api/managers/users",
    ]);
    expect(headerOf(fetchCalls[1])).toBe("t0");

    await api.post("/api/managers/users", { body: { name: "B" } });
    expect(fetchCalls).toHaveLength(3);
    expect(headerOf(fetchCalls[2])).toBe("t0");
  });

  it("still issues the request when the session cannot be loaded", async () => {
    sessionFails = true;
    await useApiClient().post("/api/managers/users");

    expect(fetchCalls.map((call) => call.url)).toEqual([
      "https://mindkid.test/api/managers/auth/session",
      "https://mindkid.test/api/managers/users",
    ]);
  });
});
