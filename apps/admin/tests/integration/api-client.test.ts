import { beforeEach, describe, expect, it, vi } from "vitest";

interface RecordedFetchCall {
  url: string;
  options: {
    credentials?: string;
    headers?: Headers;
  };
}

const fetchCalls: RecordedFetchCall[] = [];
let apiBaseUrl = "https://mindkid.test";

vi.mock("#imports", () => {
  const states = new Map<string, { value: string | undefined }>();

  return {
    $fetch: (
      url: string,
      options: { credentials?: string; headers?: Headers } = {}
    ) => {
      fetchCalls.push({ url, options });
      return Promise.resolve({ ok: true });
    },
    navigateTo: vi.fn(),
    useRuntimeConfig: () => ({ public: { apiBaseUrl } }),
    useState: (key: string) => {
      const found = states.get(key) ?? { value: undefined };
      states.set(key, found);
      return found;
    },
    useAsyncData: (_key: string, handler: () => Promise<object>) =>
      handler().then((data) => ({ data })),
    __resetSharedState: () => states.clear(),
    __setSharedState: (key: string, val: string | undefined) => {
      states.set(key, { value: val });
    },
  };
});

interface MockedImportsModule {
  __resetSharedState: () => void;
  __setSharedState: (key: string, val: string | undefined) => void;
}

const mockedImports = (await import("#imports")) as MockedImportsModule;

const { apiUrl, useApiClient } = await import("~/composables/use-api-client");

type FetchCall = (typeof fetchCalls)[number] | undefined;

function headerOf(call: FetchCall): string | null {
  const headers = call?.options.headers;
  return headers ? headers.get("x-csrf-token") : null;
}

describe("admin API client", () => {
  beforeEach(() => {
    mockedImports.__resetSharedState();
    fetchCalls.length = 0;
    apiBaseUrl = "https://mindkid.test";
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

  it("sends credentials: include on mutations without calling legacy /api/managers/auth/session", async () => {
    const api = useApiClient();
    await api.post("/api/managers/users", { body: { name: "A" } });

    expect(fetchCalls.map((call) => call.url)).toEqual([
      "https://mindkid.test/api/managers/users",
    ]);
    expect(fetchCalls[0]?.options.credentials).toBe("include");
  });

  it("forwards in-memory x-csrf-token header on mutations when present", async () => {
    mockedImports.__setSharedState("admin-csrf-token", "t0");
    await useApiClient().post("/api/managers/users", { body: { name: "B" } });

    expect(fetchCalls).toHaveLength(1);
    expect(headerOf(fetchCalls[0])).toBe("t0");
  });
});
