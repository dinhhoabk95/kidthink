import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheStore = new Map<string, string>();
const cacheMocks = vi.hoisted(() => ({
  getCached: vi.fn<(key: string) => Promise<object | number | string | null>>(),
  setCached:
    vi.fn<
      (
        key: string,
        value: object | number | string,
        ttlSeconds: number
      ) => Promise<void>
    >(),
  deleteCached: vi.fn<(key: string) => Promise<void>>(),
}));

vi.mock("@mindkid/cache", () => ({
  getCached: cacheMocks.getCached,
  setCached: cacheMocks.setCached,
  deleteCached: cacheMocks.deleteCached,
}));

import {
  buildCanonicalQueryCacheKey,
  GUEST_SEO_EPOCH_KEY,
  GUEST_SEO_TTL,
  hasUncacheableSearchQuery,
  invalidateGuestSeoCache,
  resetGuestSeoEpochMemoryCache,
  setGuestSeoCacheEnabledInTests,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";

describe("guest-seo-cache — Valkey cache & O(1) epoch invalidation cho API SEO công khai", () => {
  beforeEach(() => {
    cacheStore.clear();
    vi.clearAllMocks();
    resetGuestSeoEpochMemoryCache();
    setGuestSeoCacheEnabledInTests(true);

    cacheMocks.getCached.mockImplementation((key: string) => {
      const raw = cacheStore.get(key);
      if (raw === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve(JSON.parse(raw) as object | number | string);
    });

    cacheMocks.setCached.mockImplementation(
      (key: string, value: object | number | string) => {
        cacheStore.set(key, JSON.stringify(value));
        return Promise.resolve();
      }
    );

    cacheMocks.deleteCached.mockImplementation((key: string) => {
      cacheStore.delete(key);
      return Promise.resolve();
    });
  });

  it("chuẩn hoá query params thành cache key bất biến theo thứ tự tham số", () => {
    const keyA = buildCanonicalQueryCacheKey({
      competency: "C1",
      age_band: "4-5",
      empty: "",
      missing: undefined,
    });
    const keyB = buildCanonicalQueryCacheKey({
      age_band: "4-5",
      competency: "C1",
    });

    expect(keyA).toBe("age_band=4-5&competency=C1");
    expect(keyA).toBe(keyB);
    expect(buildCanonicalQueryCacheKey({})).toBe("default");
  });

  it("phát hiện truy vấn tìm kiếm từ khoá tự do để tránh làm bẩn Valkey cache", () => {
    expect(
      hasUncacheableSearchQuery({ competency: "C1", age_band: "3-4" })
    ).toBe(false);
    expect(hasUncacheableSearchQuery({ q: "   " })).toBe(false);
    expect(hasUncacheableSearchQuery({ q: "đếm táo" })).toBe(true);
  });

  it("trả từ Valkey ở lần gọi thứ 2 (0 lần gọi fetcher lặp lại) và làm mới tức thì khi invalidateGuestSeoCache", async () => {
    let dbCallCount = 0;
    const fetcher = vi.fn(() => {
      dbCallCount += 1;
      return Promise.resolve({ total_levels: dbCallCount * 10 });
    });

    const first = await withGuestSeoCache({
      namespace: "levels-list",
      key: "competency=C1",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      fetcher,
    });
    const second = await withGuestSeoCache({
      namespace: "levels-list",
      key: "competency=C1",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      fetcher,
    });

    expect(first).toEqual({ total_levels: 10 });
    expect(second).toEqual({ total_levels: 10 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Xoá cache toàn cục bằng O(1) epoch bump
    const nextEpoch = await invalidateGuestSeoCache();
    expect(nextEpoch).toBeGreaterThan(0);
    expect(cacheStore.has(GUEST_SEO_EPOCH_KEY)).toBe(true);

    const third = await withGuestSeoCache({
      namespace: "levels-list",
      key: "competency=C1",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      fetcher,
    });

    expect(third).toEqual({ total_levels: 20 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("bypass=true không đọc và không ghi Valkey (bảo vệ tuyệt đối response có phiên đăng nhập / trả phí)", async () => {
    const fetcher = vi.fn(() => Promise.resolve({ secret_user_cta: "play" }));

    const result = await withGuestSeoCache({
      namespace: "level-detail",
      key: "GL-C1-CNT-CARD-0001",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      bypass: true,
      fetcher,
    });

    expect(result).toEqual({ secret_user_cta: "play" });
    expect(cacheMocks.getCached).not.toHaveBeenCalled();
    expect(cacheMocks.setCached).not.toHaveBeenCalled();
  });

  it("Valkey lỗi đọc/ghi vẫn fail-open về DB fetcher mà không làm sập SSR trang SEO", async () => {
    cacheMocks.getCached.mockRejectedValue(new Error("Valkey connection lost"));
    cacheMocks.setCached.mockRejectedValue(new Error("Valkey write timeout"));

    const fetcher = vi.fn(() => Promise.resolve({ items: ["ok"] }));
    const result = await withGuestSeoCache({
      namespace: "faq",
      key: "published",
      ttlSeconds: GUEST_SEO_TTL.SHORT,
      fetcher,
    });

    expect(result).toEqual({ items: ["ok"] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
