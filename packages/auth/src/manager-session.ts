import { jwtVerify, SignJWT } from "jose";
import type { ManagerRole, ManagerTokenPayload } from "./contracts";
import { appError } from "./errors";
import { encodeAuthSecret } from "./secret";
import { USER_ACCESS_TOKEN_TTL_SECONDS } from "./user-session";

export const KIDTHINK_MANAGER_AUDIENCE = "kidthink:manager";
export const KIDTHINK_ADMIN_ISSUER = "kidthink:admin";

export interface CreateManagerTokenOptions {
  readonly payload: ManagerTokenPayload;
  readonly secret: string;
  readonly expiresInSeconds?: number;
}

export interface VerifyManagerTokenOptions {
  readonly token: string;
  readonly secret: string;
}

const VALID_ROLES = new Set<ManagerRole>(["super_admin", "content_reviewer"]);

export async function createAdminManagerToken(
  options: CreateManagerTokenOptions
): Promise<string> {
  const secretKey = encodeAuthSecret(options.secret);
  const ttl = options.expiresInSeconds ?? USER_ACCESS_TOKEN_TTL_SECONDS;

  const rawPayload = options.payload as unknown as Record<string, unknown>;
  if (
    "active_child_id" in rawPayload ||
    "user_id" in rawPayload ||
    !VALID_ROLES.has(options.payload.role)
  ) {
    throw appError("UNAUTHENTICATED");
  }

  const jwt = await new SignJWT({
    name: options.payload.display_name,
    sid: options.payload.session_id,
    ver: options.payload.refresh_token_version,
    role: options.payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(options.payload.manager_id))
    .setIssuer(KIDTHINK_ADMIN_ISSUER)
    .setAudience(KIDTHINK_MANAGER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey);

  return jwt;
}

export async function verifyAdminManagerToken(
  options: VerifyManagerTokenOptions
): Promise<ManagerTokenPayload> {
  try {
    const secretKey = encodeAuthSecret(options.secret);
    const { payload } = await jwtVerify(options.token, secretKey, {
      issuer: KIDTHINK_ADMIN_ISSUER,
      audience: KIDTHINK_MANAGER_AUDIENCE,
      algorithms: ["HS256"],
    });

    if ("active_child_id" in payload || "user_id" in payload) {
      throw appError("UNAUTHENTICATED");
    }

    const managerId = Number(payload.sub);
    if (!Number.isInteger(managerId) || managerId <= 0) {
      throw appError("UNAUTHENTICATED");
    }

    const displayName = typeof payload.name === "string" ? payload.name : "";
    const sessionId = typeof payload.sid === "string" ? payload.sid : "";
    const refreshTokenVersion =
      typeof payload.ver === "number" ? payload.ver : 0;
    const role = payload.role as ManagerRole;

    if (
      !(
        displayName &&
        sessionId &&
        Number.isInteger(refreshTokenVersion) &&
        refreshTokenVersion >= 0 &&
        VALID_ROLES.has(role)
      )
    ) {
      throw appError("UNAUTHENTICATED");
    }

    return {
      manager_id: managerId,
      display_name: displayName,
      session_id: sessionId,
      refresh_token_version: refreshTokenVersion,
      role,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") {
      throw err;
    }
    throw appError("UNAUTHENTICATED");
  }
}

export async function createMfaChallengeToken(options: {
  readonly managerId: number;
  readonly email: string;
  readonly secret: string;
}): Promise<string> {
  const secretKey = encodeAuthSecret(options.secret);
  return await new SignJWT({
    purpose: "mfa_challenge",
    email: options.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(options.managerId))
    .setIssuer(KIDTHINK_ADMIN_ISSUER)
    .setAudience(KIDTHINK_MANAGER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey);
}

export async function verifyMfaChallengeToken(options: {
  readonly token: string;
  readonly secret: string;
}): Promise<{ managerId: number; email: string }> {
  try {
    const secretKey = encodeAuthSecret(options.secret);
    const { payload } = await jwtVerify(options.token, secretKey, {
      issuer: KIDTHINK_ADMIN_ISSUER,
      audience: KIDTHINK_MANAGER_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (payload.purpose !== "mfa_challenge") {
      throw appError("UNAUTHENTICATED");
    }

    const managerId = Number(payload.sub);
    const email = typeof payload.email === "string" ? payload.email : "";

    if (!Number.isInteger(managerId) || managerId <= 0 || !email) {
      throw appError("UNAUTHENTICATED");
    }

    return { managerId, email };
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") {
      throw err;
    }
    throw appError("UNAUTHENTICATED");
  }
}
