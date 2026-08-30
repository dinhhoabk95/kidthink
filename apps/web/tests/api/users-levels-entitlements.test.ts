import { entitlementKeys, entitlements, getOwnerDb, users } from "@mindkid/db";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import usersLevelsHandler from "#server/api/users/levels/index.get";

interface UsersLevelsResponse {
  items: Array<{
    code: string;
    title: string;
    access_tier: string;
    locked: boolean;
  }>;
  next_cursor: string | null;
}

function makeMockEvent(
  user: { user_id: number; display_name: string },
  query: Record<string, string> = {}
): H3Event {
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const url = queryString
    ? `/api/users/levels?${queryString}`
    : "/api/users/levels";

  const event = {
    method: "GET",
    path: url,
    url,
    node: {
      req: {
        method: "GET",
        headers: {},
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
      user,
      query,
    },
  };

  return event as H3Event;
}

describe("GET /api/users/levels — Entitlements Resolution Regression (T.4)", () => {
  const db = getOwnerDb();
  let testUserId = 0;
  const testEmail = `entitlement_test_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Ensure entitlementKey exists
    await db
      .insert(entitlementKeys)
      .values({
        key: "play_standard_games",
        group: "content",
        label: "Chơi game tiêu chuẩn",
        description: "Mở khoá game bậc tiêu chuẩn",
        isMvp: true,
      })
      .onConflictDoNothing();

    // Create user and standard entitlement
    const [createdUser] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Entitlement Test User",
        status: "active",
      })
      .returning({ id: users.id });

    if (createdUser) {
      testUserId = createdUser.id;
      await db.insert(entitlements).values([
        {
          userId: testUserId,
          entitlementKey: "play_standard_games",
          source: "package_order",
          status: "active",
          startsAt: new Date(Date.now() - 10_000),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ]);
    }
  });

  afterAll(async () => {
    if (testUserId > 0) {
      await db.delete(entitlements).where(eq(entitlements.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("người dùng có entitlement standard mở khoá đúng standard games", async () => {
    const event = makeMockEvent(
      { user_id: testUserId, display_name: "Entitlement Test User" },
      { limit: "20" }
    );

    const res = (await usersLevelsHandler(event)) as UsersLevelsResponse;
    expect(res).toBeDefined();
    expect(res.items).toBeDefined();

    // Standard items are not locked for standard user
    const standardItems = res.items.filter((i) => i.access_tier === "standard");
    if (standardItems.length > 0) {
      for (const item of standardItems) {
        expect(item.locked).toBe(false);
      }
    }
  });
});
