import crypto from "node:crypto";
import { gameLevels, getOwnerDb } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import getGuestRecommendationsHandler from "#server/api/guest/play/recommendations.get";

function mockGuestEvent(method: string, query: Record<string, string> = {}) {
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const url = `/api/guest/play/recommendations${queryString ? `?${queryString}` : ""}`;

  return {
    method,
    node: {
      req: {
        headers: {},
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
    context: {},
  } as never;
}

describe("Guest Play Recommendations API (BR-REC-04, BR-REC-06, D-MW)", () => {
  it("GET /api/guest/play/recommendations returns 200 with allow-list free content only", async () => {
    const db = getOwnerDb();

    // Insert free level
    await db.insert(gameLevels).values({
      code: `GL-C1-GUEST-FREE-${String(crypto.randomInt(1000, 9999))}`,
      templateCode: "GT-001",
      title: "Trò chơi khách",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
      thumbnailEmoji: "⭐",
    });

    // Insert standard level (negative test: must never be returned to guest)
    await db.insert(gameLevels).values({
      code: `GL-C1-GUEST-STD-${String(crypto.randomInt(1000, 9999))}`,
      templateCode: "GT-001",
      title: "Trò chơi khoá",
      contentPack: {},
      difficultyParams: {},
      accessTier: "standard",
      ageMin: 3,
      ageMax: 5,
      difficulty: 2,
      thumbnailEmoji: "🔒",
    });

    const event = mockGuestEvent("GET", { age_band: "3-4", limit: "5" });
    const res = await getGuestRecommendationsHandler(event);

    expect(res).toBeDefined();
    expect(res.primary).toBeDefined();
    expect(res.primary.access_tier).toBe("free");
    expect(res.primary.locked).toBe(false);

    for (const alt of res.alternatives) {
      expect(alt.access_tier).toBe("free");
      expect(alt.locked).toBe(false);
    }
  });
});
