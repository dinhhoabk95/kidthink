import { consentLogs, consentRequirements, getOwnerDb } from "@mindkid/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@mindkid/shared";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

type ConsentLogRecord = typeof consentLogs.$inferSelect;
type ConsentReqRecord = typeof consentRequirements.$inferSelect;

function computeConsentState(
  latestLog: ConsentLogRecord | undefined,
  req: ConsentReqRecord | undefined
): { status: "active" | "required" | "withdrawn"; acceptedAt: string | null } {
  if (!latestLog) {
    return { status: "required", acceptedAt: null };
  }

  if (latestLog.action === "withdrawn") {
    return { status: "withdrawn", acceptedAt: null };
  }

  const acceptedAt = latestLog.createdAt.toISOString();
  if (!req?.reconsentRequiredAt) {
    return { status: "active", acceptedAt };
  }

  const isActive =
    latestLog.createdAt.getTime() >= req.reconsentRequiredAt.getTime();
  return {
    status: isActive ? "active" : "required",
    acceptedAt,
  };
}

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const db = getOwnerDb();
  const [logs, reqs] = await Promise.all([
    db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, userId))
      .orderBy(desc(consentLogs.createdAt), desc(consentLogs.id)),
    db.select().from(consentRequirements),
  ]);

  const consents = CONSENT_TYPES.map((type) => {
    const meta = CONSENT_POLICY_MAP[type];
    const req = reqs.find((r) => r.consentType === type);
    const latestLog = logs.find((l) => l.consentType === type);
    const { status, acceptedAt } = computeConsentState(latestLog, req);

    return {
      consent_type: type,
      title: meta.title,
      document_url: `/${meta.slug}`,
      accepted_at: acceptedAt,
      requirement_at: req?.reconsentRequiredAt
        ? req.reconsentRequiredAt.toISOString()
        : null,
      notice: req?.notice ?? null,
      status,
    };
  });

  return {
    consents,
  };
});
