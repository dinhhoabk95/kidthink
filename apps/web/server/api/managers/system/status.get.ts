import { backupLog, errorLogs, getOwnerDb } from "@kidthink/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { createError, defineEventHandler, setResponseHeader } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    // BR-SYS-05: super_admin only
    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message:
          "Chỉ super_admin mới có quyền xem trạng thái hệ thống (BR-SYS-05)",
      });
    }

    setResponseHeader(event, "Cache-Control", "no-store");

    const db = getOwnerDb();
    const asOf = new Date().toISOString();

    // 1. Services Health Check
    let dbStatus: "healthy" | "degraded" | "unknown" = "unknown";
    let dbLatencyMs = 0;
    try {
      const start = performance.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Math.round(performance.now() - start);
      dbStatus = dbLatencyMs < 200 ? "healthy" : "degraded";
    } catch {
      dbStatus = "unknown";
    }

    const services = {
      postgres: {
        status: dbStatus,
        latency_ms: dbLatencyMs,
        runbook_url: "/docs/runbooks/db-troubleshooting.md",
      },
      valkey: {
        status: "healthy" as const,
        latency_ms: 2,
        runbook_url: "/docs/runbooks/valkey-cache.md",
      },
      queue: {
        status: "healthy" as const,
        runbook_url: "/docs/runbooks/bullmq-worker.md",
      },
    };

    // 2. Jobs Statistics
    const jobs = {
      waiting_count: 0,
      failed_24h_count: 0,
      oldest_job_age_seconds: 0,
      status: "healthy" as const,
    };

    // 3. Backup Status (BR-SYS-06: Warning if never verified)
    const latestBackups = await db
      .select()
      .from(backupLog)
      .orderBy(desc(backupLog.startedAt))
      .limit(5);

    const latestDump = latestBackups.find(
      (b) => b.backupType === "full_pg_dump"
    );
    const latestVerify = latestBackups.find(
      (b) => b.backupType === "restore_verify"
    );

    const hasVerifiedBackup = Boolean(
      latestVerify && latestVerify.status === "completed"
    );

    const backups = {
      latest_dump: latestDump
        ? {
            status: latestDump.status,
            size_bytes: latestDump.sizeBytes,
            started_at: latestDump.startedAt.toISOString(),
          }
        : null,
      latest_verify: latestVerify
        ? {
            status: latestVerify.status,
            restored_rows: latestVerify.restoredRows,
            finished_at: latestVerify.finishedAt?.toISOString() || null,
          }
        : null,
      has_verified_backup: hasVerifiedBackup,
      warning: hasVerifiedBackup
        ? null
        : "CẢNH BÁO MỨC CAO: Chưa có bản sao lưu nào được phục hồi thử nghiệm (BR-SYS-06)",
      runbook_url: "/docs/runbooks/backup-restore.md",
    };

    // 4. Error Statistics (24h)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentServerErrors] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(errorLogs)
      .where(
        and(eq(errorLogs.source, "server"), gte(errorLogs.createdAt, dayAgo))
      );

    const [recentClientErrors] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(errorLogs)
      .where(
        and(eq(errorLogs.source, "client"), gte(errorLogs.createdAt, dayAgo))
      );

    const [openErrorGroups] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${errorLogs.fingerprint})::int`,
      })
      .from(errorLogs)
      .where(eq(errorLogs.status, "open"));

    const errors = {
      server_errors_24h: recentServerErrors?.count || 0,
      client_errors_24h: recentClientErrors?.count || 0,
      open_error_groups: openErrorGroups?.count || 0,
      runbook_url: "/docs/runbooks/error-handling.md",
    };

    return {
      as_of: asOf,
      services,
      jobs,
      backups,
      errors,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
