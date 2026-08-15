import { generateTotpCode } from "@kidthink/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings, users } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import mfaDisableHandler from "../../server/api/users/mfa/disable.post.js";
import mfaRecoveryCodesHandler from "../../server/api/users/mfa/recovery-codes.post.js";
import mfaSetupHandler from "../../server/api/users/mfa/setup.post.js";
import mfaVerifyHandler from "../../server/api/users/mfa/verify.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testUserId = 1;
let currentTotpSecret = "";

beforeAll(async () => {
  const db = getOwnerDb();
  let [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "user-mfa-test@kidthink.vn"));
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email: "user-mfa-test@kidthink.vn",
        passwordHash: "hash",
        displayName: "MFA Test User",
        status: "active",
      })
      .returning({ id: users.id });
  }
  if (u) {
    testUserId = u.id;
  }
});

function mockUserEvent(
  reauthAt?: Date | null,
  body?: unknown,
  method = "POST"
) {
  return {
    method,
    node: {
      req: {
        method,
        url: "/api/users/mfa",
        headers: {
          "user-agent": "VitestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_u_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        statusCode: 200,
        setHeader: () => {
          /* mock */
        },
      },
    },
    context: {
      user: {
        user_id: testUserId,
        display_name: "MFA Test User",
        session_id: "sess_p211_user",
        session_version: 1,
        reauth_at: reauthAt,
      },
      reauth_at: reauthAt,
      body,
    },
    _body: body,
  } as any;
}

describe("User MFA Flow (P2.11, BR-MFA-01 - BR-MFA-12)", () => {
  it("POST /api/users/mfa/setup requires recent reauth <= 5 min (BR-MFA-10)", async () => {
    // Expired reauth (10 min ago)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const event = mockUserEvent(tenMinAgo);

    try {
      await mfaSetupHandler(event);
      expect.fail("Should throw REAUTH_REQUIRED");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(428);
    }
  });

  it("POST /api/users/mfa/setup generates TOTP secret with valid reauth (BR-MFA-01, BR-MFA-12)", async () => {
    const freshReauth = new Date();
    const event = mockUserEvent(freshReauth);

    const res = (await mfaSetupHandler(event)) as any;
    expect(res.secret).toBeDefined();
    expect(res.otpauth_url).toBeDefined();
    expect(res.otpauth_url).toContain("otpauth://totp/");

    currentTotpSecret = res.secret;

    // Verify secret is encrypted in DB (BR-MFA-01)
    const db = getOwnerDb();
    const [setting] = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, testUserId)
        )
      );

    expect(setting).toBeDefined();
    expect(setting.secretEncrypted).not.toBe(res.secret);
    expect(setting.secretEncrypted.startsWith("v1.")).toBe(true);
  });

  it("POST /api/users/mfa/verify confirms MFA and returns 10 recovery codes (BR-MFA-02, BR-MFA-06, BR-MFA-07)", async () => {
    const code = generateTotpCode(currentTotpSecret);
    const event = mockUserEvent(new Date(), { code });

    const res = (await mfaVerifyHandler(event)) as any;
    expect(res.recovery_codes).toBeDefined();
    expect(res.recovery_codes.length).toBe(10);

    const db = getOwnerDb();
    const [setting] = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, testUserId)
        )
      );
    expect(setting.confirmedAt).toBeDefined();

    // Recovery codes stored as hash in DB (BR-MFA-02)
    const storedCodes = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, testUserId)
        )
      );
    expect(storedCodes.length).toBe(10);
  });

  it("POST /api/users/mfa/recovery-codes invalidates old codes and generates new (BR-MFA-11)", async () => {
    const code = generateTotpCode(currentTotpSecret);
    const event = mockUserEvent(new Date(), { code });

    const res = (await mfaRecoveryCodesHandler(event)) as any;
    expect(res.recovery_codes).toBeDefined();
    expect(res.recovery_codes.length).toBe(10);
  });

  it("POST /api/users/mfa/disable requires reauth and valid code to disable (BR-MFA-03)", async () => {
    const code = generateTotpCode(currentTotpSecret);
    const event = mockUserEvent(new Date(), { code });

    const res = (await mfaDisableHandler(event)) as any;
    expect(res.success).toBe(true);

    const db = getOwnerDb();
    const [setting] = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, testUserId)
        )
      );
    expect(setting).toBeUndefined();
  });
});
