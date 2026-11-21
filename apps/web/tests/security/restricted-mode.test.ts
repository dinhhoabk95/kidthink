import { hashPassword } from "@mindkid/auth";
import { getAppDb, users } from "@mindkid/db";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { createEvent } from "h3";
import { describe, expect, it } from "vitest";
import profileGetHandler from "#server/api/users/profile.get";
import { assertUnrestrictedUser } from "#server/utils/auth-runtime";

describe("Task 6 — Server-Enforced Restricted Mode (D-EQ)", () => {
  it("permits pending_verification user to read profile status but blocks restricted actions with 403 RESTRICTED_MODE (BR-REG-08)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");

    const email = `pending-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Pending User",
        status: "pending_verification",
      })
      .returning();
    if (!user) {
      throw new Error("Expected inserted user");
    }

    expect(user.status).toBe("pending_verification");

    const event = createEvent(
      {
        method: "GET",
        url: "/api/users/profile",
        headers: { host: "localhost:3000" },
      } as never,
      {
        statusCode: 200,
        getHeader: () => undefined,
        setHeader: () => undefined,
      } as never
    );
    event.context.user = {
      user_id: user.id,
      display_name: user.displayName,
      session_id: "100",
    };

    const res = await profileGetHandler(event);
    expect(res.status).toBe("pending_verification");
    expect(res.email).toBe(email);

    let caughtError: RestrictedModeError | null = null;
    try {
      assertUnrestrictedUser(user.status);
    } catch (err) {
      caughtError = err as RestrictedModeError;
    }

    expect(caughtError).toBeInstanceOf(RestrictedModeError);
    expect(caughtError?.status).toBe(403);
    expect(caughtError?.code).toBe("RESTRICTED_MODE");
  });

  it("permits active user to execute restricted actions without RESTRICTED_MODE error", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");

    const email = `active-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Active User",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Expected active user");
    }

    expect(() => assertUnrestrictedUser(user.status)).not.toThrow();
  });
});
