import {
  appError,
  generateSecureToken,
  getBrowserSessionService,
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
} from "@kidthink/auth";
import {
  consentLogs,
  consentRequirements,
  getAppDb,
  getAppSql,
  notifications,
  PostgresSessionStore,
  users,
  verificationTokens,
} from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import {
  defineEventHandler,
  getHeader,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import { setUserSession } from "#imports";
import {
  assertRateLimitAllowed,
  assertRequestBodySize,
  assertSameOriginRequest,
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime";

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  terms_requirement_at?: string | null;
  privacy_requirement_at?: string | null;
}

function parseAndValidateRegisterBody(body: unknown): RegisterPayload {
  if (!body || typeof body !== "object") {
    throw appError("VALIDATION_FAILED", {
      reason: "Dữ liệu yêu cầu không hợp lệ.",
    });
  }

  const payload = body as Record<string, unknown>;
  const allowedKeys = new Set([
    "email",
    "password",
    "display_name",
    "accept_terms",
    "accept_privacy",
    "terms_requirement_at",
    "privacy_requirement_at",
  ]);

  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) {
      throw appError("VALIDATION_FAILED", {
        reason: `Trường không hợp lệ hoặc bị cấm: '${key}'`,
      });
    }
  }

  if (payload.accept_terms !== true || payload.accept_privacy !== true) {
    throw appError("VALIDATION_FAILED", {
      reason:
        "Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư.",
    });
  }

  const email = payload.email;
  if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
    throw appError("VALIDATION_FAILED", {
      reason: "Địa chỉ email không hợp lệ.",
    });
  }

  const displayName = payload.display_name;
  if (
    typeof displayName !== "string" ||
    displayName.trim().length < 2 ||
    displayName.trim().length > 60
  ) {
    throw appError("VALIDATION_FAILED", {
      reason: "Tên hiển thị phải từ 2 đến 60 ký tự.",
    });
  }

  const password = payload.password;
  if (typeof password !== "string") {
    throw appError("VALIDATION_FAILED", {
      reason: "Mật khẩu không hợp lệ.",
    });
  }

  const passVal = validatePasswordStrength(password);
  if (!passVal.valid) {
    throw appError("VALIDATION_FAILED", {
      reason: passVal.reason || "Mật khẩu không đạt yêu cầu an toàn.",
    });
  }

  return {
    email: email.trim().toLowerCase(),
    password,
    display_name: displayName.trim(),
    accept_terms: true,
    accept_privacy: true,
  };
}

export async function handleRegister(event: H3Event, testBody?: unknown) {
  try {
    assertSameOriginRequest(event);
    assertRequestBodySize(event, 32 * 1024);
    const rawIp = getVerifiedRemoteIp(event);
    const rateLimitRes = await enforceTwoAxisRateLimit({
      routeClass: "auth:register",
      remoteIp: rawIp,
    });

    assertRateLimitAllowed(rateLimitRes.statusCode);

    const rawBody =
      testBody ??
      event.context?.body ??
      (await readBody(event).catch(() => null));
    const validated = parseAndValidateRegisterBody(rawBody);

    const db = getAppDb();

    // Check requirement markers (D-QY)
    const reqs = await db.select().from(consentRequirements);
    const termsReq = reqs.find((r) => r.consentType === "terms");
    const privReq = reqs.find((r) => r.consentType === "privacy");

    if (
      validated.terms_requirement_at !== undefined &&
      termsReq?.reconsentRequiredAt &&
      (!validated.terms_requirement_at ||
        new Date(validated.terms_requirement_at).getTime() !==
          termsReq.reconsentRequiredAt.getTime())
    ) {
      throw appError("CONSENT_REQUIREMENT_CHANGED");
    }
    if (
      validated.privacy_requirement_at !== undefined &&
      privReq?.reconsentRequiredAt &&
      (!validated.privacy_requirement_at ||
        new Date(validated.privacy_requirement_at).getTime() !==
          privReq.reconsentRequiredAt.getTime())
    ) {
      throw appError("CONSENT_REQUIREMENT_CHANGED");
    }

    // BR-REG-07: Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validated.email));

    if (existing.length > 0) {
      throw appError("EMAIL_ALREADY_REGISTERED");
    }

    const passHash = await hashPassword(validated.password);

    // Create user record
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        passwordHash: passHash,
        displayName: validated.display_name,
        status: "pending_verification",
      })
      .returning();

    const userAgent = getHeader(event, "user-agent") || "unknown";

    // BR-REG-03: Insert 2 consent logs
    await db.insert(consentLogs).values([
      {
        userId: newUser.id,
        consentType: "terms",
        action: "accepted",
        ipAddress: rawIp,
        userAgent,
      },
      {
        userId: newUser.id,
        consentType: "privacy",
        action: "accepted",
        ipAddress: rawIp,
        userAgent,
      },
    ]);

    // BR-EVF-01, BR-EVF-02: Generate 32-byte verification token valid for 24h
    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: newUser.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
    });

    // Create notification record
    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: newUser.id,
      channel: "email",
      templateCode: "email_verification",
      payload: {
        token: rawToken,
        email: newUser.email,
        displayName: newUser.displayName,
      },
      status: "queued",
    });

    // Create opaque session in Redis
    const sessionService = getBrowserSessionService();
    const createdSession = await sessionService.create({
      namespace: "user",
      accountId: newUser.id,
      displayName: newUser.displayName,
      rememberMe: false,
      ipAddress: rawIp,
    });

    await setUserSession(event, {
      secure: {
        session_token: createdSession.sessionToken,
      },
    });

    ensureUserCsrfCookie(event);

    const pgStore = new PostgresSessionStore(getAppSql());
    await pgStore
      .recordSession({
        account_type: "user",
        account_id: newUser.id,
        device_id: createdSession.deviceId,
        remembered: false,
        device_label: userAgent,
        ip_address: rawIp,
        auth_method: "password",
        expires_at: createdSession.expiresAt,
      })
      .catch(() => null);

    if (event?.node?.res) {
      setResponseStatus(event, 201);
    }
    return {
      user: {
        uuid: newUser.uuid,
        displayName: newUser.displayName,
        status: newUser.status,
      },
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleRegister(event));
