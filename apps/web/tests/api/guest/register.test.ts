import { consentLogs, getAppDb, users, verificationTokens } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateAllTestTables } from "../../../../../packages/db/tests/global-setup";

describe("Task 1 — POST /api/guest/auth/users/register (BR-REG-01..10)", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

  it("registers a user with valid data and records consents, verification token, session (BR-REG-01, BR-REG-03, BR-REG-05)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

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
      email: "Parent@Example.com",
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
      .where(eq(users.email, "parent@example.com"));
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

    // BR-EVF-01: verification token inserted
    const tokenRows = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.accountId, userRows[0].id));
    expect(tokenRows).toHaveLength(1);
    expect(tokenRows[0].purpose).toBe("email_verify");
  });

  it("rejects registration without terms or privacy checkboxes (BR-REG-02)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
    } as any;

    const payload = {
      email: "parent2@example.com",
      password: "chuoixanh123",
      display_name: "Phụ Huynh 2",
      accept_terms: false,
      accept_privacy: true,
    };

    event.context = { body: payload };
    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects weak or common passwords (BR-REG-05)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
    } as any;

    // Common password "12345678" -> 422
    const payload = {
      email: "parent3@example.com",
      password: "12345678",
      display_name: "Phụ Huynh 3",
      accept_terms: true,
      accept_privacy: true,
    };

    event.context = { body: payload };
    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects duplicate email case-insensitively with 409 without leaking provider (BR-REG-07, BR-REG-10)", async () => {
    const { default: handler } = await import(
      "../../../server/api/guest/auth/users/register.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
    } as any;

    const payload = {
      email: "dupe@example.com",
      password: "chuoixanh123",
      display_name: "Phụ Huynh Dupe",
      accept_terms: true,
      accept_privacy: true,
    };

    event.context = { body: payload };
    await handler(event);

    // Duplicate register with different case
    const dupPayload = {
      ...payload,
      email: "DUPE@EXAMPLE.COM",
    };

    event.context = { body: dupPayload };
    try {
      await handler(event);
      expect.fail("Should have thrown 409");
    } catch (err: any) {
      expect(err.status || err.statusCode).toBe(409);
      expect(JSON.stringify(err)).not.toContain("google");
      expect(JSON.stringify(err)).not.toContain("facebook");
    }
  });
});
