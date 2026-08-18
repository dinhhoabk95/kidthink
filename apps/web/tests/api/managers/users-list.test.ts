import { childProfiles, getOwnerDb, users } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/users/index.get";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  url = "/api/managers/users"
) {
  return {
    method: "GET",
    node: {
      req: {
        headers: {},
        url,
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Super Admin",
              session_id: "sess_mgr_1",
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 2 — GET /api/managers/users (BR-USM-01, BR-USM-02, BR-USM-06, D-JC)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = mockEvent();
    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects content_reviewer with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockEvent("content_reviewer");
    try {
      await handler(event);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("BR-USM-01 & D-JC: clamps limit to 100 max when limit=500 is passed", async () => {
    const event = mockEvent("super_admin", "/api/managers/users?limit=500");
    const res = await handler(event);
    expect(res).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.items.length).toBeLessThanOrEqual(100);
  });

  it("BR-USM-02 & D-JC: handles special characters and wildcards (', %, _) safely with 200", async () => {
    const event = mockEvent(
      "super_admin",
      "/api/managers/users?q=%27%25test_%22"
    );
    const res = await handler(event);
    expect(res).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
  });

  it("BR-USM-06: returns child_count only and NEVER exposes child names, birth years, or mastery", async () => {
    const db = getOwnerDb();
    const testEmail = `test_parent_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

    // Seed test parent user
    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Test Parent User",
        status: "active",
      })
      .returning();

    // Seed child profile for parent
    await db.insert(childProfiles).values({
      userId: user.id,
      displayName: "Bé An Bí Mật",
      birthYear: 2020,
      avatarId: "avatar-preset-01",
      status: "active",
    });

    const event = mockEvent(
      "super_admin",
      `/api/managers/users?q=${encodeURIComponent(testEmail)}`
    );
    const res = await handler(event);

    expect(res.items.length).toBeGreaterThanOrEqual(1);
    const found = res.items.find((item: any) => item.email === testEmail);
    expect(found).toBeDefined();
    expect(found.child_count).toBe(1);
    expect(found.display_name).toBe("Test Parent User");

    // BR-USM-06: STRICTLY no child name or child details in user list item
    expect((found as any).children).toBeUndefined();
    expect((found as any).child_names).toBeUndefined();
    expect((found as any).mastery).toBeUndefined();
    expect(JSON.stringify(found)).not.toContain("Bé An Bí Mật");
  });
});
