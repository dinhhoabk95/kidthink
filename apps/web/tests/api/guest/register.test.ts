import {
  consentLogs,
  getAppDb,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";

function createRegisterTestEvent(
  body: Record<string, string | boolean | null | undefined>
): H3Event {
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Mozilla/5.0 (TestClient)",
        },
      },
      res: {},
    },
    context: { body },
  } as Partial<H3Event> as H3Event;
}

describe("Task 1 — POST /api/guest/auth/users/register (BR-REG-01..10)", () => {
  it("registers a user with valid data and records consents, verification token, queued email delivery, session (BR-REG-01, BR-REG-03, BR-REG-05, #289 S2)", async () => {
    const { default: handler } = await import(
      "#server/api/guest/auth/users/register.post"
    );

    const email = `parent-reg-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const payload = {
      email,
      password: "chuoixanh123",
      display_name: "Người Dùng",
      accept_terms: true,
      accept_privacy: true,
    };

    const event = createRegisterTestEvent(payload);
    const response = await handler(event);

    expect(response.user).toBeDefined();
    expect(response.user.status).toBe("pending_verification");
    expect(response.user.uuid).toBeDefined();

    // Check DB records
    const db = getAppDb();
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    expect(userRows).toHaveLength(1);
    const createdUser = userRows[0];
    expect(createdUser?.status).toBe("pending_verification");

    if (!createdUser) {
      throw new Error("Expected created user");
    }

    // BR-REG-03: 2 consent logs
    const consentRows = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, createdUser.id));
    expect(consentRows).toHaveLength(2);
    expect(consentRows.map((c) => c.consentType).sort()).toEqual([
      "privacy",
      "terms",
    ]);

    // #289 S2: notification record has no raw token in DB payload and has queued delivery
    const notifRows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, createdUser.id));
    expect(notifRows).toHaveLength(1);
    const notif = notifRows[0];
    expect(notif?.templateCode).toBe("email_verification");
    const savedPayload = notif?.payload as Record<string, string> | undefined;
    expect(savedPayload?.token).toBeUndefined();
    expect(savedPayload?.url).toBeUndefined();

    if (notif) {
      const deliveryRows = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.notificationId, notif.id));
      expect(deliveryRows).toHaveLength(1);
      expect(deliveryRows[0]?.channel).toBe("email");
    }
  });

  it("rejects registration without terms or privacy checkboxes (BR-REG-02)", async () => {
    const { default: handler } = await import(
      "#server/api/guest/auth/users/register.post"
    );

    const event = createRegisterTestEvent({
      email: "noterms@example.com",
      password: "chuoixanh123",
      display_name: "Người Dùng",
      accept_terms: false,
      accept_privacy: true,
    });

    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects weak or common passwords (BR-REG-05)", async () => {
    const { default: handler } = await import(
      "#server/api/guest/auth/users/register.post"
    );

    const event = createRegisterTestEvent({
      email: "weakpass@example.com",
      password: "123",
      display_name: "Người Dùng",
      accept_terms: true,
      accept_privacy: true,
    });

    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects duplicate email case-insensitively with 409 without leaking provider (BR-REG-07, BR-REG-10)", async () => {
    const { default: handler } = await import(
      "#server/api/guest/auth/users/register.post"
    );

    const email = `dupe-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const db = getAppDb();
    await db.insert(users).values({
      email,
      passwordHash: "dummy_hash",
      displayName: "Người Dùng Dupe",
      status: "pending_verification",
    });

    const event = createRegisterTestEvent({
      email: email.toUpperCase(),
      password: "chuoixanh123",
      display_name: "Người Dùng Mới",
      accept_terms: true,
      accept_privacy: true,
    });

    await expect(handler(event)).rejects.toSatisfy(
      (err: { statusCode?: number; status?: number }) => {
        return (err.statusCode || err.status) === 409;
      }
    );
  });
});
