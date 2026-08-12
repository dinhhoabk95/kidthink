import {
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { ManagerTokenPayload, UserTokenPayload } from "./contracts";
import { appError } from "./errors";
import { createAdminManagerToken } from "./manager-session";
import type { SessionStorePort } from "./ports";
import { encodeAuthSecret } from "./secret";
import { createWebUserToken } from "./user-session";

export type AuthNamespace = "user" | "manager";

interface RefreshEnvelopePayload {
  readonly ns: AuthNamespace;
  readonly sid: string;
  readonly ver: number;
  readonly nonce: string;
}

export interface CreateRefreshTokenOptions {
  readonly namespace: AuthNamespace;
  readonly sessionId: string;
  readonly refreshTokenVersion: number;
  readonly secret: string;
}

export interface VerifiedRefreshToken {
  readonly namespace: AuthNamespace;
  readonly sessionId: string;
  readonly refreshTokenVersion: number;
}

const REFRESH_TOKEN_VERSION = "v1";
const REFRESH_KEY_SALT = Buffer.from("kidthink:auth:refresh:v1", "utf8");
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function deriveRefreshMacKey(secret: string, namespace: AuthNamespace): Buffer {
  const secretBytes = encodeAuthSecret(secret);
  return Buffer.from(
    hkdfSync(
      "sha256",
      secretBytes,
      REFRESH_KEY_SALT,
      Buffer.from(`kidthink:${namespace}:refresh-mac`, "utf8"),
      32
    )
  );
}

function validateEnvelopeFields(payload: RefreshEnvelopePayload): void {
  const keys = Object.keys(payload).sort().join(",");
  if (
    keys !== "nonce,ns,sid,ver" ||
    (payload.ns !== "user" && payload.ns !== "manager") ||
    !SESSION_ID_PATTERN.test(payload.sid) ||
    !Number.isSafeInteger(payload.ver) ||
    payload.ver < 0
  ) {
    throw appError("SESSION_REVOKED");
  }

  const nonce = Buffer.from(payload.nonce, "base64url");
  if (
    nonce.byteLength !== 32 ||
    nonce.toString("base64url") !== payload.nonce
  ) {
    throw appError("SESSION_REVOKED");
  }
}

export function createRefreshToken(options: CreateRefreshTokenOptions): string {
  const payload: RefreshEnvelopePayload = {
    ns: options.namespace,
    sid: options.sessionId,
    ver: options.refreshTokenVersion,
    nonce: randomBytes(32).toString("base64url"),
  };
  validateEnvelopeFields(payload);

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const mac = createHmac(
    "sha256",
    deriveRefreshMacKey(options.secret, options.namespace)
  )
    .update(`${REFRESH_TOKEN_VERSION}.${encodedPayload}`, "utf8")
    .digest("base64url");

  return `${REFRESH_TOKEN_VERSION}.${encodedPayload}.${mac}`;
}

export function verifyRefreshToken(
  token: string,
  expectedNamespace: AuthNamespace,
  secret: string
): VerifiedRefreshToken {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== REFRESH_TOKEN_VERSION) {
      throw appError("SESSION_REVOKED");
    }

    const encodedPayload = parts[1] ?? "";
    const encodedMac = parts[2] ?? "";
    const payloadBytes = Buffer.from(encodedPayload, "base64url");
    if (payloadBytes.toString("base64url") !== encodedPayload) {
      throw appError("SESSION_REVOKED");
    }

    const payload = JSON.parse(
      payloadBytes.toString("utf8")
    ) as RefreshEnvelopePayload;
    validateEnvelopeFields(payload);
    if (payload.ns !== expectedNamespace) {
      throw appError("SESSION_REVOKED");
    }

    const suppliedMac = Buffer.from(encodedMac, "base64url");
    const expectedMac = createHmac(
      "sha256",
      deriveRefreshMacKey(secret, expectedNamespace)
    )
      .update(`${REFRESH_TOKEN_VERSION}.${encodedPayload}`, "utf8")
      .digest();
    if (
      suppliedMac.byteLength !== expectedMac.byteLength ||
      suppliedMac.toString("base64url") !== encodedMac ||
      !timingSafeEqual(suppliedMac, expectedMac)
    ) {
      throw appError("SESSION_REVOKED");
    }

    return {
      namespace: payload.ns,
      sessionId: payload.sid,
      refreshTokenVersion: payload.ver,
    };
  } catch {
    throw appError("SESSION_REVOKED");
  }
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface RefreshServiceOptions {
  readonly namespace: AuthNamespace;
  readonly jwtSecret: string;
  readonly refreshTtlSeconds?: number;
}

export interface RotateTokenInput {
  readonly refreshToken: string;
  readonly activeChildCandidateId?: number;
}

export interface RotateTokenResult {
  readonly accessToken: string;
  readonly nextRefreshToken: string;
  readonly session: UserTokenPayload | ManagerTokenPayload;
}

export class RefreshService {
  private readonly store: SessionStorePort;
  private readonly options: RefreshServiceOptions;

  constructor(store: SessionStorePort, options: RefreshServiceOptions) {
    this.store = store;
    this.options = options;
  }

  async createSession(input: {
    account: { type: AuthNamespace; id: number };
    deviceLabel?: string;
    ipAddress?: string;
    authMethod: "password" | "social";
    refreshTokenVersion?: number;
  }): Promise<{ sessionId: string; refreshEnvelope: string }> {
    const version = input.refreshTokenVersion ?? 0;
    const placeholderHash = createHash("sha256")
      .update(randomBytes(32))
      .digest("hex");
    const ttlSeconds =
      this.options.refreshTtlSeconds ??
      (this.options.namespace === "manager" ? 24 * 60 * 60 : 7 * 24 * 60 * 60);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const { session_id } = await this.store.createSession({
      account_type: input.account.type,
      account_id: input.account.id,
      refresh_token_hash: placeholderHash,
      device_label: input.deviceLabel,
      ip_address: input.ipAddress,
      auth_method: input.authMethod,
      expires_at: expiresAt,
    });

    const refreshEnvelope = createRefreshToken({
      namespace: this.options.namespace,
      sessionId: session_id,
      refreshTokenVersion: version,
      secret: this.options.jwtSecret,
    });

    const finalHash = hashRefreshToken(refreshEnvelope);
    await this.store.updateSessionTokenHash(session_id, finalHash);

    return { sessionId: session_id, refreshEnvelope };
  }

  async rotateRefreshToken(
    input: RotateTokenInput
  ): Promise<RotateTokenResult> {
    const verified = verifyRefreshToken(
      input.refreshToken,
      this.options.namespace,
      this.options.jwtSecret
    );
    if (
      input.activeChildCandidateId !== undefined &&
      (!Number.isInteger(input.activeChildCandidateId) ||
        input.activeChildCandidateId <= 0)
    ) {
      throw appError("UNAUTHENTICATED");
    }
    if (
      this.options.namespace === "manager" &&
      input.activeChildCandidateId !== undefined
    ) {
      throw appError("UNAUTHENTICATED");
    }

    const currentHash = hashRefreshToken(input.refreshToken);
    const nextRefreshToken = createRefreshToken({
      namespace: this.options.namespace,
      sessionId: verified.sessionId,
      refreshTokenVersion: verified.refreshTokenVersion,
      secret: this.options.jwtSecret,
    });
    const nextHash = hashRefreshToken(nextRefreshToken);

    const ttlSeconds =
      this.options.refreshTtlSeconds ??
      (this.options.namespace === "manager"
        ? 24 * 60 * 60 // 24 hours for manager
        : 7 * 24 * 60 * 60); // 7 days for user

    const nextExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const result = await this.store.rotate({
      session_id: verified.sessionId,
      account_type: this.options.namespace,
      refresh_token_version: verified.refreshTokenVersion,
      current_refresh_token_hash: currentHash,
      next_refresh_token_hash: nextHash,
      next_expires_at: nextExpiresAt,
      used_at: new Date(),
    });

    if (result.outcome !== "rotated") {
      throw appError("SESSION_REVOKED");
    }

    const session = result.session;
    if (
      session.account_type !== this.options.namespace ||
      session.refresh_token_version !== verified.refreshTokenVersion
    ) {
      throw appError("SESSION_REVOKED");
    }
    let accessToken: string;
    let safeSession: UserTokenPayload | ManagerTokenPayload;

    try {
      if (session.account_type === "manager") {
        safeSession = {
          manager_id: session.account_id,
          display_name: session.display_name,
          session_id: session.session_id,
          refresh_token_version: session.refresh_token_version,
          role: session.role,
        };
        accessToken = await createAdminManagerToken({
          payload: safeSession,
          secret: this.options.jwtSecret,
        });
      } else {
        safeSession = {
          user_id: session.account_id,
          display_name: session.display_name,
          session_id: session.session_id,
          refresh_token_version: session.refresh_token_version,
          ...(input.activeChildCandidateId === undefined
            ? {}
            : { active_child_id: input.activeChildCandidateId }),
        };
        accessToken = await createWebUserToken({
          payload: safeSession,
          secret: this.options.jwtSecret,
        });
      }
    } catch (err) {
      await this.store.revokeSession(verified.sessionId, {
        account_type: this.options.namespace,
        account_id: session.account_id,
      });
      throw err;
    }

    return {
      accessToken,
      nextRefreshToken,
      session: safeSession,
    };
  }

  async revokeSession(
    sessionId: string,
    accountType: AuthNamespace,
    accountId: number
  ): Promise<void> {
    if (accountType !== this.options.namespace) {
      throw appError("UNAUTHENTICATED");
    }
    await this.store.revokeSession(sessionId, {
      account_type: accountType,
      account_id: accountId,
    });
  }

  async logoutAll(
    accountType: "user" | "manager",
    accountId: number
  ): Promise<void> {
    if (accountType !== this.options.namespace) {
      throw appError("UNAUTHENTICATED");
    }
    await this.store.revokeAll({
      account_type: accountType,
      account_id: accountId,
    });
  }
}
