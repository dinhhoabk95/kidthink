import { appError, createWebUserToken, verifyPassword } from "@kidthink/auth";
import { getAppDb, users } from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, type H3Event, readBody } from "h3";
import {
  getUserRefreshService,
  getWebJwtSecret,
  respondToUserAuthError,
  setUserAuthCookies,
} from "../../../../utils/auth-runtime";

const DUMMY_HASH =
  "scrypt$16384$8$1$66616b6573616c74$66616b656861736866616b656861736866616b6568617368";

function parseLoginCredentials(rawBody: unknown): {
  email: string;
  password: string;
} {
  const payload = (
    rawBody && typeof rawBody === "object" ? rawBody : {}
  ) as Record<string, unknown>;
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!(email?.includes("@") && password)) {
    throw appError("INVALID_CREDENTIALS");
  }

  return { email, password };
}

export async function handleLogin(event: H3Event, testBody?: unknown) {
  try {
    const rawIp =
      getHeader(event, "x-forwarded-for")?.split(",")[0] ||
      getHeader(event, "x-real-ip") ||
      "127.0.0.1";

    const rateLimitRes = await enforceTwoAxisRateLimit({
      routeClass: "auth:register",
      remoteIp: rawIp,
    });

    if (rateLimitRes.statusCode === 429) {
      throw appError("RATE_LIMITED");
    }

    const rawBody =
      testBody ??
      event.context?.body ??
      (await readBody(event).catch(() => null));
    const { email, password } = parseLoginCredentials(rawBody);

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

    const userAgent = getHeader(event, "user-agent") || "unknown";
    const refreshService = getUserRefreshService(event);

    const sessionResult = await refreshService.createSession({
      account: { type: "user", id: user.id },
      deviceLabel: userAgent,
      ipAddress: rawIp,
      authMethod: "password",
    });

    const accessJwt = await createWebUserToken({
      payload: {
        user_id: user.id,
        display_name: user.displayName,
        session_id: sessionResult.sessionId,
        refresh_token_version: user.refreshTokenVersion,
      },
      secret: getWebJwtSecret(event),
    });

    setUserAuthCookies(event, accessJwt, sessionResult.refreshEnvelope);

    const now = new Date();
    await db
      .update(users)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(eq(users.id, user.id));

    return {
      user: {
        uuid: user.uuid,
        displayName: user.displayName,
        status: user.status,
      },
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleLogin(event));
