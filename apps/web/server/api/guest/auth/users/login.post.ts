import {
  appError,
  getAuthRedisClient,
  getBrowserSessionService,
  MfaChallengeService,
  verifyPassword,
} from "@mindkid/auth";
import {
  getAppDb,
  getAppSql,
  mfaSettings,
  PostgresSessionStore,
  users,
} from "@mindkid/db";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  getHeader,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRateLimitAllowed,
  assertRequestBodySize,
  assertSameOriginRequest,
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
  setUserRememberCookie,
} from "#server/utils/auth-runtime";

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

const LoginSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(1024),
    rememberMe: z.boolean().default(false),
  })
  .strict();

function parseLoginCredentials(rawBody: unknown): {
  email: string;
  password: string;
  rememberMe: boolean;
} {
  const parsed = LoginSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw appError("INVALID_CREDENTIALS");
  }
  return {
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    rememberMe: parsed.data.rememberMe,
  };
}

export async function handleLogin(event: H3Event, testBody?: unknown) {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);
  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:login",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));
  const { email, password, rememberMe } = parseLoginCredentials(rawBody);

  const rateLimitRes = await enforceTwoAxisRateLimit({
    routeClass: "auth:login",
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: email,
  });
  assertRateLimitAllowed(rateLimitRes.statusCode);

  const db = getAppDb();
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // BR-LGN-03 / D-EP: Timing mitigation for missing user or missing passwordHash
  if (!user?.passwordHash) {
    await verifyPassword(password, DUMMY_HASH).catch(() => false);
    throw appError("INVALID_CREDENTIALS");
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw appError("INVALID_CREDENTIALS");
  }

  if (user.status === "suspended") {
    throw appError("ACCOUNT_SUSPENDED");
  }
  if (user.status === "deleted") {
    throw appError("ACCOUNT_DELETED");
  }

  // BR-MFA-09 / D-KY: Check if user has MFA enabled
  const [mfa] = await db
    .select({ id: mfaSettings.id, confirmedAt: mfaSettings.confirmedAt })
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, user.id)
      )
    );

  if (mfa?.confirmedAt) {
    const mfaService = new MfaChallengeService(getAuthRedisClient());
    const createdChallenge = await mfaService.createChallenge({
      namespace: "user",
      accountId: user.id,
      displayName: user.displayName,
      rememberMe,
      ipAddress: getVerifiedRemoteIp(event),
    });

    setResponseStatus(event, 428);
    return {
      status: "MFA_REQUIRED",
      challenge: createdChallenge.challengeToken,
      mfa_enabled: true,
    };
  }

  const userAgent = getHeader(event, "user-agent") || "unknown";
  const sessionService = getBrowserSessionService();

  const created = await sessionService.create({
    namespace: "user",
    accountId: user.id,
    displayName: user.displayName,
    rememberMe,
    ipAddress: getVerifiedRemoteIp(event),
  });

  await setUserSession(event, {
    secure: {
      session_token: created.sessionToken,
    },
  });

  if (created.rememberToken) {
    setUserRememberCookie(event, created.rememberToken);
  }

  ensureUserCsrfCookie(event);

  // Record metadata in PG
  const pgStore = new PostgresSessionStore(getAppSql());
  await pgStore
    .recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: created.deviceId,
      remembered: rememberMe,
      device_label: userAgent,
      ip_address: getVerifiedRemoteIp(event),
      auth_method: "password",
      expires_at: created.expiresAt,
    })
    .catch(() => null);

  const now = new Date();
  await db.update(users).set({ updatedAt: now }).where(eq(users.id, user.id));

  return {
    user: {
      uuid: user.uuid,
      displayName: user.displayName,
      status: user.status,
    },
  };
}

export default defineEventHandler((event) => handleLogin(event));
