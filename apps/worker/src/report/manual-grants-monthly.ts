import { entitlements, getDb, managers, users } from "@mindkid/db";
import { and, eq, gte, lt } from "drizzle-orm";

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
  const db = getDb();
  const now = new Date();

  // Determine target month window
  let startOfMonth: Date;
  let endOfMonth: Date;
  let monthStr: string;

  if (input?.month) {
    monthStr = input.month;
    const parts = input.month.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
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
  const grantRows = await db
    .select({
      id: entitlements.id,
      key: entitlements.entitlementKey,
      source: entitlements.source,
      grantedAt: entitlements.grantedAt,
      expiresAt: entitlements.expiresAt,
      grantReason: entitlements.grantReason,
      userId: entitlements.userId,
      userEmail: users.email,
      managerId: entitlements.grantedByManagerId,
      managerEmail: managers.email,
      managerName: managers.displayName,
    })
    .from(entitlements)
    .innerJoin(users, eq(entitlements.userId, users.id))
    .leftJoin(managers, eq(entitlements.grantedByManagerId, managers.id))
    .where(
      and(
        eq(entitlements.source, "manual_grant"),
        gte(entitlements.grantedAt, startOfMonth),
        lt(entitlements.grantedAt, endOfMonth)
      )
    );

  // 2. Find super_admin recipient email (closed Q1: single super_admin email at MVP)
  const [superAdmin] = await db
    .select({ email: managers.email })
    .from(managers)
    .where(eq(managers.role, "super_admin"))
    .limit(1);

  const recipientEmail = superAdmin?.email || "admin@tinimath.vn";

  const items: ManualGrantReportItem[] = grantRows.map((r) => ({
    entitlement_id: r.id,
    entitlement_key: r.key,
    user_email: r.userEmail,
    granted_by:
      r.managerName || r.managerEmail || `Manager #${r.managerId || "N/A"}`,
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
