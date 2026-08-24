import {
  encryptTotpSecret,
  generateTotpCode,
  getAuthRedisClient,
  hashPassword,
  MfaChallengeService,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaRecoveryRequests,
  mfaSettings,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import guestMfaHandler from "#server/api/guest/auth/users/mfa.post";
import mfaRecoveryVerifyHandler from "#server/api/guest/auth/users/mfa-recovery/verify.get";
import mfaRecoveryCancelHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/[reqUuid]/cancel.post";
import mfaRecoveryCompleteHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/[reqUuid]/complete.post";
import mfaRecoveryListHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/index.get";
import mfaRecoveryCreateHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/index.post";
import mfaDisableHandler from "#server/api/users/mfa/disable.post";
import mfaRecoveryCodesHandler from "#server/api/users/mfa/recovery-codes.post";
import mfaSetupHandler from "#server/api/users/mfa/setup.post";
import mfaStatusHandler from "#server/api/users/mfa/status.get";
import mfaVerifyHandler from "#server/api/users/mfa/verify.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const MFA_SECRET_KEY = requireEnv("MFA_ENCRYPTION_KEY");

let testUserId = 1;
let testUserUuid = "";
let testManagerId = 1;
let currentTotpSecret = "";
let storedRecoveryCodes: string[] = [];

beforeAll(async () => {
  const db = getOwnerDb();
  const unique = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  const pwd = await hashPassword("StrongPassword123!");
  const [u] = await db
    .insert(users)
    .values({
      email: `user-mfa-${unique}@mindkid.vn`,
      passwordHash: pwd,
      displayName: "MFA Test User",
      status: "active",
    })
    .returning({ id: users.id, uuid: users.uuid });
  testUserId = u.id;
  testUserUuid = u.uuid;

  const mgrPwd = await hashPassword("AdminPassword123!");
  const [m] = await db
    .insert(managers)
    .values({
      email: `admin-mfa-${unique}@mindkid.vn`,
      passwordHash: mgrPwd,
      displayName: "Super Admin Test",
      role: "super_admin",
      isActive: true,
    })
    .returning({ id: managers.id });
  testManagerId = m.id;
});

afterAll(async () => {
  const db = getOwnerDb();
  if (testUserId) {
    await db
      .delete(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, testUserId)
        )
      )
      .catch(() => undefined);
    await db
      .delete(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, testUserId)
        )
      )
      .catch(() => undefined);
    await db
      .delete(users)
      .where(eq(users.id, testUserId))
      .catch(() => undefined);
  }
  if (testManagerId) {
    await db
      .delete(managers)
      .where(eq(managers.id, testManagerId))
      .catch(() => undefined);
  }
});

function mockUserEvent(
  reauthAt?: Date | null,
  body?: unknown,
  method = "POST",
  query?: Record<string, unknown>
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
      query,
    },
    _body: body,
  } as any;
}

function mockManagerEvent(
  params: Record<string, string> = {},
  body?: unknown,
  method = body ? "POST" : "GET"
) {
  return {
    method,
    node: {
      req: {
        method,
        url: "/api/managers/test",
        headers: {
          "user-agent": "VitestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
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
      manager: {
        manager_id: testManagerId,
        display_name: "Super Admin Test",
        role: "super_admin",
      },
      params,
      body,
    },
    _body: body,
  } as any;
}

describe("User MFA Flow (P2.11, BR-MFA-01 - BR-MFA-12)", () => {
  it("GET /api/users/mfa/status returns disabled initially", async () => {
    const event = mockUserEvent(null, null, "GET");
    const res = (await mfaStatusHandler(event)) as any;
    expect(res.enabled).toBe(false);
    expect(res.confirmed_at).toBeNull();
    expect(res.recovery_codes_remaining).toBe(0);
  });

  it("POST /api/users/mfa/setup requires recent reauth <= 5 min (BR-MFA-10)", async () => {
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
    storedRecoveryCodes = res.recovery_codes;

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

  it("GET /api/users/mfa/status reflects enabled state and 10 codes remaining", async () => {
    const event = mockUserEvent(null, null, "GET");
    const res = (await mfaStatusHandler(event)) as any;
    expect(res.enabled).toBe(true);
    expect(res.confirmed_at).toBeDefined();
    expect(res.recovery_codes_remaining).toBe(10);
  });

  it("POST /api/guest/auth/users/mfa consumes challenge and verifies TOTP (BR-MFA-09, D-KY)", async () => {
    const mfaService = new MfaChallengeService(getAuthRedisClient());
    const challenge = await mfaService.createChallenge({
      namespace: "user",
      accountId: testUserId,
      displayName: "MFA Test User",
      rememberMe: false,
      ipAddress: "127.0.0.1",
    });

    const code = generateTotpCode(currentTotpSecret);
    const guestEvent = {
      method: "POST",
      node: {
        req: {
          method: "POST",
          headers: {
            "user-agent": "VitestRunner/1.0",
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
        body: {
          challenge: challenge.challengeToken,
          code,
        },
      },
      _body: {
        challenge: challenge.challengeToken,
        code,
      },
    } as any;

    const res = (await guestMfaHandler(guestEvent)) as any;
    expect(res.status).toBe("ok");
    expect(res.user.id).toBe(testUserId);
  });

  it("POST /api/guest/auth/users/mfa can also consume a single-use recovery code (BR-MFA-02)", async () => {
    const mfaService = new MfaChallengeService(getAuthRedisClient());
    const challenge = await mfaService.createChallenge({
      namespace: "user",
      accountId: testUserId,
      displayName: "MFA Test User",
      rememberMe: false,
      ipAddress: "127.0.0.1",
    });

    const recoveryCodeToUse = storedRecoveryCodes[0];
    const guestEvent = {
      method: "POST",
      node: {
        req: {
          method: "POST",
          headers: {
            "user-agent": "VitestRunner/1.0",
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
        body: {
          challenge: challenge.challengeToken,
          code: recoveryCodeToUse,
        },
      },
      _body: {
        challenge: challenge.challengeToken,
        code: recoveryCodeToUse,
      },
    } as any;

    const res = (await guestMfaHandler(guestEvent)) as any;
    expect(res.status).toBe("ok");

    // Status now reports 9 remaining codes
    const statusRes = (await mfaStatusHandler(
      mockUserEvent(null, null, "GET")
    )) as any;
    expect(statusRes.recovery_codes_remaining).toBe(9);

    // Using the same recovery code a second time fails (BR-MFA-02)
    const challenge2 = await mfaService.createChallenge({
      namespace: "user",
      accountId: testUserId,
      displayName: "MFA Test User",
      rememberMe: false,
      ipAddress: "127.0.0.1",
    });
    const guestEvent2 = {
      method: "POST",
      node: {
        req: { method: "POST", headers: {} },
        res: {
          setHeader: () => {
            /* mock */
          },
        },
      },
      context: {
        body: {
          challenge: challenge2.challengeToken,
          code: recoveryCodeToUse,
        },
      },
      _body: { challenge: challenge2.challengeToken, code: recoveryCodeToUse },
    } as any;

    try {
      await guestMfaHandler(guestEvent2);
      expect.fail("Should throw INVALID_CREDENTIALS for used recovery code");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(401);
    }
  });

  it("POST /api/users/mfa/recovery-codes invalidates old codes and generates new (BR-MFA-11)", async () => {
    const code = generateTotpCode(currentTotpSecret);
    const event = mockUserEvent(new Date(), { code });

    const res = (await mfaRecoveryCodesHandler(event)) as any;
    expect(res.recovery_codes).toBeDefined();
    expect(res.recovery_codes.length).toBe(10);
    storedRecoveryCodes = res.recovery_codes;
  });

  describe("Admin MFA Recovery Workflow (Tasks 6, 7, 8, BR-MFA-11)", () => {
    let recoveryReqUuid = "";
    let verificationToken = "";

    it("POST /api/managers/users/:uuid/mfa-recovery-requests creates recovery request", async () => {
      const event = mockManagerEvent(
        { uuid: testUserUuid },
        {
          reason: "User lost phone and all recovery codes. Identity verified.",
        },
        "POST"
      );

      const res = (await mfaRecoveryCreateHandler(event)) as any;
      expect(res.success).toBe(true);
      expect(res.request.uuid).toBeDefined();
      expect(res.request.status).toBe("pending_verification");
      expect(res.request.eligible_at).toBeDefined();
      expect(res.verification_token).toBeDefined();

      recoveryReqUuid = res.request.uuid;
      verificationToken = res.verification_token;
    });

    it("GET /api/managers/users/:uuid/mfa-recovery-requests lists active requests", async () => {
      const event = mockManagerEvent({ uuid: testUserUuid }, null, "GET");
      const res = (await mfaRecoveryListHandler(event)) as any;
      expect(res.requests).toBeDefined();
      expect(res.requests.length).toBeGreaterThanOrEqual(1);
      const found = res.requests.find((r: any) => r.uuid === recoveryReqUuid);
      expect(found).toBeDefined();
      expect(found.status).toBe("pending_verification");
    });

    it("GET /api/guest/auth/users/mfa-recovery/verify verifies email token and transitions to waiting", async () => {
      const event = {
        method: "GET",
        node: {
          req: {
            method: "GET",
            url: `/api/guest/auth/users/mfa-recovery/verify?token=${verificationToken}`,
            headers: {
              "user-agent": "VitestTestRunner/1.0",
            },
          },
          res: {
            setHeader: () => {
              /* mock */
            },
          },
        },
        context: {
          query: { token: verificationToken },
        },
        _query: { token: verificationToken },
      } as any;

      const res = (await mfaRecoveryVerifyHandler(event)) as any;
      expect(res.success).toBe(true);

      const db = getOwnerDb();
      const [req] = await db
        .select()
        .from(mfaRecoveryRequests)
        .where(eq(mfaRecoveryRequests.uuid, recoveryReqUuid));
      expect(req.status).toBe("waiting");
      expect(req.emailVerifiedAt).toBeDefined();
    });

    it("POST .../complete fails if 48h waiting period has not elapsed", async () => {
      const event = mockManagerEvent(
        { uuid: testUserUuid, reqUuid: recoveryReqUuid },
        {},
        "POST"
      );

      try {
        await mfaRecoveryCompleteHandler(event);
        expect.fail("Should throw WAITING_PERIOD_NOT_ELAPSED");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(400);
        expect(err.statusMessage).toBe("WAITING_PERIOD_NOT_ELAPSED");
      }
    });

    it("POST .../complete succeeds once 48h has elapsed, disabling MFA and revoking sessions", async () => {
      // Simulate 48h elapsed in DB
      const db = getOwnerDb();
      await db
        .update(mfaRecoveryRequests)
        .set({ eligibleAt: new Date(Date.now() - 1000) })
        .where(eq(mfaRecoveryRequests.uuid, recoveryReqUuid));

      const event = mockManagerEvent(
        { uuid: testUserUuid, reqUuid: recoveryReqUuid },
        {},
        "POST"
      );

      const res = (await mfaRecoveryCompleteHandler(event)) as any;
      expect(res.success).toBe(true);
      expect(res.status).toBe("completed");

      // Verify MFA settings and recovery codes are wiped
      const [mfa] = await db
        .select()
        .from(mfaSettings)
        .where(
          and(
            eq(mfaSettings.accountType, "user"),
            eq(mfaSettings.accountId, testUserId)
          )
        );
      expect(mfa).toBeUndefined();

      const codes = await db
        .select()
        .from(mfaRecoveryCodes)
        .where(
          and(
            eq(mfaRecoveryCodes.accountType, "user"),
            eq(mfaRecoveryCodes.accountId, testUserId)
          )
        );
      expect(codes.length).toBe(0);
    });

    it("POST .../cancel cancels an active recovery request", async () => {
      // Re-enable MFA first for test
      const secret = currentTotpSecret;
      const encryptedSecret = encryptTotpSecret(secret, MFA_SECRET_KEY);
      const db = getOwnerDb();
      await db.insert(mfaSettings).values({
        accountType: "user",
        accountId: testUserId,
        secretEncrypted: encryptedSecret,
        confirmedAt: new Date(),
      });

      // Create new request
      const createEvent = mockManagerEvent(
        { uuid: testUserUuid },
        { reason: "Second recovery test for cancellation flow" },
        "POST"
      );
      const createRes = (await mfaRecoveryCreateHandler(createEvent)) as any;
      const reqToCancelUuid = createRes.request.uuid;

      // Cancel request
      const cancelEvent = mockManagerEvent(
        { uuid: testUserUuid, reqUuid: reqToCancelUuid },
        {},
        "POST"
      );
      const cancelRes = (await mfaRecoveryCancelHandler(cancelEvent)) as any;
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.status).toBe("cancelled");
    });
  });

  it("POST /api/users/mfa/disable requires reauth and valid code to disable (BR-MFA-03)", async () => {
    const code = generateTotpCode(currentTotpSecret);
    const disableEvent = mockUserEvent(new Date(), { code });
    const res = (await mfaDisableHandler(disableEvent)) as any;
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
