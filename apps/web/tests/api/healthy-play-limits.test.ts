import { createParentGateToken } from "@mindkid/auth";
import {
  childDailyStats,
  childProfiles,
  gameLevels,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { computeRemainingPlaySeconds, getDateIct } from "@mindkid/shared";
import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";
import grantExtraTimeHandler from "#server/api/users/children/[uuid]/grant-extra-time.post";
import playBudgetHandler from "#server/api/users/children/[uuid]/play-budget.get";
import updateSettingsHandler from "#server/api/users/children/[uuid]/settings.patch";
import { deliverGameConfig } from "#server/utils/game-config-runtime";

const PARENT_GATE_SECRET = process.env.PARENT_GATE_SECRET as string;

interface HttpErrorLike {
  statusCode?: number;
  status?: number;
  code?: string;
}

function extractErrorStatusAndCode(err: object | null): {
  status?: number;
  code?: string;
} {
  if (!err) {
    return {};
  }
  const shaped = err as HttpErrorLike;
  return {
    status: shaped.statusCode ?? shaped.status,
    code: shaped.code,
  };
}

function mockEvent(
  method: string,
  user: { id: number; displayName: string },
  params: Record<string, string> = {},
  body: Record<string, string | number | boolean> = {}
): H3Event {
  const csrf =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const responseHeaders: Record<string, string> = {};
  const fakeEvent = {
    method,
    path: "/",
    url: "/",
    node: {
      req: {
        headers: {
          "x-csrf-token": csrf,
          cookie: `tm_u_csrf=${csrf}`,
        },
        url: "/",
        originalUrl: "/",
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
      user: {
        user_id: user.id,
        display_name: user.displayName,
        session_id: `sess_${user.id}`,
      },
      params,
      body,
    },
    routerParams: params,
    _body: body,
  };
  return fakeEvent as Parameters<typeof playBudgetHandler>[0];
}

async function createTestUserWithChildren() {
  const db = getOwnerDb();
  const email = `play_limits_user_${Date.now()}_${Math.random()}@tinimath.test`;

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "hash123",
      displayName: "Parent User",
    })
    .returning();

  const [childA] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé A",
      birthYear: 2020,
      avatarId: "bunny_1",
      dailyPlayCapMinutes: 30,
    })
    .returning();

  const [childB] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé B",
      birthYear: 2021,
      avatarId: "bear_1",
      dailyPlayCapMinutes: 30,
    })
    .returning();

  return { user, childA, childB };
}

async function seedPublishedFreeLevel(): Promise<string> {
  const db = getOwnerDb();
  const suffix = Math.floor(Math.random() * 89_999 + 10_000);
  const code = `GL-C1-HPL-${suffix}`;
  await db.insert(gameLevels).values({
    entityId: suffix,
    code,
    contentVersion: 1,
    templateCode: "GT-001",
    title: "Level HPL Test",
    instruction: "Chọn quả táo đỏ",
    contentPack: {
      prompt: "Bé hãy chọn quả táo đỏ",
      target_item: {
        item_id: "i1",
        asset: { kind: "emoji", ref: "🍎" },
      },
      options: [
        {
          item_id: "i1",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "i2",
          asset: { kind: "emoji", ref: "🍏" },
          is_correct: false,
        },
      ],
    },
    difficultyParams: {},
    accessTier: "free",
    status: "published",
    ageMin: 3,
    ageMax: 6,
  });
  return code;
}

describe.sequential("Healthy Play Limits API (BR-HPL-01..08 & Task #293 S1-S2)", () => {
  it("computeRemainingPlaySeconds: pure calculation for null stats, exhausted cap, and extra time granted", () => {
    // 1. Chưa có row hôm nay -> trả cap * 60
    expect(computeRemainingPlaySeconds(null, 30)).toBe(1800);

    // 2. totalPlayTimeSeconds >= cap -> trả 0
    expect(
      computeRemainingPlaySeconds(
        { totalPlayTimeSeconds: 1800, extraTimeGrantedMinutes: 0 },
        30
      )
    ).toBe(0);

    // 3. Có extraTimeGrantedMinutes = 15 -> cộng 900s vào ngân sách
    expect(
      computeRemainingPlaySeconds(
        { totalPlayTimeSeconds: 1800, extraTimeGrantedMinutes: 15 },
        30
      )
    ).toBe(900);
  });

  it("GET /play-budget returns correct budget and ICT reset time", async () => {
    const db = getOwnerDb();
    const { user, childA } = await createTestUserWithChildren();
    const dateIct = getDateIct();

    // Insert 10 minutes played (600 seconds)
    await db.insert(childDailyStats).values({
      childProfileId: childA.id,
      dateIct,
      totalPlayTimeSeconds: 600,
    });

    const event = mockEvent("GET", user, { uuid: childA.uuid });

    const res = await playBudgetHandler(event);
    expect(res.cap_minutes).toBe(30);
    expect(res.used_minutes).toBe(10);
    expect(res.remaining_minutes).toBe(20);
    expect(res.resets_at).toBeDefined();
  });

  it("BR-HPL-08: PATCH /settings rejects cap > package cap with 422", async () => {
    const { user, childA } = await createTestUserWithChildren();

    const event = mockEvent(
      "PATCH",
      user,
      { uuid: childA.uuid },
      { daily_play_cap_minutes: 90 }
    );

    try {
      await updateSettingsHandler(event);
      expect.fail("Should have thrown 422");
    } catch (err) {
      const { status } = extractErrorStatusAndCode(
        err instanceof Object ? err : null
      );
      expect(status).toBe(422);
    }
  });

  it("BR-HPL-06: POST /grant-extra-time rejects request without valid gate_token with 403", async () => {
    const { user, childA } = await createTestUserWithChildren();

    const eventNoToken = mockEvent(
      "POST",
      user,
      { uuid: childA.uuid },
      { minutes: 15 }
    );

    try {
      await grantExtraTimeHandler(eventNoToken);
      expect.fail("Should have thrown 403");
    } catch (err) {
      const { status } = extractErrorStatusAndCode(
        err instanceof Object ? err : null
      );
      expect(status).toBe(403);
    }
  });

  it("POST /grant-extra-time accepts valid gate_token and grants up to 30 mins", async () => {
    const { user, childA } = await createTestUserWithChildren();
    const validGateToken = createParentGateToken(
      user.id,
      Date.now() + 300_000,
      PARENT_GATE_SECRET
    );

    const event = mockEvent(
      "POST",
      user,
      { uuid: childA.uuid },
      { minutes: 15, gate_token: validGateToken }
    );

    const res = await grantExtraTimeHandler(event);
    expect(res.success).toBe(true);
    expect(res.granted_minutes).toBe(15);
  });

  it("BR-HPL-01: limits are enforced per child (child A exhausted does not affect child B)", async () => {
    const db = getOwnerDb();
    const { user, childA, childB } = await createTestUserWithChildren();
    const dateIct = getDateIct();

    // Exhaust Child A (30 mins = 1800 seconds)
    await db.insert(childDailyStats).values({
      childProfileId: childA.id,
      dateIct,
      totalPlayTimeSeconds: 1800,
    });

    // Check Child A budget
    const eventA = mockEvent("GET", user, { uuid: childA.uuid });
    const resA = await playBudgetHandler(eventA);
    expect(resA.remaining_minutes).toBe(0);

    // Check Child B budget (0 seconds used)
    const eventB = mockEvent("GET", user, { uuid: childB.uuid });
    const resB = await playBudgetHandler(eventB);
    expect(resB.remaining_minutes).toBe(30);
  });

  it("BR-HPL-06: daily extra-time accumulation capped at 30 minutes total", async () => {
    const { user, childA } = await createTestUserWithChildren();
    const validGateToken = createParentGateToken(
      user.id,
      Date.now() + 300_000,
      PARENT_GATE_SECRET
    );

    // First grant: 20 minutes — should succeed
    const event1 = mockEvent(
      "POST",
      user,
      { uuid: childA.uuid },
      { minutes: 20, gate_token: validGateToken }
    );
    const res1 = await grantExtraTimeHandler(event1);
    expect(res1.success).toBe(true);
    expect(res1.daily_granted_total).toBe(20);

    // Second grant: 15 minutes — total 35 > 30, should reject with 422
    const event2 = mockEvent(
      "POST",
      user,
      { uuid: childA.uuid },
      { minutes: 15, gate_token: validGateToken }
    );
    try {
      await grantExtraTimeHandler(event2);
      expect.fail("Should have thrown 422 for exceeding daily grant limit");
    } catch (err) {
      const { status } = extractErrorStatusAndCode(
        err instanceof Object ? err : null
      );
      expect(status).toBe(422);
    }
  });

  it("Task #293 S1 & S2: blocks config delivery with 402 DAILY_PLAY_CAP_REACHED when child cap exhausted, exempts guest/preview, and unlocks after grant-extra-time", async () => {
    const db = getOwnerDb();
    const { user, childA } = await createTestUserWithChildren();
    const levelCode = await seedPublishedFreeLevel();
    const dateIct = getDateIct();

    // Exhaust Child A (30 mins = 1800 seconds)
    await db.insert(childDailyStats).values({
      childProfileId: childA.id,
      dateIct,
      totalPlayTimeSeconds: 1800,
      extraTimeGrantedMinutes: 0,
    });

    const event = mockEvent("GET", user, { code: levelCode });

    // 1. Child A bị chặn 402 DAILY_PLAY_CAP_REACHED khi bắt đầu ván mới
    try {
      await deliverGameConfig(event, levelCode, {
        caller: {
          kind: "user",
          user_id: String(user.id),
          active_child_id: childA.uuid,
        },
      });
      expect.fail("Should have thrown 402 DAILY_PLAY_CAP_REACHED");
    } catch (err) {
      const { status, code } = extractErrorStatusAndCode(
        err instanceof Object ? err : null
      );
      expect(status).toBe(402);
      expect(code).toBe("DAILY_PLAY_CAP_REACHED");
    }

    // 2. Guest và Manager Preview được miễn (BR-HPL-03)
    const guestPayload = await deliverGameConfig(event, levelCode, {
      caller: { kind: "guest" },
      guestDeviceId: "guest-device-hpl",
    });
    expect(guestPayload.level_code).toBe(levelCode);

    const previewPayload = await deliverGameConfig(event, levelCode, {
      caller: { kind: "manager", role: "content_reviewer" },
      isManagerPreview: true,
    });
    expect(previewPayload.is_preview).toBe(true);

    // 3. Phụ huynh cấp thêm 15 phút -> play-budget còn 15 phút và mở lại 200 cho Child A
    const validGateToken = createParentGateToken(
      user.id,
      Date.now() + 300_000,
      PARENT_GATE_SECRET
    );
    const grantEvent = mockEvent(
      "POST",
      user,
      { uuid: childA.uuid },
      { minutes: 15, gate_token: validGateToken }
    );
    await grantExtraTimeHandler(grantEvent);

    const budgetRes = await playBudgetHandler(
      mockEvent("GET", user, { uuid: childA.uuid })
    );
    expect(budgetRes.used_minutes).toBe(30);
    expect(budgetRes.remaining_minutes).toBe(15);

    const unlockedPayload = await deliverGameConfig(event, levelCode, {
      caller: {
        kind: "user",
        user_id: String(user.id),
        active_child_id: childA.uuid,
      },
    });
    expect(unlockedPayload.level_code).toBe(levelCode);
  });
});
