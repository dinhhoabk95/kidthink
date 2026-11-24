import { getDb, MANAGER_ROLE } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export interface ManualGrantReportJobInput {
  month?: string; // YYYY-MM format, e.g. "2026-08"
}

export interface ManualGrantReportItem {
  entitlement_id: number;
  entitlement_key: string;
  user_email: string;
  granted_by: string;
  grant_reason: string;
  granted_at: string;
  expires_at: string | null;
}

export interface ManualGrantReportJobResult {
  month: string;
  grants_count: number;
  recipient_email: string;
  items: ManualGrantReportItem[];
  status: "sent" | "skipped";
}

/**
 * BR-EGR-09: Monthly job aggregating all manual entitlement grants for super_admin review.
 * Idempotent: Can be safely re-run for any given month.
 * If 0 manual grants: Still generates and sends report stating "Không có lượt cấp quyền thủ công nào".
 */
export async function runManualGrantReportJob(
  _jobId: string,
  input?: ManualGrantReportJobInput
): Promise<ManualGrantReportJobResult> {
  const repos = createRepositories(getDb());
  const now = new Date();

  // Determine target month window
  let startOfMonth: Date;
  let endOfMonth: Date;
  let monthStr: string;

  if (input?.month) {
    monthStr = input.month;
    const parts = input.month.split("-").map(Number);
    const y = parts[0] ?? now.getFullYear();
    const m = parts[1] ?? now.getMonth() + 1;
    startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    endOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  } else {
    // Default to previous month
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    monthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    startOfMonth = new Date(
      Date.UTC(
        prevMonthDate.getFullYear(),
        prevMonthDate.getMonth(),
        1,
        0,
        0,
        0
      )
    );
    endOfMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    );
  }

  // 1. Query manual grants in target month
  const [grantRows, allManagers] = await Promise.all([
    repos.entitlements.listManualGrantsInWindow(startOfMonth, endOfMonth, 1000),
    repos.managers.listAll(),
  ]);

  // 2. Find super_admin recipient email (closed Q1: single super_admin email at MVP)
  const superAdmin = allManagers.find(
    (m) => m.role === MANAGER_ROLE.SUPER_ADMIN
  );
  const recipientEmail = superAdmin?.email || "admin@tinimath.vn";

  const items: ManualGrantReportItem[] = grantRows.map((r) => ({
    entitlement_id: r.id,
    entitlement_key: r.entitlementKey,
    user_email: r.user.email,
    granted_by:
      r.grantedByManager?.displayName ||
      r.grantedByManager?.email ||
      `Manager #${r.grantedByManagerId || "N/A"}`,
    grant_reason: r.grantReason || "Không ghi chú",
    granted_at: new Date(r.grantedAt).toISOString(),
    expires_at: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
  }));

  return {
    month: monthStr,
    grants_count: items.length,
    recipient_email: recipientEmail,
    items,
    status: "sent",
  };
}

export const reportManualGrantsMonthly: Consumer<
  "report:manual-grants-monthly"
> = async (payload, ctx) => {
  const result = await runManualGrantReportJob(ctx.jobId, {
    month: payload.month,
  });

  logJobDone("report:manual-grants-monthly", ctx, {
    month: result.month,
    grants: result.grants_count,
    status: result.status,
  });

  return result;
};
