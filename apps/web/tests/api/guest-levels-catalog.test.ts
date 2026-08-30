import { gameLevels, gameTemplates, getOwnerDb } from "@mindkid/db";
import type { AccessTier, LevelCta } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import guestLevelsHandler from "#server/api/guest/levels/index.get";

interface CatalogItemResult {
  code: string;
  title: string;
  access_tier: AccessTier;
  locked: boolean;
  cta: LevelCta;
  content_pack?: unknown;
  difficulty_params?: unknown;
}

interface CatalogResponseResult {
  items: CatalogItemResult[];
  total: number;
  facets: Record<string, Record<string, number>>;
  next_cursor: string | null;
}

function makeMockEvent(
  query: Record<string, string> = {},
  headers: Record<string, string> = {}
): H3Event {
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const url = queryString
    ? `/api/guest/levels?${queryString}`
    : "/api/guest/levels";

  const event = {
    method: "GET",
    path: url,
    url,
    node: {
      req: {
        method: "GET",
        headers,
        url,
        originalUrl: url,
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      query,
    },
  };

  return event as H3Event;
}

describe("GET /api/guest/levels — Catalog CTA & Session Independence (BR-GCP-02, BR-GCP-09, T.2)", () => {
  const db = getOwnerDb();
  const baseNum = 8100 + Math.floor(Math.random() * 800);

  const testCodes = [
    `GL-C1-CNT-CARD-${baseNum + 1}`,
    `GL-C1-CNT-CARD-${baseNum + 2}`,
    `GL-C1-CNT-CARD-${baseNum + 3}`,
    `GL-C1-CNT-CARD-${baseNum + 4}`,
  ];

  beforeAll(async () => {
    const [template] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-001",
        name: "Test Template",
        mechanic: "tap_target",
      })
      .onConflictDoNothing()
      .returning();

    const templateId = template
      ? template.id
      : (
          await db
            .select({ id: gameTemplates.id })
            .from(gameTemplates)
            .where(eq(gameTemplates.code, "GT-001"))
        )[0]?.id || 1;

    await db.insert(gameLevels).values([
      {
        entityId: baseNum + 1000,
        code: testCodes[0],
        title: "Catalog Free Level",
        status: "published",
        accessTier: "free",
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        themeId: "farm",
        templateId,
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        entityId: baseNum + 1001,
        code: testCodes[1],
        title: "Catalog Login Level",
        status: "published",
        accessTier: "login",
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        themeId: "farm",
        templateId,
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        entityId: baseNum + 1002,
        code: testCodes[2],
        title: "Catalog Standard Level",
        status: "published",
        accessTier: "standard",
        difficulty: 2,
        ageMin: 4,
        ageMax: 5,
        themeId: "farm",
        templateId,
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        entityId: baseNum + 1003,
        code: testCodes[3],
        title: "Catalog Premium Level",
        status: "published",
        accessTier: "premium",
        difficulty: 3,
        ageMin: 5,
        ageMax: 6,
        themeId: "farm",
        templateId,
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
    ]);
  });

  afterAll(async () => {
    for (const code of testCodes) {
      await db.delete(gameLevels).where(eq(gameLevels.code, code));
    }
  });

  it("trả danh mục có cta theo góc nhìn guest cho mọi tier", async () => {
    const event = makeMockEvent({ limit: "50" });
    const res = (await guestLevelsHandler(event)) as CatalogResponseResult;

    expect(res).toBeDefined();
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      expect(item.cta).toBeDefined();
      expect(item.cta.href).toBeDefined();
      expect(item.cta.text).toBeDefined();

      if (item.access_tier === "free") {
        expect(item.cta.action).toBe("play");
        expect(item.cta.href).toBe(`/play/${item.code}`);
      } else if (item.access_tier === "login") {
        expect(item.cta.action).toBe("login");
        expect(item.cta.href).toBe(
          `/login?redirect=${encodeURIComponent(`/play/${item.code}`)}`
        );
      } else if (item.access_tier === "standard") {
        expect(item.cta.action).toBe("upgrade_standard");
        expect(item.cta.href).toBe("/pricing");
      } else if (item.access_tier === "premium") {
        expect(item.cta.action).toBe("upgrade_premium");
        expect(item.cta.href).toBe("/pricing");
      }

      // BR-GCP-02: Không leak content_pack hay difficulty_params
      expect(item.content_pack).toBeUndefined();
      expect(item.difficulty_params).toBeUndefined();
    }
  });

  it("giữ nguyên góc nhìn guest kể cả khi request gửi header auth giả định (BR-GCP-09)", async () => {
    const guestEvent = makeMockEvent({ limit: "10" });
    const fakeAuthEvent = makeMockEvent(
      { limit: "10" },
      {
        authorization: "Bearer fake-token",
        cookie: "mindkid-user-session=fake-session",
      }
    );

    const guestRes = (await guestLevelsHandler(
      guestEvent
    )) as CatalogResponseResult;
    const fakeAuthRes = (await guestLevelsHandler(
      fakeAuthEvent
    )) as CatalogResponseResult;

    expect(guestRes.items.map((i) => i.cta)).toEqual(
      fakeAuthRes.items.map((i) => i.cta)
    );
  });
});
