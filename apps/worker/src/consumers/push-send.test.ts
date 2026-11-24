import {
  getOwnerDb,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  notificationDeliveries,
  notifications,
  RECIPIENT_TYPE,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { pushSend } from "./push-send.js";

const FCM_KEYS = ["FCM_PROJECT_ID", "FCM_CLIENT_EMAIL", "FCM_PRIVATE_KEY"];
let userId = 0;
let notificationId = 0;

const ctx = {
  jobId: "push:send:test",
  attempt: 1,
  signal: new AbortController().signal,
};

describe("push:send consumer (BR-BPS-11)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    const [u] = await db
      .insert(users)
      .values({
        email: `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        displayName: "Push Consumer",
      })
      .returning();
    const [n] = await db
      .insert(notifications)
      .values({
        recipientType: RECIPIENT_TYPE.USER,
        recipientId: u?.id ?? 0,
        templateCode: "weekly_progress",
      })
      .returning();
    userId = u?.id ?? 0;
    notificationId = n?.id ?? 0;
    await db.insert(notificationDeliveries).values({
      notificationId,
      channel: NOTIFICATION_CHANNEL.FCM_WEB,
      status: NOTIFICATION_STATUS.QUEUED,
    });
  });

  afterAll(async () => {
    const db = getOwnerDb();
    await db.delete(notifications).where(eq(notifications.id, notificationId));
    await db.delete(users).where(eq(users.id, userId));
  });

  it("thiếu cấu hình FCM → suppressed, không gọi fetch, không ném, không log giá trị", async () => {
    const saved = FCM_KEYS.map((k) => [k, process.env[k]] as const);
    for (const k of FCM_KEYS) {
      Reflect.deleteProperty(process.env, k);
    }
    process.env.FCM_PRIVATE_KEY = "PRIVATE-KEY-VALUE";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const result = await pushSend(
        {
          notificationId,
          userId,
          title: "t",
          body: "b",
          actionUrl: "/me",
        },
        ctx
      );
      expect(result).toMatchObject({
        status: "suppressed",
        suppressedReason: "FCM_NOT_CONFIGURED",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(JSON.stringify(warn.mock.calls)).toContain("FCM_PROJECT_ID");
      expect(JSON.stringify(warn.mock.calls)).not.toContain(
        "PRIVATE-KEY-VALUE"
      );
    } finally {
      for (const [k, v] of saved) {
        if (v === undefined) {
          Reflect.deleteProperty(process.env, k);
        } else {
          process.env[k] = v;
        }
      }
      fetchSpy.mockRestore();
      warn.mockRestore();
    }
  });
});
