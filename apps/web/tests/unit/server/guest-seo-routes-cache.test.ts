import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { createEvent, type H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheStore = new Map<string, string>();

vi.mock("@mindkid/cache", () => ({
  getCached: vi.fn((key: string) => {
    const raw = cacheStore.get(key);
    return Promise.resolve(
      raw === undefined ? null : (JSON.parse(raw) as object | number)
    );
  }),
  setCached: vi.fn((key: string, value: object | number, _ttl: number) => {
    cacheStore.set(key, JSON.stringify(value));
    return Promise.resolve();
  }),
  deleteCached: vi.fn((key: string) => {
    cacheStore.delete(key);
    return Promise.resolve();
  }),
}));

const serviceMocks = vi.hoisted(() => ({
  countPublishedLevels: vi.fn(),
  listPublishedFaqItems: vi.fn(),
  searchGameLevels: vi.fn(),
}));

vi.mock("#server/services/index.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#server/services/index.js")>();
  return {
    ...actual,
    countPublishedLevels: serviceMocks.countPublishedLevels,
    listPublishedFaqItems: serviceMocks.listPublishedFaqItems,
    searchGameLevels: serviceMocks.searchGameLevels,
  };
});

vi.mock("@mindkid/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/db")>();
  return {
    ...actual,
    getOwnerDb: vi.fn(() => ({})),
  };
});

import faqHandler from "#server/api/guest/faq.get";
import homeHandler from "#server/api/guest/home.get";
import guestLevelsHandler from "#server/api/guest/levels/index.get";
import {
  invalidateGuestSeoCache,
  resetGuestSeoEpochMemoryCache,
  setGuestSeoCacheEnabledInTests,
} from "#server/utils/guest-seo-cache";

function makeGuestHttpEvent(url: string): H3Event {
  const req = new IncomingMessage(new Socket());
  req.method = "GET";
  req.url = url;
  const res = new ServerResponse(req);
  return createEvent(req, res);
}

describe("Guest SEO API Handlers — Valkey caching & invalidation integration", () => {
  beforeEach(() => {
    cacheStore.clear();
    vi.clearAllMocks();
    resetGuestSeoEpochMemoryCache();
    setGuestSeoCacheEnabledInTests(true);

    serviceMocks.countPublishedLevels.mockResolvedValue({
      total: 120,
      by_access_tier: { free: 12, login: 18, standard: 40, premium: 50 },
      by_age_band: { "3-4": 40, "4-5": 40, "5-6": 40 },
    });
    serviceMocks.listPublishedFaqItems.mockResolvedValue([
      {
        id: "faq-1",
        anchor: "cau-hoi-1",
        category: "product",
        question: "MindKid dành cho độ tuổi nào?",
        answer: "Dành cho bé 3–6 tuổi.",
      },
    ]);
    serviceMocks.searchGameLevels.mockResolvedValue({
      items: [
        {
          id: 1,
          entity_id: 1,
          code: "GL-C1-CNT-CARD-0001",
          title: "Đếm táo",
          description: "Mô tả",
          instruction: "Hướng dẫn",
          thumbnail_emoji: "🍎",
          theme_id: "farm",
          competency: "C1",
          age_band: "3-4",
          age_min: 3,
          age_max: 4,
          difficulty: 1,
          access_tier: "free",
          status: "published",
          locked: false,
        },
      ],
      total: 1,
      facets: {
        total: 1,
        competency: { C1: 1 },
        age_band: { "3-4": 1 },
        age: { "3": 1, "4": 1 },
        access_tier: { free: 1 },
      },
      next_cursor: null,
      no_store: false,
    });
  });

  afterEach(() => {
    setGuestSeoCacheEnabledInTests(false);
  });

  it("GET /api/guest/levels cache hit ở request thứ 2 (bất kể thứ tự query param) và bypass khi có từ khoá q", async () => {
    const res1 = await guestLevelsHandler(
      makeGuestHttpEvent("/api/guest/levels?competency=C1&age_band=3-4")
    );
    const res2 = await guestLevelsHandler(
      makeGuestHttpEvent("/api/guest/levels?age_band=3-4&competency=C1")
    );

    expect(res1.items).toHaveLength(1);
    expect(res2.items).toHaveLength(1);
    expect(serviceMocks.searchGameLevels).toHaveBeenCalledTimes(1);

    // Khi có từ khoá tìm kiếm tự do q -> không dùng cache
    await guestLevelsHandler(
      makeGuestHttpEvent("/api/guest/levels?q=táo&competency=C1")
    );
    expect(serviceMocks.searchGameLevels).toHaveBeenCalledTimes(2);
  });

  it("GET /api/guest/faq và GET /api/guest/home dùng chung epoch: invalidateGuestSeoCache làm mới cả hai", async () => {
    await faqHandler(makeGuestHttpEvent("/api/guest/faq"));
    await faqHandler(makeGuestHttpEvent("/api/guest/faq"));
    expect(serviceMocks.listPublishedFaqItems).toHaveBeenCalledTimes(1);

    await homeHandler(makeGuestHttpEvent("/api/guest/home"));
    await homeHandler(makeGuestHttpEvent("/api/guest/home"));
    expect(serviceMocks.countPublishedLevels).toHaveBeenCalledTimes(1);
    expect(serviceMocks.listPublishedFaqItems).toHaveBeenCalledTimes(2);

    await invalidateGuestSeoCache();

    await faqHandler(makeGuestHttpEvent("/api/guest/faq"));
    await homeHandler(makeGuestHttpEvent("/api/guest/home"));
    expect(serviceMocks.listPublishedFaqItems).toHaveBeenCalledTimes(4);
    expect(serviceMocks.countPublishedLevels).toHaveBeenCalledTimes(2);
  });
});
