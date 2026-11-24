import fs from "node:fs";
import path from "node:path";
import { getCachePort } from "@mindkid/cache";
import { BACKUP_DIR } from "@mindkid/config/backup";
import { getQueuePort, type JobQueueCoordinatorPort } from "@mindkid/queue";
import {
  countErrorLogsSinceBySource,
  countOpenErrorGroups,
} from "#server/services/error-log-service";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface LocalBackupStatusLogEntry {
  readonly id: number;
  readonly backupType: string;
  readonly status: string;
  readonly sizeBytes: number | null;
  readonly restoredRows: number | null;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
}

interface RawBackupStatusLog {
  readonly id?: number;
  readonly backupType?: string;
  readonly status?: string;
  readonly sizeBytes?: number | null;
  readonly restoredRows?: number | null;
  readonly startedAt?: string;
  readonly finishedAt?: string | null;
}

export function readRecentLocalBackupLogs(
  limit: number,
  directory: string = BACKUP_DIR
): LocalBackupStatusLogEntry[] {
  try {
    const filePath = path.join(directory, ".backup-log.json");
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const parsed: RawBackupStatusLog[] = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
    if (!Array.isArray(parsed)) {
      return [];
    }
    const entries: LocalBackupStatusLogEntry[] = [];
    for (const item of parsed) {
      if (
        typeof item.id !== "number" ||
        typeof item.backupType !== "string" ||
        typeof item.status !== "string" ||
        typeof item.startedAt !== "string"
      ) {
        continue;
      }
      const startedAt = new Date(item.startedAt);
      if (Number.isNaN(startedAt.getTime())) {
        continue;
      }
      const finishedAt =
        typeof item.finishedAt === "string" ? new Date(item.finishedAt) : null;
      entries.push({
        id: item.id,
        backupType: item.backupType,
        status: item.status,
        sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : null,
        restoredRows:
          typeof item.restoredRows === "number" ? item.restoredRows : null,
        startedAt,
        finishedAt:
          finishedAt && !Number.isNaN(finishedAt.getTime()) ? finishedAt : null,
      });
    }
    entries.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return entries.slice(0, Math.max(0, limit));
  } catch {
    return [];
  }
}

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
    await useOwnerRepositories().system.ping();
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

/**
 * Probe kho cache/auth keyspace. Tên `probeValkey` và khoá `services.valkey` là hợp đồng
 * response của `/api/managers/system/status` (admin SPA đọc) nên giữ nguyên dù Valkey đã
 * gỡ (D15): "sống" nghĩa là port cache đã nối vào engine (DO hoặc engine local).
 */
export async function probeValkey(
  pingFn: () => Promise<boolean> = () =>
    Promise.resolve(getCachePort() !== undefined),
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

interface QueueCountsReading {
  readonly counts: QueueCountsSnapshot;
  readonly oldestJobAgeSeconds: number;
}

/** BR-SYS-07: engine queue (DO hoặc local) chỉ có waiting/failed. */
async function readQueueCounts(
  getPort: () => JobQueueCoordinatorPort | undefined
): Promise<QueueCountsReading> {
  const port = getPort();
  if (!port) {
    throw new Error("Queue port is not registered");
  }
  const stats = await withProbeTimeout(port.getStats());
  return {
    counts: {
      waiting: stats.waiting,
      active: 0,
      completed: 0,
      failed: stats.failed,
      delayed: 0,
    },
    oldestJobAgeSeconds: 0,
  };
}

export async function probeQueue(
  getPort: () => JobQueueCoordinatorPort | undefined = () => getQueuePort(),
  degradedLatencyMs: number = QUEUE_DEGRADED_LATENCY_MS
): Promise<QueueProbeResult> {
  const runbookUrl = "/docs/runbooks/bullmq-worker.md";
  const start = performance.now();
  try {
    const { counts, oldestJobAgeSeconds } = await readQueueCounts(getPort);
    const latencyMs = Math.max(0, Math.round(performance.now() - start));

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
        error: "Queue inspection failed",
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
  verifyEntry: LocalBackupStatusLogEntry | undefined
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

export async function getManagerSystemStatus(): Promise<SystemStatusResponse> {
  const repos = useOwnerRepositories();
  const asOf = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [postgresProbe, valkeyProbe, queueProbe] = await Promise.all([
    probePostgres(async () => {
      await repos.system.ping();
    }),
    probeValkey(),
    probeQueue(),
  ]);
  const latestBackups = readRecentLocalBackupLogs(5);
  const errorCounts = countErrorLogsSinceBySource(dayAgo);
  const openGrpCount = countOpenErrorGroups();

  const services = {
    postgres: postgresProbe,
    valkey: valkeyProbe,
    queue: queueProbe.service,
  };

  const latestDump = latestBackups.find((b) => b.backupType === "dump");
  const latestVerify = latestBackups.find((b) => b.backupType === "verify");
  const hasVerifiedBackup = isRecentVerifiedBackup(latestVerify);

  const backups: SystemStatusResponse["backups"] = {
    status: hasVerifiedBackup ? "ok" : "bad",
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

  const srvErrCount = errorCounts.server;
  const cliErrCount = errorCounts.client;
  const errorStatus: SystemHealthStatus =
    srvErrCount > 10 || openGrpCount > 5 ? "bad" : "ok";

  return {
    as_of: asOf,
    services,
    jobs: queueProbe.jobs,
    backups,
    errors: {
      status: errorStatus,
      server_errors_24h: srvErrCount,
      client_errors_24h: cliErrCount,
      open_error_groups: openGrpCount,
      runbook_url: "/docs/runbooks/error-handling.md",
    },
  };
}
