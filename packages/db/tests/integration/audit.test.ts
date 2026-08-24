import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { auditLogs } from "#src/schema/ops";

describe("Task 1 — Migration audit_logs (D-ET)", () => {
  it("writes audit log with before_data, after_data, and reason", async () => {
    const db = getOwnerDb();

    const [log] = await db
      .insert(auditLogs)
      .values({
        actorType: "system",
        actorId: null,
        action: "user_suspended",
        entityType: "user",
        entityId: "123",
        beforeData: { is_active: true },
        afterData: { is_active: false },
        reason: "Violation of terms of service",
      })
      .returning();

    expect(log).toBeDefined();
    expect(log.beforeData).toEqual({ is_active: true });
    expect(log.afterData).toEqual({ is_active: false });
    expect(log.reason).toBe("Violation of terms of service");
    expect(log.actorId).toBeNull();
  });
});
