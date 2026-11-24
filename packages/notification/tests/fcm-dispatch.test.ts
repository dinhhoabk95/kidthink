import {
  getOwnerDb,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_ENDPOINT_PROVIDER,
  NOTIFICATION_ENDPOINT_STATUS,
  NOTIFICATION_STATUS,
  NotificationsRepository,
  notificationDeliveries,
  notificationEndpoints,
  notifications,
  RECIPIENT_TYPE,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encryptFcmToken } from "#src/fcm-crypto";
import {
  dispatchFcmWebPush,
  FcmRetryableError,
  resolveFcmConfig,
} from "#src/fcm-dispatch";
import type { FcmAdminMessaging } from "#src/fcm-types";
import { FcmSendError } from "#src/fcm-types";

process.env.NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY =
  "test-notification-token-key-0123456789ab";

const TOKEN_A = "raw-device-token-AAAA";
const TOKEN_B = "raw-device-token-BBBB";
let userId = 0;
const createdNotifications: number[] = [];

async function makeNotificationWithPushDelivery(): Promise<number> {
  const db = getOwnerDb();
  const [n] = await db
    .insert(notifications)
    .values({
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: userId,
      templateCode: "weekly_progress",
    })
    .returning();
  if (!n) {
    throw new Error("notification insert failed");
  }
  await db.insert(notificationDeliveries).values({
    notificationId: n.id,
    channel: NOTIFICATION_CHANNEL.FCM_WEB,
    status: NOTIFICATION_STATUS.QUEUED,
  });
  createdNotifications.push(n.id);
  return n.id;
}

async function addEndpoint(
  token: string,
  installation: string
): Promise<number> {
  const { tokenEncrypted, tokenFingerprint } = encryptFcmToken(token);
  const ep = await new NotificationsRepository().upsertEndpoint({
    userId,
    provider: NOTIFICATION_ENDPOINT_PROVIDER.FCM_WEB,
    clientInstallationId: installation,
    tokenEncrypted,
    tokenFingerprint,
  });
  return ep.id;
}

async function endpointStatus(id: number): Promise<number | undefined> {
  const [row] = await getOwnerDb()
    .select({ status: notificationEndpoints.status })
    .from(notificationEndpoints)
    .where(eq(notificationEndpoints.id, id));
  return row?.status;
}

async function deliveryOf(notificationId: number) {
  const [row] = await getOwnerDb()
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.notificationId, notificationId));
  return row;
}

function payload(notificationId: number) {
  return {
    notificationId,
    userId,
    title: "Tiêu đề",
    body: "Nội dung",
    actionUrl: "/me/notifications",
  };
}

async function resetEndpoints(): Promise<void> {
  await getOwnerDb()
    .delete(notificationEndpoints)
    .where(eq(notificationEndpoints.userId, userId));
}

describe("dispatchFcmWebPush (BR-BPS-11, BR-BPS-12, BR-BPS-13)", () => {
  beforeAll(async () => {
    const [row] = await getOwnerDb()
      .insert(users)
      .values({
        email: `fcm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        displayName: "Fcm Test",
      })
      .returning();
    if (!row) {
      throw new Error("user insert failed");
    }
    userId = row.id;
  });

  afterAll(async () => {
    const db = getOwnerDb();
    await resetEndpoints();
    for (const id of createdNotifications) {
      await db.delete(notifications).where(eq(notifications.id, id));
    }
    await db.delete(users).where(eq(users.id, userId));
  });

  it("resolveFcmConfig: thiếu biến → configured=false, chỉ trả tên biến (BR-BPS-11)", () => {
    const r = resolveFcmConfig({
      FCM_PROJECT_ID: "p",
      FCM_CLIENT_EMAIL: "  ",
      FCM_PRIVATE_KEY: "SECRET-KEY",
    });
    expect(r).toEqual({ configured: false, missing: ["FCM_CLIENT_EMAIL"] });
    expect(JSON.stringify(r)).not.toContain("SECRET-KEY");
    expect(
      resolveFcmConfig({
        FCM_PROJECT_ID: "p",
        FCM_CLIENT_EMAIL: "e",
        FCM_PRIVATE_KEY: "k",
      }).configured
    ).toBe(true);
  });

  it("không cấu hình → suppressed FCM_NOT_CONFIGURED, không gọi gửi (BR-BPS-11)", async () => {
    const nid = await makeNotificationWithPushDelivery();
    const out = await dispatchFcmWebPush(payload(nid), undefined);
    expect(out).toMatchObject({
      status: "suppressed",
      suppressedReason: "FCM_NOT_CONFIGURED",
    });
    const d = await deliveryOf(nid);
    expect(d?.status).toBe(NOTIFICATION_STATUS.SUPPRESSED);
    expect(d?.suppressedReason).toBe("FCM_NOT_CONFIGURED");
  });

  it("thành công: gửi token đã giải mã, ghi dispatched + provider id", async () => {
    await resetEndpoints();
    await addEndpoint(TOKEN_A, "install-a");
    const nid = await makeNotificationWithPushDelivery();
    const send = vi.fn().mockResolvedValue("projects/p/messages/42");
    const messaging: FcmAdminMessaging = { send };

    const out = await dispatchFcmWebPush(payload(nid), messaging);

    expect(out).toMatchObject({ status: "dispatched", dispatchedCount: 1 });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: TOKEN_A,
        data: {
          notification_id: String(nid),
          action_url: "/me/notifications",
        },
      })
    );
    const d = await deliveryOf(nid);
    expect(d?.status).toBe(NOTIFICATION_STATUS.DISPATCHED);
    expect(d?.providerMessageId).toBe("projects/p/messages/42");
  });

  it("UNREGISTERED → endpoint invalid, delivery failed, không ném (BR-BPS-12)", async () => {
    await resetEndpoints();
    const epId = await addEndpoint(TOKEN_A, "install-a");
    const nid = await makeNotificationWithPushDelivery();
    const messaging: FcmAdminMessaging = {
      send: vi.fn().mockRejectedValue(new FcmSendError(404, "UNREGISTERED")),
    };

    const out = await dispatchFcmWebPush(payload(nid), messaging);

    expect(out).toMatchObject({ status: "failed", invalidatedCount: 1 });
    expect(await endpointStatus(epId)).toBe(
      NOTIFICATION_ENDPOINT_STATUS.INVALID
    );
    const d = await deliveryOf(nid);
    expect(d?.status).toBe(NOTIFICATION_STATUS.FAILED);
    expect(d?.error).toBe("HTTP 404 UNREGISTERED");
    expect(d?.error).not.toContain(TOKEN_A);

    // Endpoint đã invalid không được chọn lại.
    const nid2 = await makeNotificationWithPushDelivery();
    const send2 = vi.fn();
    const out2 = await dispatchFcmWebPush(payload(nid2), { send: send2 });
    expect(out2).toMatchObject({
      status: "suppressed",
      suppressedReason: "NO_ACTIVE_ENDPOINT",
    });
    expect(send2).not.toHaveBeenCalled();
  });

  it("5xx → ném FcmRetryableError, endpoint vẫn active (BR-BPS-12)", async () => {
    await resetEndpoints();
    const epId = await addEndpoint(TOKEN_A, "install-a");
    const nid = await makeNotificationWithPushDelivery();
    const messaging: FcmAdminMessaging = {
      send: vi.fn().mockRejectedValue(new FcmSendError(503, "UNAVAILABLE")),
    };

    const err = await dispatchFcmWebPush(payload(nid), messaging).catch(
      (e: Error) => e
    );
    expect(err).toBeInstanceOf(FcmRetryableError);
    expect((err as Error).message).not.toContain(TOKEN_A);
    expect(await endpointStatus(epId)).toBe(
      NOTIFICATION_ENDPOINT_STATUS.ACTIVE
    );
  });

  it("4xx khác → non-retryable: failed, không ném, không vô hiệu endpoint", async () => {
    await resetEndpoints();
    const epId = await addEndpoint(TOKEN_A, "install-a");
    const nid = await makeNotificationWithPushDelivery();
    const messaging: FcmAdminMessaging = {
      send: vi
        .fn()
        .mockRejectedValue(new FcmSendError(403, "SENDER_ID_MISMATCH")),
    };
    const out = await dispatchFcmWebPush(payload(nid), messaging);
    expect(out).toMatchObject({ status: "failed", invalidatedCount: 0 });
    expect(await endpointStatus(epId)).toBe(
      NOTIFICATION_ENDPOINT_STATUS.ACTIVE
    );
  });

  it("nhiều endpoint: một thành công + một retryable → dispatched, không retry (BR-BPS-12)", async () => {
    await resetEndpoints();
    await addEndpoint(TOKEN_A, "install-a");
    await addEndpoint(TOKEN_B, "install-b");
    const nid = await makeNotificationWithPushDelivery();
    const send = vi
      .fn()
      .mockResolvedValueOnce("projects/p/messages/1")
      .mockRejectedValueOnce(new FcmSendError(503, "UNAVAILABLE"));
    const out = await dispatchFcmWebPush(payload(nid), { send });
    expect(out).toMatchObject({ status: "dispatched", dispatchedCount: 1 });
  });
});
