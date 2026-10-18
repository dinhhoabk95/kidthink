import {
  consentLogs,
  consentRequirements,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@mindkid/shared";
import { and, ne, sql } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const db = getOwnerDb();
  const reqs = await db.select().from(consentRequirements);

  const requirements = await Promise.all(
    CONSENT_TYPES.map(async (type) => {
      const meta = CONSENT_POLICY_MAP[type];
      const req = reqs.find((r) => r.consentType === type);
      const requirementAt = req?.reconsentRequiredAt
        ? req.reconsentRequiredAt.toISOString()
        : null;

      const [countRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(
          and(
            ne(users.status, "deleted"),
            requirementAt
              ? sql`NOT EXISTS (
                  SELECT 1 FROM (
                    SELECT ${consentLogs.action} AS action, ${consentLogs.createdAt} AS created_at
                    FROM ${consentLogs}
                    WHERE ${consentLogs.userId} = ${users.id}
                      AND ${consentLogs.consentType} = ${type}
                    ORDER BY ${consentLogs.createdAt} DESC, ${consentLogs.id} DESC
                    LIMIT 1
                  ) latest
                  WHERE latest.action = 'accepted'
                    AND latest.created_at >= ${requirementAt}::timestamptz
                )`
              : sql`NOT EXISTS (
                  SELECT 1 FROM (
                    SELECT ${consentLogs.action} AS action
                    FROM ${consentLogs}
                    WHERE ${consentLogs.userId} = ${users.id}
                      AND ${consentLogs.consentType} = ${type}
                    ORDER BY ${consentLogs.createdAt} DESC, ${consentLogs.id} DESC
                    LIMIT 1
                  ) latest
                  WHERE latest.action = 'accepted'
                )`
          )
        );

      const affectedUserCount = Number(countRow?.count ?? 0);

      return {
        consent_type: type,
        title: meta.title,
        document_url: `/${meta.slug}`,
        last_updated_on: meta.lastUpdatedOn,
        requirement_at: requirementAt,
        reconsent_required_at: requirementAt,
        notice: req?.notice ?? null,
        updated_at: req?.updatedAt ? req.updatedAt.toISOString() : null,
        affected_user_count: affectedUserCount,
        affected_users_count: affectedUserCount,
      };
    })
  );

  return {
    items: requirements,
    requirements,
  };
});
