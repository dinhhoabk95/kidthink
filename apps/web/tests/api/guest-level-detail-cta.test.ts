import { gameLevels, getOwnerDb } from "@mindkid/db";
import type { AccessTier, LevelCta } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import guestLevelDetailHandler from "#server/api/guest/levels/[code]/index.get";

interface LevelDetailResult {
  code: string;
  title: string;
  access_tier: AccessTier;
  locked: boolean;
  cta: LevelCta;
}

function makeMockEvent(
  params: Record<string, string>,
  authContext?: { user?: { user_id: number; display_name: string } },
  cookies: Record<string, string> = {}
): H3Event {
  const responseHeaders: Record<string, string> = {};
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const event = {
    method: "GET",
    node: {
      req: {
        method: "GET",
        headers: {
          cookie: cookieHeader,
        },
        url: `/api/guest/levels/${params.code}`,
        originalUrl: `/api/guest/levels/${params.code}`,
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
      params,
      user: authContext?.user,
    },
  };

  return event as H3Event;
}

describe("GET /api/guest/levels/[code] — Detail CTA by Session (BR-GDP-09, BR-GAT-09, T.3)", () => {
  const db = getOwnerDb();
  const baseNum = 7100 + Math.floor(Math.random() * 800);

  const allowlistFreeCode = "GL-C1-CNT-CARD-0001";
  let insertedAllowlistFree = false;
  const freeCode = `GL-C1-CNT-CARD-${baseNum + 1}`;
  const loginCode = `GL-C1-CNT-CARD-${baseNum + 2}`;
  const standardCode = `GL-C1-CNT-CARD-${baseNum + 3}`;
  const premiumCode = `GL-C1-CNT-CARD-${baseNum + 4}`;

  beforeAll(async () => {
    const [existingAllowlist] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(eq(gameLevels.code, allowlistFreeCode))
      .limit(1);

    if (!existingAllowlist) {
      await db.insert(gameLevels).values({
        code: allowlistFreeCode,
        title: "Allowlist Free Level",
        accessTier: "free",
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        themeId: "farm",
        templateCode: "GT-001",
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      });
      insertedAllowlistFree = true;
    }

    await db.insert(gameLevels).values([
      {
        code: freeCode,
        title: "Test Free Level",
        accessTier: "free",
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        themeId: "farm",
        templateCode: "GT-001",
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        code: loginCode,
        title: "Test Login Level",
        accessTier: "login",
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        themeId: "farm",
        templateCode: "GT-001",
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        code: standardCode,
        title: "Test Standard Level",
        accessTier: "standard",
        difficulty: 2,
        ageMin: 4,
        ageMax: 5,
        themeId: "farm",
        templateCode: "GT-001",
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
      {
        code: premiumCode,
        title: "Test Premium Level",
        accessTier: "premium",
        difficulty: 3,
        ageMin: 5,
        ageMax: 6,
        themeId: "farm",
        templateCode: "GT-001",
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      },
    ]);
  });

  afterAll(async () => {
    if (insertedAllowlistFree) {
      await db.delete(gameLevels).where(eq(gameLevels.code, allowlistFreeCode));
    }
    await db.delete(gameLevels).where(eq(gameLevels.code, freeCode));
    await db.delete(gameLevels).where(eq(gameLevels.code, loginCode));
    await db.delete(gameLevels).where(eq(gameLevels.code, standardCode));
    await db.delete(gameLevels).where(eq(gameLevels.code, premiumCode));
  });

  it("BR-LAD-07: guest xem free level trong allow-list -> locked: false, action: play", async () => {
    const event = makeMockEvent({ code: allowlistFreeCode });
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    expect(res.locked).toBe(false);
    expect(res.cta.action).toBe("play");
    expect(res.cta.href).toBe(`/play/${allowlistFreeCode}`);
    expect(res.cta.text).toBe("Cho bé chơi ngay");
  });

  it("BR-LAD-07: guest xem mọi free level -> locked: false, action: play", async () => {
    const event = makeMockEvent({ code: freeCode });
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    expect(res.locked).toBe(false);
    expect(res.cta.action).toBe("play");
    expect(res.cta.href).toBe(`/play/${freeCode}`);
    expect(res.cta.text).toBe("Cho bé chơi ngay");
  });

  it("guest xem login level -> action: login", async () => {
    const event = makeMockEvent({ code: loginCode });
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    expect(res.locked).toBe(true);
    expect(res.cta.action).toBe("login");
    expect(res.cta.href).toBe(
      `/login?redirect=${encodeURIComponent(`/play/${loginCode}`)}`
    );
    expect(res.cta.text).toBe("Đăng nhập để chơi");
  });

  it("guest xem standard level -> action: upgrade_standard", async () => {
    const event = makeMockEvent({ code: standardCode });
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    expect(res.locked).toBe(true);
    expect(res.cta.action).toBe("upgrade_standard");
    expect(res.cta.href).toBe("/pricing");
  });

  it("user chưa có active child xem login level -> action: select_child", async () => {
    const event = makeMockEvent(
      { code: loginCode },
      { user: { user_id: 999_991, display_name: "Parent A" } }
    );
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    expect(res.cta.action).toBe("select_child");
    expect(res.cta.href).toBe(
      `/me/children?redirect=${encodeURIComponent(`/play/${loginCode}`)}`
    );
    expect(res.cta.text).toBe("Chọn hồ sơ bé");
  });

  it("user chưa có child và chưa có gói xem standard level -> action: upgrade_standard (BR-GAT-09)", async () => {
    const event = makeMockEvent(
      { code: standardCode },
      { user: { user_id: 999_992, display_name: "Parent B" } }
    );
    const res = (await guestLevelDetailHandler(event)) as LevelDetailResult;

    // BR-GAT-09: Thiếu cả gói lẫn child -> ưu tiên mời nâng cấp gói
    expect(res.cta.action).toBe("upgrade_standard");
    expect(res.cta.href).toBe("/pricing");
  });

  it("level không tồn tại ném 404 NOT_FOUND", async () => {
    const event = makeMockEvent({ code: `GL-C1-CNT-CARD-${baseNum + 99}` });
    await expect(guestLevelDetailHandler(event)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
