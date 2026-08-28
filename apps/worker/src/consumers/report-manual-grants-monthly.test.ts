import {
  entitlementKeys,
  entitlements,
  getOwnerDb,
  managers,
  SEED_ENTITLEMENT_KEYS,
  users,
} from "@mindkid/db";
import { beforeAll, describe, expect, it } from "vitest";
import { runManualGrantReportJob } from "./report-manual-grants-monthly.js";

describe("Task 5 — report:manual-grants-monthly Suite (BR-EGR-09)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
  });
  it("aggregates manual grants for given month and returns summary for super_admin", async () => {
    const db = getOwnerDb();
    const testMonth = "2026-07";

    // 1. Create super_admin manager
    const [manager] = await db
      .insert(managers)
      .values({
        email: `superadmin-report-${Date.now()}@example.com`,
        displayName: "Super Admin Reviewer",
        role: "super_admin",
        passwordHash: "mock-pwd-hash",
      })
      .returning();

    // 2. Create user receiving manual grant
    const [user] = await db
      .insert(users)
      .values({
        email: `user-grant-report-${Date.now()}@example.com`,
        displayName: "Partner Test User",
      })
      .returning();

    // 3. Create manual grant within target month 2026-07
    const grantDate = new Date("2026-07-15T10:00:00Z");
    const expiryDate = new Date("2026-08-15T10:00:00Z");

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "manual_grant",
      status: "active",
      grantedAt: grantDate,
      expiresAt: expiryDate,
      grantedByManagerId: manager.id,
      grantReason: "Cấp quyền đối tác thử nghiệm tháng 7.",
    });

    // 4. Run monthly job for 2026-07
    const result = await runManualGrantReportJob("job-test-monthly-1", {
      month: testMonth,
    });

    expect(result.month).toBe(testMonth);
    expect(result.grants_count).toBeGreaterThanOrEqual(1);
    expect(result.recipient_email).toBeDefined();
    expect(result.items.some((i) => i.user_email === user.email)).toBe(true);

    const matchingItem = result.items.find((i) => i.user_email === user.email);
    expect(matchingItem?.entitlement_key).toBe("play_standard_games");
    expect(matchingItem?.grant_reason).toContain("Cấp quyền đối tác");
  });

  it("handles empty month with 0 grants cleanly (BR-EGR-09: still reports 0 instead of failing)", async () => {
    const emptyMonth = "2024-01"; // past month with no grants

    const result = await runManualGrantReportJob("job-test-monthly-empty", {
      month: emptyMonth,
    });

    expect(result.month).toBe(emptyMonth);
    expect(result.grants_count).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.status).toBe("sent");
  });
});
