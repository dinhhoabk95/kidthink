import { childProfiles, getOwnerDb, users } from "@kidthink/db";
import { describe, expect, it } from "vitest";
import getPlayHomeHandler from "../../server/api/users/play/home.get";

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
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
        refresh_token_version: 0,
      },
    },
  } as any;
}

describe("Play Entry & Kid Lobby API (BR-PEN-01..07)", () => {
  it("GET /api/users/play/home returns 428 CHILD_SELECTION_REQUIRED when no active_child_id cookie present", async () => {
    const event = mockEvent("GET", 501, {});

    try {
      await getPlayHomeHandler(event);
      expect.fail("Should have thrown 428 CHILD_SELECTION_REQUIRED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(428);
      expect(err.data?.code || err.statusMessage).toBe(
        "CHILD_SELECTION_REQUIRED"
      );
    }
  });

  it("BR-PEN-03 & BR-PEN-04: GET /api/users/play/home returns neutral lock items and competency cards", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `play_home_user_${Date.now()}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Test",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent("GET", user.id, { active_child_id: child.uuid });

    const res = await getPlayHomeHandler(event);
    expect(res.child.display_name).toBe("Bé Test");
    expect(res.competency_cards).toHaveLength(6);
    expect(res.locked_items[0].icon).toBe("🔒");
  });
});
