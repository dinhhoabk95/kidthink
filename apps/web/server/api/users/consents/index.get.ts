import { AppError } from "@kidthink/auth";
import { consentLogs, getOwnerDb } from "@kidthink/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@kidthink/shared";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler, setResponseStatus } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

export default defineEventHandler(async (event) => {
  try {
    const userSession = await requireWebUserSession(event);
    const userId = Number(userSession.user_id);

    const db = getOwnerDb();
    const logs = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, userId))
      .orderBy(desc(consentLogs.createdAt));

    const consents = CONSENT_TYPES.map((type) => {
      const meta = CONSENT_POLICY_MAP[type];

      // Find latest entry for this type (including child_data_withdrawn for child_data)
      const relevantLogs = logs.filter((l) =>
        type === "child_data"
          ? l.consentType === "child_data" ||
            l.consentType === "child_data_withdrawn"
          : l.consentType === type
      );

      const latestLog = relevantLogs[0];

      let status: "active" | "stale" | "withdrawn" | "unconsented" =
        "unconsented";
      let agreedVersion: string | null = null;
      let agreedAt: string | null = null;

      if (latestLog) {
        agreedVersion = latestLog.policyVersion;
        agreedAt = latestLog.createdAt.toISOString();

        if (latestLog.consentType === "child_data_withdrawn") {
          status = "withdrawn";
        } else if (latestLog.policyVersion === meta.currentVersion) {
          status = "active";
        } else {
          status = "stale";
        }
      }

      return {
        consent_type: type,
        title_vi: meta.titleVi,
        slug: meta.slug,
        current_version: meta.currentVersion,
        agreed_version: agreedVersion,
        agreed_at: agreedAt,
        status,
        summary_vi: meta.summaryVi,
        url: `/${meta.slug}`,
        requires_consent: meta.requiresConsent ?? true,
      };
    });

    return {
      consents,
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw err;
    }
    return respondToUserAuthError(event, err);
  }
});
