import {
  childBadges,
  childProfiles,
  competencies,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { describe, expect, it } from "vitest";
import getPlayMapHandler from "../../server/api/users/play/map.get";

const P_LEARN_REGEX = /"p_learn"/i;
const RANK_REGEX = /"rank"/i;
const PERCENTAGE_REGEX = /"percentage"/i;

function mockEvent(
  method: string,
  userId = 501,
  cookies: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        },
        url: "/api/users/play/map",
        originalUrl: "/api/users/play/map",
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
  } as any;
}

describe("Child Play Map API (BR-PRG-02..05, D-MJ, D-MK)", () => {
  it("GET /api/users/play/map returns 428 CHILD_SELECTION_REQUIRED when active_child_id cookie is missing", async () => {
    const event = mockEvent("GET", 501, {});

    try {
      await getPlayMapHandler(event);
      expect.fail("Should have thrown 428 CHILD_SELECTION_REQUIRED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(428);
    }
  });

  it("BR-PRG-02, BR-PRG-03, BR-PRG-05: returns visual map without raw scores or cross-child ranking", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({
        email: `map_user_${ts}@tinimath.test`,
        displayName: "Parent User",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Map",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    // Insert taxonomy
    let [comp] = await db
      .insert(competencies)
      .values({
        code: "C1",
        name: "Số & Đếm",
        colorToken: "blue",
        icon: "icon-c1",
        position: 1,
      })
      .onConflictDoNothing()
      .returning();

    if (!comp) {
      const rows = await db.select().from(competencies).where(undefined);
      comp = rows[0];
    }

    // Insert badge
    await db.insert(childBadges).values({
      childProfileId: child.id,
      badgeCode: "PLAY_DAYS_5",
      awardedAt: new Date(),
    });

    const event = mockEvent("GET", user.id, { active_child_id: child.uuid });
    const res = await getPlayMapHandler(event);

    expect(res.child.display_name).toBe("Bé Map");
    expect(res.badges).toHaveLength(1);
    expect(res.badges[0].badge_code).toBe("PLAY_DAYS_5");
    expect(res.active_regions.length).toBeGreaterThan(0);

    // Verify BR-PRG-02 & BR-PRG-05: response MUST NOT leak raw p_learn numbers or percentages
    const jsonStr = JSON.stringify(res);
    expect(jsonStr).not.toMatch(P_LEARN_REGEX);
    expect(jsonStr).not.toMatch(RANK_REGEX);
    expect(jsonStr).not.toMatch(PERCENTAGE_REGEX);
  });
});
