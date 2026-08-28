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
    const { notificationId } = await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: userId,
      code: CODE,
      to: "c@example.com",
      payload: {},
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
