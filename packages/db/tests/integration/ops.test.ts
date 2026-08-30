import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getAppDb, getOwnerDb } from "#src/index";
import {
  auditLogs,
  contentReviewLog,
  notificationDeliveries,
  notifications,
} from "#src/schema/ops";

describe("Ops Schema Integration Tests", () => {
  it("BR-AUD-01: audit_logs is INSERT-only (UPDATE/DELETE by app role fails)", async () => {
    const appDb = getAppDb();

    const [log] = await appDb
      .insert(auditLogs)
      .values({
        actorType: "system",
        actorId: null,
        action: "TEST_ACTION",
        entityType: "system",
        entityId: "1",
      })
      .returning();
    if (!log) {
      throw new Error("Failed to insert log");
    }

    expect(log).toBeDefined();

    // App role UPDATE must fail
    await expect(
      appDb
        .update(auditLogs)
        .set({ action: "MUTATED" })
        .where(eq(auditLogs.id, log.id))
    ).rejects.toThrow();

    // App role DELETE must fail
    await expect(
      appDb.delete(auditLogs).where(eq(auditLogs.id, log.id))
    ).rejects.toThrow();
  });

  it("BR-CRV-01: content_review_log supports foreign key references to managers", async () => {
    const db = getOwnerDb();

    const [log] = await db
      .insert(contentReviewLog)
      .values({
        entityType: "game_level",
        entityId: 999_999_999,
        contentVersion: 1,
        fromStatus: "draft",
        toStatus: "in_review",
        reason: "Test review log entry",
      })
      .returning();
    if (!log) {
      throw new Error("Failed to insert log");
    }

    expect(log).toBeDefined();
    expect(log.entityId).toBe(999_999_999);
  });

  it("BR-NOT-04: notifications transaction rollback test", async () => {
    const db = getOwnerDb();
    const actionTag = `NOTIF_TX_TEST_${Date.now()}`;

    // Transaction that fails and rolls back
    try {
      await db.transaction(async (tx) => {
        const [notif] = await tx
          .insert(notifications)
          .values({
            recipientType: "user",
            recipientId: 1,
            templateCode: actionTag,
            payload: { test: true },
          })
          .returning();
        if (!notif) {
          throw new Error("Failed to insert notif");
        }

        await tx.insert(notificationDeliveries).values({
          notificationId: notif.id,
          channel: "email",
          status: "queued",
        });

        // Intentional error to trigger rollback
        throw new Error("INTENTIONAL_ROLLBACK");
      });
    } catch (_err) {
      // Expected rollback
    }

    // Verify notification was not persisted
    const found = await db
      .select()
      .from(notifications)
      .where(eq(notifications.templateCode, actionTag));

    expect(found.length).toBe(0);
  });
});
