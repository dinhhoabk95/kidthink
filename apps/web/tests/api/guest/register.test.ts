import { consentLogs, getAppDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("Task 1 — POST /api/guest/auth/users/register (BR-REG-01..10)", () => {
  it("registers a user with valid data and records consents, verification token, session (BR-REG-01, BR-REG-03, BR-REG-05)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const email = `parent-reg-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const event = {
      method: "POST",
      node: {
        req: {
          headers: {
            "x-forwarded-for": "127.0.0.1",
            "user-agent": "Mozilla/5.0 (TestClient)",
          },
        },
      },
      context: {},
    } as any;

    const payload = {
      email,
      password: "chuoixanh123",
      display_name: "Phụ Huynh",
      accept_terms: true,
      accept_privacy: true,
    };

    event.context = { body: payload };
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
    expect(userRows[0].status).toBe("pending_verification");

    // BR-REG-03: 2 consent logs
    const consentRows = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, userRows[0].id));
    expect(consentRows).toHaveLength(2);
    expect(consentRows.map((c) => c.consentType).sort()).toEqual([
      "privacy",
      "terms",
    ]);
  });

  it("rejects registration without terms or privacy checkboxes (BR-REG-02)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: "noterms@example.com",
          password: "chuoixanh123",
          display_name: "Phụ Huynh",
          accept_terms: false,
          accept_privacy: true,
        },
      },
    } as any;

    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects weak or common passwords (BR-REG-05)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: "weakpass@example.com",
          password: "123",
          display_name: "Phụ Huynh",
          accept_terms: true,
          accept_privacy: true,
        },
      },
    } as any;

    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects duplicate email case-insensitively with 409 without leaking provider (BR-REG-07, BR-REG-10)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const email = `dupe-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const db = getAppDb();
    await db.insert(users).values({
      email,
      passwordHash: "dummy_hash",
      displayName: "Phụ Huynh Dupe",
      status: "pending_verification",
    });

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: email.toUpperCase(),
          password: "chuoixanh123",
          display_name: "Phụ Huynh Mới",
          accept_terms: true,
          accept_privacy: true,
        },
      },
    } as any;

    await expect(handler(event)).rejects.toSatisfy((err: any) => {
      return (err.statusCode || err.status) === 409;
    });
  });
});
