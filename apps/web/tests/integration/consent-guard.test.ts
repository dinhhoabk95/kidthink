import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCache = new Map<string, string>();

vi.mock("@mindkid/cache", () => ({
  getCached: vi.fn(<T>(key: string): Promise<T | null> => {
    const raw = mockCache.get(key);
    return Promise.resolve(raw ? (JSON.parse(raw) as T) : null);
  }),
  setCached: vi.fn((key: string, value: unknown): Promise<void> => {
    mockCache.set(key, JSON.stringify(value));
    return Promise.resolve();
  }),
  deleteCached: vi.fn((key: string): Promise<void> => {
    mockCache.delete(key);
    return Promise.resolve();
  }),
}));

const mockDbSelect = vi.fn();

vi.mock("@mindkid/db", () => ({
  getOwnerDb: () => ({
    select: mockDbSelect,
  }),
  consentLogs: {
    userId: "user_id",
    consentType: "consent_type",
    createdAt: "created_at",
    id: "id",
  },
  consentRequirements: {
    consentType: "consent_type",
  },
}));

import {
  assertUserTermsAndPrivacyConsent,
  bumpGlobalConsentEpoch,
  GLOBAL_CONSENT_EPOCH_CACHE_KEY,
  getConsentCacheKey,
  invalidateUserConsentCache,
} from "#server/utils/consent-guard";

describe("assertUserTermsAndPrivacyConsent caching & validation", () => {
  beforeEach(() => {
    mockCache.clear();
    vi.clearAllMocks();
  });

  it("dùng cache hit khi epoch khớp và không truy vấn DB", async () => {
    const userId = 777;
    const cacheKey = getConsentCacheKey(userId);
    mockCache.set(
      cacheKey,
      JSON.stringify({ terms: true, privacy: true, epoch: 0 })
    );

    await assertUserTermsAndPrivacyConsent(userId);

    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it("khi cache miss thì truy vấn DB và ghi cache mới kèm epoch", async () => {
    const userId = 888;
    const now = new Date();

    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 1,
                  userId,
                  action: "accepted",
                  createdAt: now,
                },
              ]),
          }),
          limit: () =>
            Promise.resolve([
              {
                id: 1,
                reconsentRequiredAt: null,
              },
            ]),
        }),
      }),
    });

    await assertUserTermsAndPrivacyConsent(userId);

    const cacheKey = getConsentCacheKey(userId);
    expect(mockCache.has(cacheKey)).toBe(true);
    const cachedData = JSON.parse(mockCache.get(cacheKey) || "{}") as {
      terms: boolean;
      privacy: boolean;
      epoch: number;
    };
    expect(cachedData.terms).toBe(true);
    expect(cachedData.privacy).toBe(true);
    expect(typeof cachedData.epoch).toBe("number");
  });

  it("ném 428 ConsentRequiredError khi người dùng chưa đồng ý điều khoản", async () => {
    const userId = 555;
    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
          limit: () =>
            Promise.resolve([
              {
                id: 1,
                reconsentRequiredAt: null,
              },
            ]),
        }),
      }),
    });

    await expect(
      assertUserTermsAndPrivacyConsent(userId)
    ).rejects.toMatchObject({
      status: 428,
      code: "CONSENT_REQUIRED",
    });
  });

  it("ném 428 ConsentRequiredError khi chính sách yêu cầu tái đồng ý (reconsentRequiredAt)", async () => {
    const userId = 666;
    const past = new Date("2026-01-01T00:00:00Z");
    const futureRequirement = new Date("2026-06-01T00:00:00Z");

    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 1,
                  userId,
                  action: "accepted",
                  createdAt: past,
                },
              ]),
          }),
          limit: () =>
            Promise.resolve([
              {
                id: 1,
                reconsentRequiredAt: futureRequirement,
                notice: "Điều khoản mới",
              },
            ]),
        }),
      }),
    });

    await expect(
      assertUserTermsAndPrivacyConsent(userId)
    ).rejects.toMatchObject({
      status: 428,
      code: "CONSENT_REQUIRED",
    });
  });

  it("ca âm C3: nạp cache ấm -> bump epoch -> request kế tiếp bỏ qua cache và ném 428 khi có yêu cầu tái đồng ý", async () => {
    const userId = 777;
    const cacheKey = getConsentCacheKey(userId);
    // 1. Nạp cache ấm lúc epoch = 1000
    mockCache.set(GLOBAL_CONSENT_EPOCH_CACHE_KEY, JSON.stringify(1000));
    mockCache.set(
      cacheKey,
      JSON.stringify({ terms: true, privacy: true, epoch: 1000 })
    );

    // 2. Super-admin ép tái đồng ý -> bump epoch lên giá trị mới
    await bumpGlobalConsentEpoch();

    // 3. Mock DB trả về yêu cầu tái đồng ý
    const past = new Date("2026-01-01T00:00:00Z");
    const reconsentTime = new Date("2026-09-01T00:00:00Z");
    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 1,
                  userId,
                  action: "accepted",
                  createdAt: past,
                },
              ]),
          }),
          limit: () =>
            Promise.resolve([
              {
                id: 1,
                reconsentRequiredAt: reconsentTime,
                notice: "Cập nhật chính sách bắt buộc",
              },
            ]),
        }),
      }),
    });

    // 4. Request kế tiếp: không được nuốt bởi cache cũ, bắt buộc query DB và ném 428
    await expect(
      assertUserTermsAndPrivacyConsent(userId)
    ).rejects.toMatchObject({
      status: 428,
      code: "CONSENT_REQUIRED",
    });
    expect(mockDbSelect).toHaveBeenCalled();
  });

  it("invalidateUserConsentCache xoá đúng key cache của user", async () => {
    const userId = 999;
    const cacheKey = getConsentCacheKey(userId);
    mockCache.set(
      cacheKey,
      JSON.stringify({ terms: true, privacy: true, epoch: 0 })
    );

    await invalidateUserConsentCache(userId);

    expect(mockCache.has(cacheKey)).toBe(false);
  });
});
