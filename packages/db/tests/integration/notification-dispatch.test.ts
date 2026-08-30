import { disconnectQueue, getQueue } from "@mindkid/queue";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import { users } from "#src/schema/identity";
import { notificationDeliveries, notifications } from "#src/schema/ops";
import {
  dispatchTransactionalEmail,
  isEmailAlreadyDispatched,
  recordEmailDeliveryOutcome,
} from "#src/services/notification-dispatch";

const CODE = "password_changed_notification";
const created: number[] = [];
let userId = 0;

async function makeUser(): Promise<number> {
  const [row] = await getOwnerDb()
    .insert(users)
    .values({
      email: `dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
      displayName: "Dispatch Test",
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert user");
  }
  return row.id;
}

describe("dispatchTransactionalEmail (BR-JOB-01, BR-JOB-02)", () => {
  beforeAll(async () => {
    userId = await makeUser();
    await getQueue().obliterate({ force: true });
  });

  afterAll(async () => {
    const db = getOwnerDb();
    for (const id of created) {
      await db.delete(notifications).where(eq(notifications.id, id));
    }
    await db.delete(users).where(eq(users.id, userId));
    await disconnectQueue();
  });

  it("ghi bản ghi notification, delivery `queued`, và đẩy job", async () => {
    const { notificationId } = await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: userId,
      code: CODE,
      to: "someone@example.com",
      payload: { timestamp: new Date().toISOString() },
    });
    created.push(notificationId);

    const [delivery] = await getOwnerDb()
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notificationId));

    expect(delivery?.channel).toBe("email");
    expect(delivery?.status).toBe("queued");

    const job = await getQueue().getJob(`email:send:${notificationId}`);
    expect(job, "jobId phải suy từ notificationId (BR-JOB-02)").toBeDefined();
    expect(job?.data.code).toBe(CODE);
  });

  it("hai email khác nhau không dùng chung jobId", async () => {
    const first = await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: userId,
      code: CODE,
      to: "a@example.com",
      payload: {},
    });
    const second = await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: userId,
      code: "account_deletion_confirmation",
      to: "b@example.com",
      payload: {},
    });
    created.push(first.notificationId, second.notificationId);

    expect(first.notificationId).not.toBe(second.notificationId);
    const jobs = await Promise.all([
      getQueue().getJob(`email:send:${first.notificationId}`),
      getQueue().getJob(`email:send:${second.notificationId}`),
    ]);
    expect(jobs.every(Boolean)).toBe(true);
  });

  it("idempotency đọc trạng thái delivery, không đọc bộ nhớ tiến trình", async () => {
    // Dựng thẳng hàng notification + delivery thay vì đi qua
    // `dispatchTransactionalEmail`: hàm đang đo là `isEmailAlreadyDispatched`,
    // và bản cũ của phép thử này đua với hàng đợi. `mindkid-jobs` dùng chung
    // với mọi thứ đang nối cùng Valkey — kể cả một `pnpm dev` đang chạy — nên
    // một worker thật có thể gửi email và đánh `dispatched` trước khi dòng
    // dưới kịp đọc. Khi đó phép thử đỏ vì môi trường, không vì hành vi.
    const db = getOwnerDb();
    const [notification] = await db
      .insert(notifications)
      .values({
        recipientType: "user",
        recipientId: userId,
        templateCode: CODE,
        payload: {},
      })
      .returning();
    const notificationId = notification?.id ?? 0;
    await db.insert(notificationDeliveries).values({
      notificationId,
      channel: "email",
      status: "queued",
    });
    created.push(notificationId);

    expect(await isEmailAlreadyDispatched(notificationId)).toBe(false);

    await recordEmailDeliveryOutcome(notificationId, {
      status: "dispatched",
      providerMessageId: "msg_test_1",
    });

    expect(await isEmailAlreadyDispatched(notificationId)).toBe(true);
  });
});
