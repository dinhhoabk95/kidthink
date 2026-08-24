import crypto from "node:crypto";
import {
  childProfiles,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import getRecommendationsHandler from "#server/api/users/play/recommendations.get";

const P_LEARN_REGEX = /"p_learn"/i;
const MASTERY_REGEX = /"mastery"/i;

function mockEvent(
  method: string,
  userId = 601,
  cookies: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const url = `/api/users/play/recommendations${queryString ? `?${queryString}` : ""}`;

  return {
    method,
    node: {
      req: {
        headers: {
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        },
        url,
        originalUrl: url,
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
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
      },
    },
  } as never;
}

describe("User Play Recommendations API (BR-REC-01..08, D-MQ..D-MV)", () => {
  it("GET /api/users/play/recommendations returns 428 when active_child_id cookie is missing", async () => {
    const event = mockEvent("GET", 601, {});

    try {
      await getRecommendationsHandler(event);
      expect.fail("Should have thrown 428 NO_ACTIVE_CHILD");
    } catch (err: unknown) {
      const errorObj = err as {
        statusCode?: number;
        status?: number;
        data?: { code?: string };
      };
      const status = errorObj.statusCode || errorObj.status;
      expect(status).toBe(428);
      expect(errorObj.data?.code).toBe("NO_ACTIVE_CHILD");
    }
  });

  it("GET /api/users/play/recommendations returns 200 with valid primary and alternatives", async () => {
    const db = getOwnerDb();
    const uniqueHex = crypto.randomBytes(4).toString("hex");

    const [u] = await db
      .insert(users)
      .values({
        email: `user-rec-api-${uniqueHex}@example.com`,
        displayName: "Parent API Rec",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé API Rec",
        birthYear: 2021,
        avatarId: "preset_02",
      })
      .returning();

    let [tmpl] = await db.select().from(gameTemplates).limit(1);

    if (!tmpl) {
      [tmpl] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          name: "Nối cặp",
          mechanic: "match",
          status: "active",
        })
        .returning();
    }

    let randEntityId = crypto.randomInt(100_000, 999_999);
    let randCode = `GL-C1-REC-API-${String(crypto.randomInt(1000, 9999))}`;
    let codeExists = true;
    while (codeExists) {
      const [existing] = await db
        .select()
        .from(gameLevels)
        .where(eq(gameLevels.code, randCode))
        .limit(1);
      if (existing) {
        randCode = `GL-C1-REC-API-${String(crypto.randomInt(1000, 9999))}`;
        randEntityId = crypto.randomInt(100_000, 999_999);
      } else {
        codeExists = false;
      }
    }

    await db.insert(gameLevels).values({
      entityId: randEntityId,
      code: randCode,
      contentVersion: 1,
      templateId: tmpl.id,
      title: "Đếm hoa quả API",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
      status: "published",
      thumbnailEmoji: "EMJ-apple",
    });

    const event = mockEvent(
      "GET",
      Number(u.id),
      { active_child_id: child.uuid },
      { limit: "5" }
    );

    const res = await getRecommendationsHandler(event);

    expect(res).toBeDefined();
    expect(res.primary).toBeDefined();
    expect(res.primary.level_code).toBeTruthy();
    expect(res.primary.title).toBeTruthy();
    expect(res.primary.reason).toBeTruthy();
    expect(res.primary.reason_code).toBeTruthy();
    expect(Array.isArray(res.alternatives)).toBe(true);
    expect(res.alternatives.length).toBeLessThanOrEqual(4);

    // Response strictly excludes raw p_learn or internal mastery numbers
    const jsonStr = JSON.stringify(res);
    expect(jsonStr).not.toMatch(P_LEARN_REGEX);
    expect(jsonStr).not.toMatch(MASTERY_REGEX);
  });
});
