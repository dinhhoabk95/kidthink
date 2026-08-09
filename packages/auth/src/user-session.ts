import { jwtVerify, SignJWT } from "jose";
import type { UserTokenPayload } from "./contracts";
import { appError } from "./errors";
import { encodeAuthSecret } from "./secret";

export const KIDTHINK_USER_AUDIENCE = "kidthink:user";
export const KIDTHINK_WEB_ISSUER = "kidthink:web";
export const USER_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export interface CreateUserTokenOptions {
  readonly payload: UserTokenPayload;
  readonly secret: string;
  readonly expiresInSeconds?: number;
}

export interface VerifyUserTokenOptions {
  readonly token: string;
  readonly secret: string;
}

export async function createWebUserToken(
  options: CreateUserTokenOptions
): Promise<string> {
  const secretKey = encodeAuthSecret(options.secret);
  const ttl = options.expiresInSeconds ?? USER_ACCESS_TOKEN_TTL_SECONDS;

  const rawPayload = options.payload as unknown as Record<string, unknown>;
  if (
    "role" in rawPayload ||
    "package" in rawPayload ||
    "tier" in rawPayload ||
    "entitlement" in rawPayload
  ) {
    throw appError("UNAUTHENTICATED");
  }

  const jwt = await new SignJWT({
    name: options.payload.display_name,
    sid: options.payload.session_id,
    ver: options.payload.refresh_token_version,
    ...(options.payload.active_child_id === undefined
      ? {}
      : { active_child_id: options.payload.active_child_id }),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(options.payload.user_id))
    .setIssuer(KIDTHINK_WEB_ISSUER)
    .setAudience(KIDTHINK_USER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey);

  return jwt;
}

function extractUserPayload(
  payload: Record<string, unknown>
): UserTokenPayload {
  if ("role" in payload || "manager_id" in payload) {
    throw appError("UNAUTHENTICATED");
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw appError("UNAUTHENTICATED");
  }

  const displayName = typeof payload.name === "string" ? payload.name : "";
  const sessionId = typeof payload.sid === "string" ? payload.sid : "";
  const refreshTokenVersion = typeof payload.ver === "number" ? payload.ver : 0;
  const activeChildId =
    typeof payload.active_child_id === "number"
      ? payload.active_child_id
      : undefined;

  if (
    !(displayName && sessionId && Number.isInteger(refreshTokenVersion)) ||
    refreshTokenVersion < 0 ||
    (activeChildId !== undefined &&
      (!Number.isInteger(activeChildId) || activeChildId <= 0))
  ) {
    throw appError("UNAUTHENTICATED");
  }

  return {
    user_id: userId,
    display_name: displayName,
    session_id: sessionId,
    refresh_token_version: refreshTokenVersion,
    ...(activeChildId === undefined ? {} : { active_child_id: activeChildId }),
  };
}

export async function verifyWebUserToken(
  options: VerifyUserTokenOptions
): Promise<UserTokenPayload> {
  try {
    const secretKey = encodeAuthSecret(options.secret);
    const { payload } = await jwtVerify(options.token, secretKey, {
      issuer: KIDTHINK_WEB_ISSUER,
      audience: KIDTHINK_USER_AUDIENCE,
      algorithms: ["HS256"],
    });

    return extractUserPayload(payload as Record<string, unknown>);
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") {
      throw err;
    }
    throw appError("UNAUTHENTICATED");
  }
}
