import { activeSessions, getAppDb } from "@kidthink/db";
import { and, eq, gte } from "drizzle-orm";
import { defineEventHandler, type H3Event } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime";

function redactIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) {
    return null;
  }
  if (ipAddress.includes(":")) {
    return "IPv6";
  }
  const octets = ipAddress.split(".");
  return octets.length >= 2 ? `${octets[0]}.${octets[1]}.x.x` : "redacted";
}

export async function handleGetSessions(event: H3Event) {
  try {
    const userSession = await requireWebUserSession(event);
    const db = getAppDb();

    const rows = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, userSession.user_id),
          gte(activeSessions.expiresAt, new Date())
        )
      );

    return {
      sessions: rows.map((r) => ({
        id: String(r.id),
        deviceLabel: r.deviceLabel,
        // Never expose the raw address stored for security/audit purposes.
        ipAddress: redactIpAddress(r.ipAddress),
        authMethod: r.authMethod,
        lastUsedAt: r.lastUsedAt,
        createdAt: r.createdAt,
        isCurrent: String(r.id) === userSession.session_id,
      })),
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleGetSessions(event));
