import { defineEventHandler, setResponseHeader } from "h3";
import {
  getManagerSystemStatus,
  type QueueInspector,
  type QueueProbeResult,
  type ServiceProbeResult,
  probePostgres as serviceProbePostgres,
  probeQueue as serviceProbeQueue,
  probeValkey as serviceProbeValkey,
} from "#server/services/system-status-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export type {
  QueueCountsSnapshot,
  QueueInspector,
  QueueProbeResult,
  ServiceProbeResult,
  ServiceRuntimeState,
  SystemHealthStatus,
  SystemStatusResponse,
  WaitingJobSample,
} from "#server/services/system-status-service";

export function probePostgres(
  executeQuery?: () => Promise<void>,
  degradedLatencyMs?: number
): Promise<ServiceProbeResult> {
  return serviceProbePostgres(executeQuery, degradedLatencyMs);
}

export function probeValkey(
  pingFn?: () => Promise<boolean>,
  degradedLatencyMs?: number
): Promise<ServiceProbeResult> {
  return serviceProbeValkey(pingFn, degradedLatencyMs);
}

export function probeQueue(
  getQueueFn?: () => QueueInspector,
  nowMs?: number,
  degradedLatencyMs?: number
): Promise<QueueProbeResult> {
  return serviceProbeQueue(getQueueFn, nowMs, degradedLatencyMs);
}

export default defineEventHandler(async (event) => {
  // BR-SYS-05: super_admin only
  requireSuperAdminSession(event);

  setResponseHeader(event, "Cache-Control", "no-store");
  return await getManagerSystemStatus();
});
