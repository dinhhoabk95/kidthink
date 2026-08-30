import { alert, enqueue } from "@mindkid/queue";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getOwnerDb } from "#src/client";
import { users } from "#src/schema/identity";
import { notificationDeliveries, notifications } from "#src/schema/ops";
import { dispatchTransactionalEmail } from "#src/services/notification-dispatch";

/**
 * Valkey không với tới được: `enableOfflineQueue: false` biến lệnh đang đệm
 * thành lỗi phát ngay, đúng chuỗi này.
 */
const OFFLINE =
  "Stream isn't writeable and enableOfflineQueue options is false";

vi.mock("@mindkid/queue", () => ({
  enqueue: vi.fn(() => Promise.reject(new Error(OFFLINE))),
  alert: vi.fn(),
}));

const CODE = "password_changed_notification";
let userId = 0;

describe("dispatchTransactionalEmail — hàng đợi chết (BR-JOB-01)", () => {
  beforeAll(async () => {
    const [row] = await getOwnerDb()
      .insert(users)
      .values({
        email: `dispatch-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        displayName: "Dispatch Failure Test",
      })
      .returning();
    userId = row?.id ?? 0;
  });

  afterAll(async () => {
    const db = getOwnerDb();
    await db.delete(notifications).where(eq(notifications.recipientId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  it("ca âm: enqueue hỏng thì delivery mang `failed`, Cấm — NEVER ở lại `queued`", async () => {
    // Trước sửa đổi này hàng delivery ở lại `queued` vĩnh viễn và Cấm — NEVER
    // có gì quét lại nó: email xác nhận đổi mật khẩu mất hẳn, im lặng, trong
    // khi route trả 500 cho người đã đổi mật khẩu xong.
    await expect(
      dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: userId,
        code: CODE,
        to: "offline@example.com",
        payload: {},
      })
    ).rejects.toThrow(OFFLINE);

    expect(enqueue).toHaveBeenCalledTimes(1);

    const db = getOwnerDb();
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId));

    expect(
      notification,
      "transaction phải commit trước khi đẩy job"
    ).toBeDefined();

    const [delivery] = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, notification?.id ?? 0));

    expect(delivery?.status).toBe("failed");
    expect(delivery?.error).toContain(OFFLINE);
  });

  it("thất bại phải tới được người trực, không chỉ nằm trong DB", () => {
    expect(alert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(alert).mock.calls[0]?.[0]).toBe("error");
    expect(vi.mocked(alert).mock.calls[0]?.[1]).toContain("Không đẩy được");
  });
});
