import { childProfiles, getOwnerDb, grantCredits, users } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import explainReportHandler from "../../server/api/users/ai/explain-report.post.js";
import rewriteGuideHandler from "../../server/api/users/ai/rewrite-guide.post.js";
import suggestContentHandler from "../../server/api/users/ai/suggest-content.post.js";
import summarizeReportHandler from "../../server/api/users/ai/summarize-report.post.js";

function mockEvent(
  method: string,
  userId?: number,
  body: Record<string, unknown> = {}
) {
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
  } as any;
}

describe("User AI Assistant API Endpoints (BR-AIA-01..11)", () => {
  async function createTestParent(initialCredits = 10) {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-api-ai-parent-${uid}@example.com`,
        displayName: "Người dùng API Test",
        status: "active",
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

    const res: any = await summarizeReportHandler(event);
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

    const res: any = await explainReportHandler(event);
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

    const res: any = await suggestContentHandler(event);
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

    const res: any = await rewriteGuideHandler(event);
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
});
