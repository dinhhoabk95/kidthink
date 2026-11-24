import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  ACTOR_TYPE,
  getAppDb,
  getOwnerDb,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  RECIPIENT_TYPE,
} from "#src/index";
import {
  auditLogs,
  notificationDeliveries,
  notifications,
} from "#src/schema/ops";

describe("Ops Schema Integration Tests", () => {
  it("BR-AUD-01: audit_logs is INSERT-only (UPDATE/DELETE fails)", async () => {
    const appDb = getAppDb();

    const [log] = await appDb
      .insert(auditLogs)
      .values({
        actorType: ACTOR_TYPE.SYSTEM,
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

  it("BR-NOT-04: notifications transaction rollback test", async () => {
    const db = getOwnerDb();
    const actionTag = `NOTIF_TX_TEST_${Date.now()}`;

    // Transaction that fails and rolls back
    try {
      await db.transaction(async (tx) => {
        const [notif] = await tx
          .insert(notifications)
          .values({
            recipientType: RECIPIENT_TYPE.USER,
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
          channel: NOTIFICATION_CHANNEL.EMAIL,
          status: NOTIFICATION_STATUS.QUEUED,
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
