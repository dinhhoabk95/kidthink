import {
  getAuthRedisClient,
  RedisSessionStore,
  requireManagerAuth,
} from "@mindkid/auth";
import { activeSessions, getAppDb } from "@mindkid/db";
import { and, eq, gte, isNull } from "drizzle-orm";
import type { H3Event } from "h3";
import { defineApiRoute } from "#server/utils/define-api-route";

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

export async function handleGetManagerSessions(event: H3Event) {
  const managerSession = requireManagerAuth(event);
  const db = getAppDb();
  const currentDeviceId = await new RedisSessionStore(getAuthRedisClient())
    .getDeviceId("manager", managerSession.session_id)
    .catch(() => null);

  const rows = await db
    .select()
    .from(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "manager"),
        eq(activeSessions.accountId, managerSession.manager_id),
        isNull(activeSessions.revokedAt),
        gte(activeSessions.expiresAt, new Date())
      )
    );

  return {
    sessions: rows.map((r) => ({
      id: String(r.id),
      deviceLabel: r.deviceLabel,
      ipAddress: redactIpAddress(r.ipAddress),
      authMethod: r.authMethod,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
      isCurrent:
        String(r.id) === managerSession.session_id ||
        Boolean(currentDeviceId && r.deviceId === currentDeviceId),
    })),
  };
}

export default defineApiRoute({
  auth: "manager",
  handler: ({ event }) => handleGetManagerSessions(event),
});
