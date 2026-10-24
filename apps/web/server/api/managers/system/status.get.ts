import { ping } from "@mindkid/cache";
import { backupLog, errorLogs, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { getQueue } from "@mindkid/queue";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { defineEventHandler, setResponseHeader } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export type SystemHealthStatus = "ok" | "unknown" | "bad";
export type ServiceRuntimeState = "up" | "down" | "degraded";

export interface ServiceProbeResult {
  status: SystemHealthStatus;
  state: ServiceRuntimeState;
  latency_ms: number;
  runbook_url: string;
  error?: string;
}

export interface QueueCountsSnapshot {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface WaitingJobSample {
  timestamp?: number;
}

export interface QueueInspector {
  getJobCounts(
    ...types: Array<"waiting" | "active" | "completed" | "failed" | "delayed">
  ): Promise<Record<string, number>>;
  getWaiting?(start?: number, end?: number): Promise<WaitingJobSample[]>;
}

export interface QueueProbeResult {
  service: ServiceProbeResult;
  jobs: {
    status: SystemHealthStatus;
    waiting_count: number;
    active_count: number;
    completed_count: number;
    failed_count: number;
    delayed_count: number;
    failed_24h_count: number;
    oldest_job_age_seconds: number;
    counts: QueueCountsSnapshot;
  };
}

export interface SystemStatusResponse {
  as_of: string;
  services: {
    postgres: ServiceProbeResult;
    valkey: ServiceProbeResult;
    queue: ServiceProbeResult;
  };
  jobs: QueueProbeResult["jobs"];
  backups: {
    status: SystemHealthStatus;
    latest_dump: {
      status: string;
      size_bytes: number;
      started_at: string;
    } | null;
    latest_verify: {
      status: string;
      restored_rows: number;
      finished_at: string | null;
    } | null;
    recent_logs: Array<{
      id: number;
      backup_type: string;
      status: string;
      size_bytes: number;
      restored_rows: number;
      started_at: string;
      finished_at: string | null;
    }>;
    has_verified_backup: boolean;
    warning: string | null;
    runbook_url: string;
  };
  errors: {
    status: SystemHealthStatus;
    server_errors_24h: number;
    client_errors_24h: number;
    open_error_groups: number;
    runbook_url: string;
  };
}

const PROBE_TIMEOUT_MS = 2000;
const SERVICE_DEGRADED_LATENCY_MS = 200;
const QUEUE_DEGRADED_LATENCY_MS = 500;
const WAITING_BACKLOG_THRESHOLD = 500;
const FAILED_JOBS_THRESHOLD = 10;

function withProbeTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = PROBE_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Probe timed out"));
      }, timeoutMs);
      timer.unref?.();
    }),
  ]);
}

export async function probePostgres(
  executeQuery: () => Promise<void> = async () => {
    await getOwnerDb().execute(sql`SELECT 1`);
  },
  degradedLatencyMs: number = SERVICE_DEGRADED_LATENCY_MS
): Promise<ServiceProbeResult> {
  const runbookUrl = "/docs/runbooks/db-troubleshooting.md";
  const start = performance.now();
  try {
    await withProbeTimeout(executeQuery());
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    const isDegraded = latencyMs >= degradedLatencyMs;
    return {
      status: isDegraded ? "bad" : "ok",
      state: isDegraded ? "degraded" : "up",
      latency_ms: latencyMs,
      runbook_url: runbookUrl,
    };
  } catch {
    return {
      status: "unknown",
      state: "down",
      latency_ms: -1,
      runbook_url: runbookUrl,
      error: "PostgreSQL health check failed",
    };
  }
}

export async function probeValkey(
  pingFn: () => Promise<boolean> = () => ping(),
  degradedLatencyMs: number = SERVICE_DEGRADED_LATENCY_MS
): Promise<ServiceProbeResult> {
  const runbookUrl = "/docs/runbooks/valkey-cache.md";
  const start = performance.now();
  try {
    const isAlive = await withProbeTimeout(pingFn());
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    if (!isAlive) {
      return {
        status: "bad",
        state: "down",
        latency_ms: -1,
        runbook_url: runbookUrl,
        error: "Valkey ping returned false",
      };
    }
    const isDegraded = latencyMs >= degradedLatencyMs;
    return {
      status: isDegraded ? "bad" : "ok",
      state: isDegraded ? "degraded" : "up",
      latency_ms: latencyMs,
      runbook_url: runbookUrl,
    };
  } catch {
    return {
      status: "unknown",
      state: "down",
      latency_ms: -1,
      runbook_url: runbookUrl,
      error: "Valkey health check failed",
    };
  }
}

export async function probeQueue(
  getQueueFn: () => QueueInspector = () => getQueue(),
  nowMs: number = Date.now(),
  degradedLatencyMs: number = QUEUE_DEGRADED_LATENCY_MS
): Promise<QueueProbeResult> {
  const runbookUrl = "/docs/runbooks/bullmq-worker.md";
  const start = performance.now();
  try {
    const queue = getQueueFn();
    const rawCounts = await withProbeTimeout(
      queue.getJobCounts("waiting", "active", "completed", "failed", "delayed")
    );
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    const counts: QueueCountsSnapshot = {
      waiting: rawCounts.waiting ?? 0,
      active: rawCounts.active ?? 0,
      completed: rawCounts.completed ?? 0,
      failed: rawCounts.failed ?? 0,
      delayed: rawCounts.delayed ?? 0,
    };

    let oldestJobAgeSeconds = 0;
    if (counts.waiting > 0 && typeof queue.getWaiting === "function") {
      const waitingJobs = await withProbeTimeout(queue.getWaiting(0, 0));
      const oldestTimestamp = waitingJobs[0]?.timestamp;
      if (typeof oldestTimestamp === "number" && oldestTimestamp > 0) {
        oldestJobAgeSeconds = Math.max(
          0,
          Math.round((nowMs - oldestTimestamp) / 1000)
        );
      }
    }

    const isServiceDegraded = latencyMs >= degradedLatencyMs;
    const isJobsHealthy =
      counts.waiting <= WAITING_BACKLOG_THRESHOLD &&
      counts.failed <= FAILED_JOBS_THRESHOLD;

    return {
      service: {
        status: isServiceDegraded ? "bad" : "ok",
        state: isServiceDegraded ? "degraded" : "up",
        latency_ms: latencyMs,
        runbook_url: runbookUrl,
      },
      jobs: {
        status: isJobsHealthy ? "ok" : "bad",
        waiting_count: counts.waiting,
        active_count: counts.active,
        completed_count: counts.completed,
        failed_count: counts.failed,
        delayed_count: counts.delayed,
        failed_24h_count: counts.failed,
        oldest_job_age_seconds: oldestJobAgeSeconds,
        counts,
      },
    };
  } catch {
    const emptyCounts: QueueCountsSnapshot = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
    return {
      service: {
        status: "unknown",
        state: "down",
        latency_ms: -1,
        runbook_url: runbookUrl,
        error: "BullMQ queue inspection failed",
      },
      jobs: {
        status: "unknown",
        waiting_count: 0,
        active_count: 0,
        completed_count: 0,
        failed_count: 0,
        delayed_count: 0,
        failed_24h_count: 0,
        oldest_job_age_seconds: 0,
        counts: emptyCounts,
      },
    };
  }
}

function isRecentVerifiedBackup(
  verifyEntry: typeof backupLog.$inferSelect | undefined
): boolean {
  if (verifyEntry?.status !== "success") {
    return false;
  }
  if ((verifyEntry.restoredRows ?? 0) <= 0) {
    return false;
  }
  const verifyTimestamp = verifyEntry.finishedAt ?? verifyEntry.startedAt;
  const verifyCutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return verifyTimestamp.getTime() >= verifyCutoffMs;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-SYS-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem trạng thái hệ thống (BR-SYS-05)"
    );
  }

  setResponseHeader(event, "Cache-Control", "no-store");

  const db = getOwnerDb();
  const asOf = new Date().toISOString();

  // 1 & 2. Services & Queue Health Check (BR-SYS-01, D-KT: ok | unknown | bad)
  const [postgresProbe, valkeyProbe, queueProbe] = await Promise.all([
    probePostgres(async () => {
      await db.execute(sql`SELECT 1`);
    }),
    probeValkey(),
    probeQueue(),
  ]);

  const services = {
    postgres: postgresProbe,
    valkey: valkeyProbe,
    queue: queueProbe.service,
  };

  const jobs = queueProbe.jobs;

  // 3. Backup Status (BR-SYS-06: Warning and bad status if never verified)
  const latestBackups = await db
    .select()
    .from(backupLog)
    .orderBy(desc(backupLog.startedAt))
    .limit(5);

  const latestDump = latestBackups.find((b) => b.backupType === "dump");
  const latestVerify = latestBackups.find((b) => b.backupType === "verify");

  const hasVerifiedBackup = isRecentVerifiedBackup(latestVerify);

  const backups = {
    status: (hasVerifiedBackup ? "ok" : "bad") as SystemHealthStatus,
    latest_dump: latestDump
      ? {
          status: latestDump.status,
          size_bytes: latestDump.sizeBytes ?? 0,
          started_at: latestDump.startedAt.toISOString(),
        }
      : null,
    latest_verify: latestVerify
      ? {
          status: latestVerify.status,
          restored_rows: latestVerify.restoredRows ?? 0,
          finished_at: latestVerify.finishedAt?.toISOString() || null,
        }
      : null,
    recent_logs: latestBackups.map((item) => ({
      id: item.id,
      backup_type: item.backupType,
      status: item.status,
      size_bytes: item.sizeBytes ?? 0,
      restored_rows: item.restoredRows ?? 0,
      started_at: item.startedAt.toISOString(),
      finished_at: item.finishedAt ? item.finishedAt.toISOString() : null,
    })),
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

  const srvErrCount = recentServerErrors?.count || 0;
  const cliErrCount = recentClientErrors?.count || 0;
  const openGrpCount = openErrorGroups?.count || 0;

  const errorStatus: SystemHealthStatus =
    srvErrCount > 10 || openGrpCount > 5 ? "bad" : "ok";

  const errors = {
    status: errorStatus,
    server_errors_24h: srvErrCount,
    client_errors_24h: cliErrCount,
    open_error_groups: openGrpCount,
    runbook_url: "/docs/runbooks/error-handling.md",
  };

  return {
    as_of: asOf,
    services,
    jobs,
    backups,
    errors,
  };
});
