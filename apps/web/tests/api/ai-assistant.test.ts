import {
  childProfiles,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  SEED_ENTITLEMENT_KEYS,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { beforeAll, describe, expect, it } from "vitest";
import explainReportHandler from "#server/api/users/ai/explain-report.post";
import rewriteGuideHandler from "#server/api/users/ai/rewrite-guide.post";
import suggestContentHandler from "#server/api/users/ai/suggest-content.post";
import summarizeReportHandler from "#server/api/users/ai/summarize-report.post";
import { getCreditBalance, grantCredits } from "#server/services/index.js";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";

type MockBody = Record<string, string | number | boolean>;

function mockEvent(
  method: string,
  userId?: number,
  body: MockBody = {}
): Parameters<typeof summarizeReportHandler>[0] {
  const responseHeaders: Record<string, string> = {};
  const csrfToken = "a".repeat(64);
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        url: "/api/users/ai/endpoint",
        originalUrl: "/api/users/ai/endpoint",
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
      body,
      user: userId
        ? {
            user_id: userId,
            display_name: "Parent Test",
            session_id: `sess_${userId}`,
          }
        : undefined,
    },
    _body: body,
  } as Parameters<typeof summarizeReportHandler>[0];
}

describe("User AI Assistant API Endpoints (BR-AIA-01..11)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const key of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(key).onConflictDoNothing();
    }
  });

  async function createTestParent(
    initialCredits = 10,
    aiEntitlement: "active" | "none" | "expired" = "active"
  ) {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-api-ai-parent-${uid}@example.com`,
        displayName: "Người dùng API Test",
        status: USER_STATUS.ACTIVE,
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé API AI",
        birthYear: 2021,
        avatarId: "preset_lion_01",
      })
      .returning();

    if (aiEntitlement !== "none") {
      const expiresAt =
        aiEntitlement === "expired"
          ? new Date(Date.now() - 60_000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(entitlements).values({
        userId: user.id,
        entitlementKey: "use_ai_analysis",
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        status: ENTITLEMENT_STATUS.ACTIVE,
        expiresAt,
      });
    }
    await invalidateUserEntitlementsCache(user.id);

    if (initialCredits > 0) {
      await grantCredits({
        userId: user.id,
        delta: initialCredits,
        reason: "purchase",
        refType: "payment_order",
        refId: `order-api-ai-${uid}`,
      });
    }

    return { user, child };
  }

  it("POST /api/users/ai/summarize-report returns 401 when not logged in", async () => {
    const event = mockEvent("POST", undefined, {
      child_uuid: "11111111-2222-3333-4444-555555555555",
    });

    await expect(summarizeReportHandler(event)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("POST /api/users/ai/summarize-report returns 404 for unowned child", async () => {
    const { user: userA } = await createTestParent(5);
    const { child: childB } = await createTestParent(5);

    const event = mockEvent("POST", userA.id, {
      child_uuid: childB.uuid,
    });

    await expect(summarizeReportHandler(event)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("POST /api/users/ai/summarize-report returns 200 with summary and label 'Gợi ý'", async () => {
    const { user, child } = await createTestParent(5);

    const event = mockEvent("POST", user.id, {
      child_uuid: child.uuid,
      period_days: 30,
    });

    const res = await summarizeReportHandler(event);
    expect(res.label).toBe("Gợi ý");
    expect(res.credits_spent).toBe(1);
    expect(res.summary).toBeDefined();
  });

  it("POST /api/users/ai/explain-report returns 200 with explanation and label 'Gợi ý'", async () => {
    const { user, child } = await createTestParent(5);

    const event = mockEvent("POST", user.id, {
      child_uuid: child.uuid,
      period_days: 30,
    });

    const res = await explainReportHandler(event);
    expect(res.label).toBe("Gợi ý");
    expect(res.credits_spent).toBe(1);
    expect(res.explanation).toBeDefined();
  });

  it("POST /api/users/ai/suggest-content returns 200 with suggestions", async () => {
    const { user } = await createTestParent(5);

    const event = mockEvent("POST", user.id, {
      content_type: "game",
      limit: 3,
    });

    const res = await suggestContentHandler(event);
    expect(res.label).toBe("Gợi ý");
    expect(res.credits_spent).toBe(1);
    expect(Array.isArray(res.suggestions)).toBe(true);
  });

  it("POST /api/users/ai/rewrite-guide returns 200 with rewritten guide", async () => {
    const { user } = await createTestParent(5);

    const event = mockEvent("POST", user.id, {
      guide_text: "Hướng dẫn bé so sánh hai nhóm đồ vật nhiều hơn và ít hơn.",
      target_audience: "home",
    });

    const res = await rewriteGuideHandler(event);
    expect(res.label).toBe("Gợi ý");
    expect(res.credits_spent).toBe(2);
    expect(res.rewritten_guide).toBeDefined();
  });

  it("POST /api/users/ai/summarize-report returns 402 when credits are 0", async () => {
    const { user, child } = await createTestParent(0);

    const event = mockEvent("POST", user.id, {
      child_uuid: child.uuid,
    });

    await expect(summarizeReportHandler(event)).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  it("POST /api/users/ai/summarize-report returns 403 ENTITLEMENT_REQUIRED without debiting credits when use_ai_analysis is missing", async () => {
    const { user, child } = await createTestParent(5, "none");

    const event = mockEvent("POST", user.id, {
      child_uuid: child.uuid,
      period_days: 30,
    });

    await expect(summarizeReportHandler(event)).rejects.toMatchObject({
      statusCode: 403,
      code: "ENTITLEMENT_REQUIRED",
    });

    const wallet = await getCreditBalance(user.id);
    expect(wallet.balance).toBe(5);
  });

  it("POST /api/users/ai/summarize-report returns 403 ENTITLEMENT_REQUIRED without debiting credits when use_ai_analysis is expired", async () => {
    const { user, child } = await createTestParent(5, "expired");

    const event = mockEvent("POST", user.id, {
      child_uuid: child.uuid,
      period_days: 30,
    });

    await expect(summarizeReportHandler(event)).rejects.toMatchObject({
      statusCode: 403,
      code: "ENTITLEMENT_REQUIRED",
    });

    const wallet = await getCreditBalance(user.id);
    expect(wallet.balance).toBe(5);
  });
});
