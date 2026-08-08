import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getAppDb, getOwnerDb } from "../../src/index.ts";
import {
  auditLogs,
  contentReviewLog,
  notifications,
} from "../../src/schema/ops.ts";

describe("Ops Schema Integration Tests", () => {
  it("BR-AUD-01: audit_logs is INSERT-only (UPDATE/DELETE by app role fails)", async () => {
    const appDb = getAppDb();

    const [log] = await appDb
      .insert(auditLogs)
      .values({
        actorType: "system",
        actorId: 0,
        action: "TEST_ACTION",
        entityType: "system",
        entityId: "1",
      })
      .returning();

    expect(log).toBeDefined();

    // App role UPDATE must fail
    await expect(
      appDb
        .update(auditLogs)
        .set({ action: "MODIFIED" })
        .where(eq(auditLogs.id, log.id))
    ).rejects.toThrow();

    // App role DELETE must fail
    await expect(
      appDb.delete(auditLogs).where(eq(auditLogs.id, log.id))
    ).rejects.toThrow();
  });

  it("content_review_log.entity_id polymorphic orphan detection", async () => {
    const db = getOwnerDb();

    // Insert content review log trỏ tới non-existent entity_id
    const [log] = await db
      .insert(contentReviewLog)
      .values({
        entityType: "game_level",
        entityId: 999_999_999,
        contentVersion: 1,
        action: "submitted",
        reviewNotes: "Test review",
      })
      .returning();

    expect(log).toBeDefined();
    expect(log.entityId).toBe(999_999_999);
  });

  it("BR-NOT-04: notifications transaction rollback test", async () => {
    const db = getOwnerDb();
    const actionTag = `NOTIF_TX_TEST_${Date.now()}`;

    // Transaction that fails and rolls back
    try {
      await db.transaction(async (tx) => {
        await tx.insert(notifications).values({
          recipientType: "user",
          recipientId: 1,
          channel: "email",
          templateCode: actionTag,
          payload: { test: true },
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
