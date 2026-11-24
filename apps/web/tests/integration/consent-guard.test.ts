import type { ConsentType } from "@mindkid/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCache = new Map<string, string>();

vi.mock("@mindkid/cache", () => ({
  getCached: vi.fn(<T>(key: string): Promise<T | null> => {
    const raw = mockCache.get(key);
    return Promise.resolve(raw ? (JSON.parse(raw) as T) : null);
  }),
  setCached: vi.fn(
    (key: string, value: object | number | string | boolean): Promise<void> => {
      mockCache.set(key, JSON.stringify(value));
      return Promise.resolve();
    }
  ),
  deleteCached: vi.fn((key: string): Promise<void> => {
    mockCache.delete(key);
    return Promise.resolve();
  }),
}));

interface MockConsentLog {
  readonly id: number;
  readonly userId: number;
  readonly consentType: ConsentType;
  readonly action: "accepted" | "withdrawn";
  readonly createdAt: Date;
}

interface MockConsentRequirement {
  readonly consentType: ConsentType;
  readonly reconsentRequiredAt: Date | null;
  readonly notice?: string | null;
}

const mockFindLatestByUserAndType =
  vi.fn<
    (userId: number, type: ConsentType) => Promise<MockConsentLog | null>
  >();
const mockGetRequirements =
  vi.fn<
    (types?: readonly ConsentType[]) => Promise<MockConsentRequirement[]>
  >();

vi.mock("#server/utils/repositories", () => ({
  useOwnerRepositories: () => ({
    consents: {
      findLatestByUserAndType: mockFindLatestByUserAndType,
      getRequirements: mockGetRequirements,
    },
  }),
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

    expect(mockFindLatestByUserAndType).not.toHaveBeenCalled();
    expect(mockGetRequirements).not.toHaveBeenCalled();
  });

  it("khi cache miss thì truy vấn DB và ghi cache mới kèm epoch", async () => {
    const userId = 888;
    const now = new Date();

    mockFindLatestByUserAndType.mockImplementation(async (uid, type) => ({
      id: 1,
      userId: uid,
      consentType: type,
      action: "accepted",
      createdAt: now,
    }));
    mockGetRequirements.mockImplementation(async (types) => [
      {
        consentType: types?.[0] ?? "terms",
        reconsentRequiredAt: null,
      },
    ]);

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
    mockFindLatestByUserAndType.mockResolvedValue(null);
    mockGetRequirements.mockImplementation(async (types) => [
      {
        consentType: types?.[0] ?? "terms",
        reconsentRequiredAt: null,
      },
    ]);

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

    mockFindLatestByUserAndType.mockImplementation(async (uid, type) => ({
      id: 1,
      userId: uid,
      consentType: type,
      action: "accepted",
      createdAt: past,
    }));
    mockGetRequirements.mockImplementation(async (types) => [
      {
        consentType: types?.[0] ?? "terms",
        reconsentRequiredAt: futureRequirement,
        notice: "Điều khoản mới",
      },
    ]);

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
    mockFindLatestByUserAndType.mockImplementation(async (uid, type) => ({
      id: 1,
      userId: uid,
      consentType: type,
      action: "accepted",
      createdAt: past,
    }));
    mockGetRequirements.mockImplementation(async (types) => [
      {
        consentType: types?.[0] ?? "terms",
        reconsentRequiredAt: reconsentTime,
        notice: "Cập nhật chính sách bắt buộc",
      },
    ]);

    // 4. Request kế tiếp: không được nuốt bởi cache cũ, bắt buộc query DB và ném 428
    await expect(
      assertUserTermsAndPrivacyConsent(userId)
    ).rejects.toMatchObject({
      status: 428,
      code: "CONSENT_REQUIRED",
    });
    expect(mockFindLatestByUserAndType).toHaveBeenCalled();
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
