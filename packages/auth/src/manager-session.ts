import { jwtVerify, SignJWT } from "jose";
import type { ManagerRole, ManagerTokenPayload } from "./contracts";
import { appError } from "./errors";
import { KIDTHINK_ISSUER, USER_ACCESS_TOKEN_TTL_SECONDS } from "./user-session";

export const KIDTHINK_ADMIN_AUDIENCE = "kidthink-admin";

export interface CreateManagerTokenOptions {
  readonly payload: ManagerTokenPayload;
  readonly secret: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly expiresInSeconds?: number;
}

export interface VerifyManagerTokenOptions {
  readonly token: string;
  readonly secret: string;
  readonly issuer?: string;
  readonly audience?: string;
}

const VALID_ROLES = new Set<ManagerRole>(["super_admin", "content_reviewer"]);

export async function createAdminManagerToken(
  options: CreateManagerTokenOptions
): Promise<string> {
  const secretKey = new TextEncoder().encode(options.secret);
  const iss = options.issuer ?? KIDTHINK_ISSUER;
  const aud = options.audience ?? KIDTHINK_ADMIN_AUDIENCE;
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
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey);

  return jwt;
}

export async function verifyAdminManagerToken(
  options: VerifyManagerTokenOptions
): Promise<ManagerTokenPayload> {
  const secretKey = new TextEncoder().encode(options.secret);
  const expectedAud = options.audience ?? KIDTHINK_ADMIN_AUDIENCE;
  const expectedIss = options.issuer ?? KIDTHINK_ISSUER;

  try {
    const { payload } = await jwtVerify(options.token, secretKey, {
      issuer: expectedIss,
      audience: expectedAud,
      algorithms: ["HS256"],
    });

    if ("active_child_id" in payload || "user_id" in payload) {
      throw appError("UNAUTHENTICATED");
    }

    const managerId = Number(payload.sub);
    if (Number.isNaN(managerId) || managerId <= 0) {
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
        refreshTokenVersion &&
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
