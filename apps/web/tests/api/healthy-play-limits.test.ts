import { createParentGateToken } from "@kidthink/auth";
import {
  childDailyStats,
  childProfiles,
  getOwnerDb,
  users,
} from "@kidthink/db";
import { getDateIct } from "@kidthink/shared";
import { describe, expect, it } from "vitest";
import grantExtraTimeHandler from "../../server/api/users/children/[uuid]/grant-extra-time.post";
import playBudgetHandler from "../../server/api/users/children/[uuid]/play-budget.get";
import updateSettingsHandler from "../../server/api/users/children/[uuid]/settings.patch";

const PARENT_GATE_SECRET =
  process.env.NUXT_PARENT_GATE_SECRET ||
  process.env.PARENT_GATE_SECRET ||
  "kidthink-parent-gate-secret-key-default-2026";

function mockEvent(
  method: string,
  user: { id: number; displayName: string },
  params: Record<string, string> = {},
  body: any = {}
) {
  const csrf =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const responseHeaders: Record<string, string> = {};
  return {
    method,
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
        refresh_token_version: 0,
      },
      params,
      body,
    },
    routerParams: params,
    _body: body,
  } as any;
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

describe.sequential("Healthy Play Limits API (BR-HPL-01..08 & HEALTHY-PLAY-LIMITS spec)", () => {
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
    } catch (err: any) {
      const status = err.statusCode || err.status;
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
    } catch (err: any) {
      const status = err.statusCode || err.status;
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
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(422);
    }
  });
});
