import { hashPassword } from "@kidthink/auth";
import { getAppDb, users } from "@kidthink/db";
import { describe, expect, it } from "vitest";
import {
  assertUnrestrictedUser,
  respondToUserAuthError,
} from "../../server/utils/auth-runtime";

describe("Task 6 — Server-Enforced Restricted Mode (D-EQ)", () => {
  it("permits pending_verification user to read session status but blocks restricted actions with 403 RESTRICTED_MODE (BR-REG-08)", async () => {
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

    expect(user.status).toBe("pending_verification");

    // 1. Permitted action check (GET sessions)
    const { default: sessionsHandler } = await import(
      "../../server/api/users/auth/sessions.get"
    );

    const event = {
      method: "GET",
      node: { req: { headers: {} } },
      context: {
        user: {
          user_id: user.id,
          display_name: user.displayName,
          session_id: "100",
          refresh_token_version: 0,
        },
      },
    } as any;

    const res = await sessionsHandler(event);
    expect(res.sessions).toBeDefined();

    // 2. Restricted action guard test: assertUnrestrictedUser throwing 403 RESTRICTED_MODE
    const restrictedAction = (event: any) => {
      try {
        assertUnrestrictedUser(user.status);
        return { ok: true };
      } catch (err) {
        return respondToUserAuthError(event, err);
      }
    };

    let err: any;
    try {
      restrictedAction(event);
    } catch (e) {
      err = e;
    }

    expect(err.statusCode).toBe(403);
    expect(err.data.code).toBe("RESTRICTED_MODE");
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

    expect(() => assertUnrestrictedUser(user.status)).not.toThrow();
  });
});
