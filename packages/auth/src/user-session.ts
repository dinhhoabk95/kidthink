import { jwtVerify, SignJWT } from "jose";
import type { UserTokenPayload } from "./contracts";
import { appError } from "./errors";

export const KIDTHINK_WEB_AUDIENCE = "kidthink-web";
export const KIDTHINK_ISSUER = "kidthink-auth";
export const USER_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export interface CreateUserTokenOptions {
  readonly payload: UserTokenPayload;
  readonly secret: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly expiresInSeconds?: number;
}

export interface VerifyUserTokenOptions {
  readonly token: string;
  readonly secret: string;
  readonly issuer?: string;
  readonly audience?: string;
}

export async function createWebUserToken(
  options: CreateUserTokenOptions
): Promise<string> {
  const secretKey = new TextEncoder().encode(options.secret);
  const iss = options.issuer ?? KIDTHINK_ISSUER;
  const aud = options.audience ?? KIDTHINK_WEB_AUDIENCE;
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
    .setIssuer(iss)
    .setAudience(aud)
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
  if (Number.isNaN(userId) || userId <= 0) {
    throw appError("UNAUTHENTICATED");
  }

  const displayName = typeof payload.name === "string" ? payload.name : "";
  const sessionId = typeof payload.sid === "string" ? payload.sid : "";
  const refreshTokenVersion = typeof payload.ver === "number" ? payload.ver : 0;
  const activeChildId =
    typeof payload.active_child_id === "number"
      ? payload.active_child_id
      : undefined;

  if (!(displayName && sessionId && refreshTokenVersion)) {
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
  const secretKey = new TextEncoder().encode(options.secret);
  const expectedAud = options.audience ?? KIDTHINK_WEB_AUDIENCE;
  const expectedIss = options.issuer ?? KIDTHINK_ISSUER;

  try {
    const { payload } = await jwtVerify(options.token, secretKey, {
      issuer: expectedIss,
      audience: expectedAud,
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
