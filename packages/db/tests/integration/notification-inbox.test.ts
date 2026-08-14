import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { users } from "../../src/schema/identity.ts";
import {
  notificationEndpoints,
  notificationReads,
  notifications,
} from "../../src/schema/ops.ts";

describe("Notification Inbox & Endpoints DB Integration Tests", () => {
  it("BR-NIB-01 & BR-NIB-06: notification_reads maintains unique read state per notification", async () => {
    const db = getOwnerDb();
    const tag = `NOTIF_READ_TEST_${Date.now()}`;

    // Seed notification
    const [notif] = await db
      .insert(notifications)
      .values({
        recipientType: "user",
        recipientId: 999_991,
        templateCode: tag,
        payload: { title: "Test Title", body: "Test Body" },
      })
      .returning();

    const readTime = new Date();

    // Insert read record
    const [readRow] = await db
      .insert(notificationReads)
      .values({
        notificationId: notif.id,
        readAt: readTime,
      })
      .returning();

    expect(readRow).toBeDefined();
    expect(readRow.notificationId).toBe(notif.id);

    // Duplicate read for same notification fails (PK constraint)
    await expect(
      db.insert(notificationReads).values({
        notificationId: notif.id,
        readAt: new Date(),
      })
    ).rejects.toThrow();

    // Clean up
    await db.delete(notifications).where(eq(notifications.id, notif.id));
  });

  it("BR-BPS-04 & BR-BPS-08: notification_endpoints supports encryption storage and unique fingerprint", async () => {
    const db = getOwnerDb();
    const email = `notif_ep_user_${Date.now()}@example.com`;

    // Seed user
    const [user] = await db
      .insert(users)
      .values({
        email,
        displayName: "Notification User",
      })
      .returning();

    const installationId = crypto.randomUUID();
    const fingerprint = `hmac_fp_${Date.now()}_${Math.random()}`;

    // Create endpoint
    const [endpoint] = await db
      .insert(notificationEndpoints)
      .values({
        userId: user.id,
        provider: "fcm_web",
        clientInstallationId: installationId,
        tokenEncrypted: "enc_v1_aes256_mock_ciphertext",
        tokenFingerprint: fingerprint,
        status: "active",
      })
      .returning();

    expect(endpoint).toBeDefined();
    expect(endpoint.userId).toBe(user.id);
    expect(endpoint.provider).toBe("fcm_web");
    expect(endpoint.status).toBe("active");

    // Duplicate fingerprint fails (UNIQUE constraint)
    await expect(
      db.insert(notificationEndpoints).values({
        userId: user.id,
        provider: "fcm_web",
        clientInstallationId: crypto.randomUUID(),
        tokenEncrypted: "enc_v1_different",
        tokenFingerprint: fingerprint,
        status: "active",
      })
    ).rejects.toThrow();

    // Duplicate user + clientInstallationId fails (UNIQUE index constraint)
    await expect(
      db.insert(notificationEndpoints).values({
        userId: user.id,
        provider: "fcm_web",
        clientInstallationId: installationId,
        tokenEncrypted: "enc_v1_different_2",
        tokenFingerprint: `hmac_fp_different_${Date.now()}`,
        status: "active",
      })
    ).rejects.toThrow();

    // Cascade delete on user deletes endpoints
    await db.delete(users).where(eq(users.id, user.id));

    const foundEndpoint = await db
      .select()
      .from(notificationEndpoints)
      .where(eq(notificationEndpoints.id, endpoint.id));

    expect(foundEndpoint.length).toBe(0);
  });
});
