import {
  encodeOAuthStatePayload,
  generateOAuthState,
  getOAuthRegistry,
  isOAuthProvider,
  OAUTH_COOKIE_NAME,
  OAUTH_STATE_TTL_SECONDS,
  requireUserAuth,
  sanitizeReturnTo,
} from "@mindkid/auth";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  sendRedirect,
  setCookie,
  setResponseStatus,
} from "h3";
import {
  assertRateLimitAllowed,
  getVerifiedRemoteIp,
} from "../../../../../utils/auth-runtime.js";
import { requireReauth } from "../../../../../utils/reauth-runtime.js";

function getOAuthStateSecret(): string {
  return (
    process.env.NUXT_SESSION_PASSWORD ||
    process.env.SESSION_SECRET ||
    "dev-secret-key-oauth-state-at-least-32-chars-long"
  );
}

export default defineEventHandler(async (event) => {
  const rawProvider = getRouterParam(event, "provider") || "";
  if (!isOAuthProvider(rawProvider)) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "OAUTH_PROVIDER_DISABLED",
      data: {
        code: "OAUTH_PROVIDER_DISABLED",
        message: "Nhà cung cấp đăng nhập này hiện chưa khả dụng.",
      },
    });
  }

  const registry = getOAuthRegistry();
  if (!registry.isProviderEnabled(rawProvider)) {
    setResponseStatus(event, 404);
    throw createError({
      statusCode: 404,
      statusMessage: "OAUTH_PROVIDER_DISABLED",
      data: {
        code: "OAUTH_PROVIDER_DISABLED",
        message: "Nhà cung cấp đăng nhập này hiện chưa khả dụng.",
      },
    });
  }

  // Rate limiting (BR-OAP-12)
  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:oauth:start",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const query = getQuery(event);
  const rawIntent = String(query.intent || "login").toLowerCase();
  const intent = rawIntent === "link" ? ("link" as const) : ("login" as const);
  const returnTo = sanitizeReturnTo(query.return_to);

  let userId: number | undefined;

  // BR-SLK-01: linking requires active session and reauth within 5 minutes
  if (intent === "link") {
    const userSession = requireUserAuth(event);
    userId = Number(userSession.user_id);
    await requireReauth(event);
  }

  const { code_verifier, code_challenge } = await registry.generatePKCE();
  const state = generateOAuthState();

  const statePayload = {
    state,
    code_verifier,
    intent,
    return_to: returnTo,
    provider: rawProvider,
    user_id: userId,
    created_at: Date.now(),
  };

  const token = encodeOAuthStatePayload(statePayload, getOAuthStateSecret());

  setCookie(event, OAUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const authUrl = await registry.buildAuthorizationUrl(
    rawProvider,
    state,
    code_challenge
  );

  return sendRedirect(event, authUrl, 302);
});
