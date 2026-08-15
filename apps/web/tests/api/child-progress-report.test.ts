import { childProfiles, entitlements, getOwnerDb, users } from "@kidthink/db";
import { describe, expect, it } from "vitest";
import getProgressHandler from "../../server/api/users/children/[uuid]/progress.get";
import { invalidateUserEntitlementsCache } from "../../server/utils/entitlements-runtime.js";

function mockEvent(
  method: string,
  userId = 501,
  params: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {},
        url: `/api/users/children/${params.uuid ?? ""}/progress`,
        originalUrl: `/api/users/children/${params.uuid ?? ""}/progress`,
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
      params,
      user: {
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
        refresh_token_version: 0,
      },
    },
  } as any;
}

describe("Adult Progress & Mastery Report API (BR-PRG-05, BR-PRG-08, D-MO)", () => {
  it("returns 403 ENTITLEMENT_REQUIRED when user lacks view_basic_report entitlement", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({ email: `no_ent_${ts}@test.com`, displayName: "User No Ent" })
      .returning();

    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé No Ent",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent("GET", user.id, { uuid: child.uuid });

    try {
      await getProgressHandler(event);
      expect.fail("Should throw 403 ENTITLEMENT_REQUIRED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(403);
      expect(err.data?.code || err.statusMessage).toBe("ENTITLEMENT_REQUIRED");
    }
  });

  it("returns standardized non-diagnostic mastery labels when entitled", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({ email: `ent_${ts}@test.com`, displayName: "User Ent" })
      .returning();

    // Grant view_basic_report entitlement
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "view_basic_report",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Ent",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent("GET", user.id, { uuid: child.uuid });
    const res = await getProgressHandler(event);

    expect(res.child.display_name).toBe("Bé Ent");
    expect(Array.isArray(res.competencies)).toBe(true);
    expect(Array.isArray(res.skills_needing_reinforcement)).toBe(true);
    expect(Array.isArray(res.skills_ready_for_next)).toBe(true);
  });
});
