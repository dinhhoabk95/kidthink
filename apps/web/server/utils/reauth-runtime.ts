import { REAUTH_MAX_AGE_SECONDS, verifyReauthWindow } from "@kidthink/auth";
import {
  getAppSql,
  PostgresReauthMethodAvailability,
  PostgresSessionStore,
} from "@kidthink/db";
import type { H3Event } from "h3";
import { requireWebUserSession } from "./auth-runtime.js";

/**
 * BR-ACS-01, BR-ACS-03, BR-ADL-03 & D-IJ:
 * Shared guard verifying that the current session has completed reauthentication within 5 minutes.
 * Throws 428 REAUTH_REQUIRED with available methods (password, social, totp) if not satisfied.
 */
export async function requireReauth(
  event: H3Event,
  now: Date = new Date()
): Promise<void> {
  const user = requireWebUserSession(event);
  const sql = getAppSql();
  const availability = new PostgresReauthMethodAvailability(sql);
  const methods = await availability.getAvailableMethods({
    account_type: "user",
    account_id: user.user_id,
  });

  // Check event context first (for tests and in-memory contexts)
  const contextReauthAt =
    (event.context as { reauth_at?: Date; user?: { reauth_at?: Date } })
      ?.reauth_at ?? (event.context?.user as { reauth_at?: Date })?.reauth_at;
  if (contextReauthAt !== undefined) {
    verifyReauthWindow(contextReauthAt, methods, now, REAUTH_MAX_AGE_SECONDS);
    return;
  }

  // Lookup active_sessions table in DB
  const sessionStore = new PostgresSessionStore(sql);
  const sessionId =
    user.session_id ||
    (event.context?.user as { session_id?: string })?.session_id ||
    `sess_${user.user_id}`;

  const reauthState = await sessionStore.getReauthState(sessionId, {
    account_type: "user",
    account_id: user.user_id,
  });

  verifyReauthWindow(
    reauthState?.reauth_at,
    methods,
    now,
    REAUTH_MAX_AGE_SECONDS
  );
}

export async function markCurrentSessionReauthenticated(
  event: H3Event,
  at: Date = new Date()
): Promise<void> {
  const user = requireWebUserSession(event);
  const sql = getAppSql();
  const sessionStore = new PostgresSessionStore(sql);
  const sessionId =
    user.session_id ||
    (event.context?.user as { session_id?: string })?.session_id ||
    `sess_${user.user_id}`;

  await sessionStore.markReauthenticated(
    sessionId,
    { account_type: "user", account_id: user.user_id },
    at
  );

  if (event.context?.user) {
    (event.context.user as { reauth_at?: Date }).reauth_at = at;
  }
}
