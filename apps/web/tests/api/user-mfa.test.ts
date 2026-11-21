import { createHmac } from "node:crypto";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  getOwnerDb,
  managers,
  mfaRecoveryRequests,
  userSessions,
  users,
  userTwoFactors,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mfaRecoveryCancelHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/[reqUuid]/cancel.post";
import mfaRecoveryCompleteHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/[reqUuid]/complete.post";
import mfaRecoveryListHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/index.get";
import mfaRecoveryCreateHandler from "#server/api/managers/users/[uuid]/mfa-recovery-requests/index.post";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TRAILING_EQUALS_REGEX = /[=]+$/;
const BASE32_SECRET_REGEX = /^[A-Z2-7]+=*$/i;
const USER_PASSWORD = "StrongPassword123!";

interface TwoFactorEnableResponse {
  totpURI: string;
  backupCodes: string[];
}

interface BackupCodesResponse {
  backupCodes: string[];
}

interface SignInTwoFactorResponse {
  twoFactorRedirect?: boolean;
}

interface HttpErrorShape {
  statusCode?: number;
  status?: number;
  code?: string;
}

function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.replace(TRAILING_EQUALS_REGEX, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      continue;
    }
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4648 Base32 decoding
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4648 Base32 decoding
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function computeTotpCode(secret: string, nowMs = Date.now()): string {
  const key = BASE32_SECRET_REGEX.test(secret)
    ? decodeBase32(secret)
    : Buffer.from(secret, "utf8");
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(Math.floor(nowMs / 30_000)), 0);
  const digest = createHmac("sha1", key).update(counterBuf).digest();
  // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary =
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    ((digest[offset + 3] ?? 0) & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

function postUserAuth(
  path: string,
  body: Record<string, string | boolean>,
  cookie?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost:3000",
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return getUserAuth().handler(
    new Request(`http://localhost:3000/api/auth/users${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  );
}

function buildManagerH3Event(
  managerId: number,
  params: Record<string, string>,
  body?: Record<string, string>,
  method: "GET" | "POST" = body ? "POST" : "GET"
): H3Event {
  const socket = new Socket();
  Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" });
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = "/api/managers/users/mfa-recovery-requests";
  req.headers = {
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
    "user-agent": "VitestAdminRunner/1.0",
  };
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.manager = {
    manager_id: managerId,
    display_name: "Super Admin Test",
    role: "super_admin",
    session_id: `mgr_sess_${managerId}`,
    reauth_at: new Date(),
  };
  event.context.params = params;
  if (body) {
    event.context.body = body;
  }
  return event;
}

let testUserId = 0;
let testUserUuid = "";
let testUserEmail = "";
let testManagerId = 0;
let sessionCookie = "";
let currentTotpSecret = "";
let storedBackupCodes: string[] = [];

beforeAll(async () => {
  setAuthRedisClient(new InMemoryRedisClient());
  resetBetterAuthInstancesForTests();

  const db = getOwnerDb();
  const unique = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  testUserEmail = `user-mfa-${unique}@mindkid.vn`;

  const ctx = await getUserAuth().$context;
  const pwd = await ctx.password.hash(USER_PASSWORD);
  const [u] = await db
    .insert(users)
    .values({
      email: testUserEmail,
      passwordHash: pwd,
      displayName: "MFA Test User",
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .returning({ id: users.id, uuid: users.uuid });
  if (!u) {
    throw new Error("Expected test user");
  }
  testUserId = u.id;
  testUserUuid = u.uuid;

  await ctx.internalAdapter.linkAccount({
    userId: String(testUserId),
    providerId: "credential",
    accountId: String(testUserId),
    password: pwd,
  });

  const [m] = await db
    .insert(managers)
    .values({
      email: `admin-mfa-${unique}@mindkid.vn`,
      passwordHash: pwd,
      displayName: "Super Admin Test",
      role: "super_admin",
      isActive: true,
    })
    .returning({ id: managers.id });
  if (!m) {
    throw new Error("Expected test manager");
  }
  testManagerId = m.id;
});

afterAll(async () => {
  const db = getOwnerDb();
  if (testUserId) {
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

describe("User Better Auth 2FA & Admin MFA Recovery Flow (BR-MFA-01..12)", () => {
  it("requires valid password on two-factor/enable and keeps twoFactorEnabled false until verify-totp succeeds", async () => {
    const db = getOwnerDb();
    const loginRes = await postUserAuth("/sign-in/email", {
      email: testUserEmail,
      password: USER_PASSWORD,
    });
    expect(loginRes.status).toBe(200);
    sessionCookie = collectCookie(loginRes);

    const badEnable = await postUserAuth(
      "/two-factor/enable",
      { password: "WrongPassword!" },
      sessionCookie
    );
    expect(badEnable.status).toBeGreaterThanOrEqual(400);

    const enableRes = await postUserAuth(
      "/two-factor/enable",
      { password: USER_PASSWORD },
      sessionCookie
    );
    expect(enableRes.status).toBe(200);
    const enableData = (await enableRes.json()) as TwoFactorEnableResponse;
    expect(enableData.totpURI).toContain("otpauth://totp/");
    expect(enableData.backupCodes).toHaveLength(10);

    currentTotpSecret =
      new URL(enableData.totpURI).searchParams.get("secret") ?? "";
    storedBackupCodes = enableData.backupCodes;
    expect(currentTotpSecret.length).toBeGreaterThan(10);

    const [beforeVerify] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));
    expect(beforeVerify?.twoFactorEnabled).toBe(false);

    const wrongTotp = await postUserAuth(
      "/two-factor/verify-totp",
      { code: "000000" },
      sessionCookie
    );
    expect(wrongTotp.status).toBeGreaterThanOrEqual(400);

    const validTotp = await postUserAuth(
      "/two-factor/verify-totp",
      { code: computeTotpCode(currentTotpSecret) },
      sessionCookie
    );
    expect(validTotp.status).toBe(200);
    const postVerifyCookie = collectCookie(validTotp);
    if (postVerifyCookie) {
      sessionCookie = postVerifyCookie;
    }

    const [afterVerify] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));
    expect(afterVerify?.twoFactorEnabled).toBe(true);

    const [tfRow] = await db
      .select()
      .from(userTwoFactors)
      .where(eq(userTwoFactors.userId, testUserId));
    expect(tfRow).toBeDefined();
    expect(tfRow?.secret).not.toBe(currentTotpSecret);
  });

  it("challenges password login with twoFactorRedirect and verifies both TOTP and single-use backup code", async () => {
    const db = getOwnerDb();
    await postUserAuth("/sign-out", {}, sessionCookie);

    const step1 = await postUserAuth("/sign-in/email", {
      email: testUserEmail,
      password: USER_PASSWORD,
    });
    expect(step1.status).toBe(200);
    const step1Json = (await step1.json()) as SignInTwoFactorResponse;
    expect(step1Json.twoFactorRedirect).toBe(true);
    const twoFaCookie1 = collectCookie(step1);

    const pendingSessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, testUserId));
    expect(pendingSessions).toHaveLength(0);

    const totpLogin = await postUserAuth(
      "/two-factor/verify-totp",
      { code: computeTotpCode(currentTotpSecret) },
      twoFaCookie1
    );
    expect(totpLogin.status).toBe(200);
    const totpSessionCookie = collectCookie(totpLogin);
    await postUserAuth("/sign-out", {}, totpSessionCookie);

    const step2 = await postUserAuth("/sign-in/email", {
      email: testUserEmail,
      password: USER_PASSWORD,
    });
    const twoFaCookie2 = collectCookie(step2);
    const firstBackup = storedBackupCodes[0] ?? "";

    const backupLogin = await postUserAuth(
      "/two-factor/verify-backup-code",
      { code: firstBackup },
      twoFaCookie2
    );
    expect(backupLogin.status).toBe(200);
    sessionCookie = collectCookie(backupLogin);

    const step3 = await postUserAuth("/sign-in/email", {
      email: testUserEmail,
      password: USER_PASSWORD,
    });
    const twoFaCookie3 = collectCookie(step3);
    const replayBackup = await postUserAuth(
      "/two-factor/verify-backup-code",
      { code: firstBackup },
      twoFaCookie3
    );
    expect(replayBackup.status).toBeGreaterThanOrEqual(400);
  });

  it("regenerates backup codes and disables 2FA via password confirmation (BR-MFA-03, BR-MFA-11)", async () => {
    const db = getOwnerDb();
    const regenRes = await postUserAuth(
      "/two-factor/generate-backup-codes",
      { password: USER_PASSWORD },
      sessionCookie
    );
    expect(regenRes.status).toBe(200);
    const regenJson = (await regenRes.json()) as BackupCodesResponse;
    expect(regenJson.backupCodes).toHaveLength(10);
    expect(regenJson.backupCodes[0]).not.toBe(storedBackupCodes[0]);

    const disableRes = await postUserAuth(
      "/two-factor/disable",
      { password: USER_PASSWORD },
      sessionCookie
    );
    expect(disableRes.status).toBe(200);

    const [disabledUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));
    expect(disabledUser?.twoFactorEnabled).toBe(false);

    const tfRows = await db
      .select()
      .from(userTwoFactors)
      .where(eq(userTwoFactors.userId, testUserId));
    expect(tfRows).toHaveLength(0);
  });

  describe("Retained Admin MFA Recovery Workflow (BR-MFA-11)", () => {
    let recoveryReqUuid = "";

    it("creates and lists recovery request, enforces waiting & 48h window, completes wipe + session revocation, and supports cancel", async () => {
      const db = getOwnerDb();

      const freshLogin = await postUserAuth("/sign-in/email", {
        email: testUserEmail,
        password: USER_PASSWORD,
      });
      expect(freshLogin.status).toBe(200);
      sessionCookie = collectCookie(freshLogin);

      const reEnable = await postUserAuth(
        "/two-factor/enable",
        { password: USER_PASSWORD },
        sessionCookie
      );
      expect(reEnable.status).toBe(200);
      const reEnableJson = (await reEnable.json()) as TwoFactorEnableResponse;
      const secret2 =
        new URL(reEnableJson.totpURI).searchParams.get("secret") ?? "";
      const confirm2 = await postUserAuth(
        "/two-factor/verify-totp",
        { code: computeTotpCode(secret2) },
        sessionCookie
      );
      expect(confirm2.status).toBe(200);

      const createEvent = buildManagerH3Event(
        testManagerId,
        { uuid: testUserUuid },
        {
          reason: "User lost phone and all recovery codes. Identity verified.",
        }
      );
      const createRes = await mfaRecoveryCreateHandler(createEvent);
      expect(createRes.success).toBe(true);
      expect(createRes.request.status).toBe("pending_verification");
      recoveryReqUuid = createRes.request.uuid;

      const listEvent = buildManagerH3Event(
        testManagerId,
        { uuid: testUserUuid },
        undefined,
        "GET"
      );
      const listRes = await mfaRecoveryListHandler(listEvent);
      expect(listRes.requests.some((r) => r.uuid === recoveryReqUuid)).toBe(
        true
      );

      await expect(
        mfaRecoveryCompleteHandler(
          buildManagerH3Event(
            testManagerId,
            { uuid: testUserUuid, reqUuid: recoveryReqUuid },
            {}
          )
        )
      ).rejects.toSatisfy(
        (err: HttpErrorShape) => (err.statusCode ?? err.status) === 403
      );

      await db
        .update(mfaRecoveryRequests)
        .set({
          status: "waiting",
          emailVerifiedAt: new Date(),
        })
        .where(eq(mfaRecoveryRequests.uuid, recoveryReqUuid));

      await expect(
        mfaRecoveryCompleteHandler(
          buildManagerH3Event(
            testManagerId,
            { uuid: testUserUuid, reqUuid: recoveryReqUuid },
            {}
          )
        )
      ).rejects.toSatisfy(
        (err: HttpErrorShape) =>
          (err.statusCode ?? err.status) === 422 &&
          err.code === "VALIDATION_FAILED"
      );

      await db
        .update(mfaRecoveryRequests)
        .set({ eligibleAt: new Date(Date.now() - 1000) })
        .where(eq(mfaRecoveryRequests.uuid, recoveryReqUuid));

      const completeRes = await mfaRecoveryCompleteHandler(
        buildManagerH3Event(
          testManagerId,
          { uuid: testUserUuid, reqUuid: recoveryReqUuid },
          {}
        )
      );
      expect(completeRes.success).toBe(true);
      expect(completeRes.status).toBe("completed");

      const [userAfterComplete] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));
      expect(userAfterComplete?.twoFactorEnabled).toBe(false);

      const tfAfter = await db
        .select()
        .from(userTwoFactors)
        .where(eq(userTwoFactors.userId, testUserId));
      expect(tfAfter).toHaveLength(0);

      const sessionsAfter = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, testUserId));
      expect(sessionsAfter).toHaveLength(0);

      await db.insert(userTwoFactors).values({
        userId: testUserId,
        secret: "encrypted-placeholder",
        backupCodes: "encrypted-codes",
        verified: true,
      });
      await db
        .update(users)
        .set({ twoFactorEnabled: true })
        .where(eq(users.id, testUserId));

      const secondCreate = await mfaRecoveryCreateHandler(
        buildManagerH3Event(
          testManagerId,
          { uuid: testUserUuid },
          { reason: "Second recovery request to verify cancellation flow" }
        )
      );
      const cancelRes = await mfaRecoveryCancelHandler(
        buildManagerH3Event(
          testManagerId,
          { uuid: testUserUuid, reqUuid: secondCreate.request.uuid },
          {}
        )
      );
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.status).toBe("cancelled");
    });
  });
});
