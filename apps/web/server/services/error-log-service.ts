import { writeAudit } from "@mindkid/audit";
import type { JsonPrimitive, JsonRecord, JsonValue } from "@mindkid/db";
import { useOwnerRepositories } from "#server/utils/repositories";

export type ErrorGroupStatus = "open" | "ack" | "resolved";
export type ErrorLevel = "warn" | "error" | "fatal";
export type ErrorSource = "server" | "client";

export interface ListErrorLogsFilter {
  readonly status?: ErrorGroupStatus;
  readonly source?: ErrorSource;
  readonly level?: ErrorLevel;
  readonly from?: Date;
  readonly to?: Date;
  readonly q?: string;
  readonly limit?: number;
}

interface StoredErrorGroup {
  readonly fingerprint: string;
  readonly code: string;
  readonly level: ErrorLevel;
  readonly source: ErrorSource;
  status: ErrorGroupStatus;
  latestMessage: string;
  totalOccurrences: number;
  affectedUsersCount: number;
  readonly firstSeenAt: Date;
  lastSeenAt: Date;
  resolvedNotes: string | null;
  resolvedByManagerId: number | null;
  resolvedAt: Date | null;
}

const MAX_IN_MEMORY_ERROR_GROUPS = 500;
const inMemoryErrorGroups = new Map<string, StoredErrorGroup>();

const ALLOWED_CONTEXT_KEYS = [
  "route",
  "app_version",
  "device_type",
  "browser",
  "os",
  "dpr",
  "viewport",
] as const;

export type ClientErrorContextValue =
  | JsonPrimitive
  | readonly JsonPrimitive[]
  | Readonly<Record<string, JsonPrimitive>>;

export interface ErrorGroupItem {
  readonly fingerprint: string;
  readonly code: string;
  readonly level: string;
  readonly source: string;
  readonly status: string;
  readonly latest_message: string;
  readonly total_occurrences: number;
  readonly affected_users_count: number;
  readonly first_seen_at: string;
  readonly last_seen_at: string;
  readonly resolved_notes: string | null;
}

export interface ErrorGroupsResult {
  readonly groups: ErrorGroupItem[];
  readonly total: number;
}

export type RawErrorGroupPatchStatus =
  | "open"
  | "ack"
  | "resolved"
  | "new"
  | "in_progress"
  | "ignored";

export interface ResolveErrorGroupParams {
  readonly status?: RawErrorGroupPatchStatus;
  readonly notes?: string | null;
  readonly managerId: number;
}

export interface ResolveErrorGroupResult {
  readonly success: true;
  readonly fingerprint: string;
  readonly status: ErrorGroupStatus;
  readonly notes: string | null;
}

export interface ClientErrorInput {
  readonly code?: string;
  readonly message?: string;
  readonly fingerprint?: string;
  readonly context?: Readonly<Record<string, ClientErrorContextValue>>;
}

export interface ClientErrorIngestResult {
  readonly status: "accepted" | "sampled_out";
  readonly fingerprint?: string;
}

function isErrorStatus(val: string | undefined): val is ErrorGroupStatus {
  return val === "open" || val === "ack" || val === "resolved";
}

function isErrorSource(val: string | undefined): val is ErrorSource {
  return val === "server" || val === "client";
}

function isErrorLevel(val: string | undefined): val is ErrorLevel {
  return val === "warn" || val === "error" || val === "fatal";
}

function parseOptionalValidDate(raw: string | undefined): Date | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function shouldSampleError(code: string): boolean {
  let rate = 0.5;
  if (code.startsWith("ASSET_")) {
    rate = 0.1;
  } else if (code.startsWith("ENGINE_") || code.startsWith("GAME_")) {
    rate = 1.0;
  } else if (code.startsWith("NETWORK_") || code.startsWith("FETCH_")) {
    rate = 0.05;
  }
  return Math.random() < rate;
}

export function normalizeErrorGroupStatus(
  raw: RawErrorGroupPatchStatus | undefined
): ErrorGroupStatus {
  if (raw === "new" || raw === "open") {
    return "open";
  }
  if (raw === "in_progress" || raw === "ack") {
    return "ack";
  }
  return "resolved";
}

export function sanitizeClientErrorContext(
  ctx: Readonly<Record<string, ClientErrorContextValue>> | undefined
): JsonRecord {
  if (!ctx || typeof ctx !== "object") {
    return {};
  }
  const cleaned: Record<string, JsonValue> = {};
  for (const key of ALLOWED_CONTEXT_KEYS) {
    if (key in ctx && ctx[key] !== undefined) {
      cleaned[key] = ctx[key];
    }
  }
  return cleaned;
}

function matchesErrorGroupFilter(
  group: StoredErrorGroup,
  filter: ListErrorLogsFilter
): boolean {
  if (filter.status && group.status !== filter.status) {
    return false;
  }
  if (filter.source && group.source !== filter.source) {
    return false;
  }
  if (filter.level && group.level !== filter.level) {
    return false;
  }
  if (filter.from && group.lastSeenAt.getTime() < filter.from.getTime()) {
    return false;
  }
  if (filter.to && group.lastSeenAt.getTime() > filter.to.getTime()) {
    return false;
  }
  if (filter.q) {
    const qMatch =
      group.code.toLowerCase().includes(filter.q) ||
      group.latestMessage.toLowerCase().includes(filter.q) ||
      group.fingerprint.toLowerCase().includes(filter.q);
    if (!qMatch) {
      return false;
    }
  }
  return true;
}

export function listErrorGroups(query: {
  readonly status?: string;
  readonly source?: string;
  readonly level?: string;
  readonly from?: string;
  readonly to?: string;
  readonly q?: string;
  readonly limit?: number;
}): Promise<ErrorGroupsResult> {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const filter: ListErrorLogsFilter = {
    status: isErrorStatus(query.status) ? query.status : undefined,
    source: isErrorSource(query.source) ? query.source : undefined,
    level: isErrorLevel(query.level) ? query.level : undefined,
    from: parseOptionalValidDate(query.from),
    to: parseOptionalValidDate(query.to),
    q:
      typeof query.q === "string" && query.q.trim()
        ? query.q.trim().toLowerCase()
        : undefined,
    limit,
  };

  const matched: StoredErrorGroup[] = [];
  for (const group of inMemoryErrorGroups.values()) {
    if (matchesErrorGroupFilter(group, filter)) {
      matched.push(group);
    }
  }
  matched.sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());

  const groups: ErrorGroupItem[] = matched.slice(0, limit).map((g) => ({
    fingerprint: g.fingerprint,
    code: g.code,
    level: g.level,
    source: g.source,
    status: g.status,
    latest_message: g.latestMessage,
    total_occurrences: g.totalOccurrences,
    affected_users_count: g.affectedUsersCount,
    first_seen_at: g.firstSeenAt.toISOString(),
    last_seen_at: g.lastSeenAt.toISOString(),
    resolved_notes: g.resolvedNotes,
  }));

  return Promise.resolve({
    groups,
    total: groups.length,
  });
}

export async function resolveErrorGroup(
  fingerprint: string,
  params: ResolveErrorGroupParams
): Promise<ResolveErrorGroupResult> {
  const status = normalizeErrorGroupStatus(params.status);
  const notes = params.notes ? params.notes.trim() : null;
  const now = new Date();

  const existing = inMemoryErrorGroups.get(fingerprint);
  if (existing) {
    inMemoryErrorGroups.set(fingerprint, {
      ...existing,
      status,
      resolvedNotes: notes,
      resolvedByManagerId: params.managerId,
      resolvedAt: now,
    });
  }

  const repos = useOwnerRepositories();
  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: params.managerId,
      action: "feature_flag_changed",
      reason: notes || "Thay đổi trạng thái nhóm lỗi",
      entity_type: "error_group",
      entity_id: fingerprint,
      after_data: { status, notes },
    });
  });

  return {
    success: true,
    fingerprint,
    status,
    notes,
  };
}

export function ingestClientError(
  input: ClientErrorInput
): Promise<ClientErrorIngestResult> {
  const code = input.code ? input.code.slice(0, 80) : "CLIENT_ERROR";
  const message = input.message
    ? input.message.slice(0, 500)
    : "Unknown client error";
  const fingerprint = input.fingerprint
    ? input.fingerprint.slice(0, 120)
    : `${code}_${message.slice(0, 40)}`;

  if (!shouldSampleError(code)) {
    return Promise.resolve({ status: "sampled_out" });
  }

  sanitizeClientErrorContext(input.context);
  const now = new Date();
  const existing = inMemoryErrorGroups.get(fingerprint);
  if (existing) {
    inMemoryErrorGroups.set(fingerprint, {
      ...existing,
      status: existing.status === "resolved" ? "open" : existing.status,
      latestMessage: message,
      totalOccurrences: existing.totalOccurrences + 1,
      lastSeenAt: now,
    });
  } else {
    if (inMemoryErrorGroups.size >= MAX_IN_MEMORY_ERROR_GROUPS) {
      const oldestKey = inMemoryErrorGroups.keys().next().value;
      if (oldestKey) {
        inMemoryErrorGroups.delete(oldestKey);
      }
    }
    inMemoryErrorGroups.set(fingerprint, {
      fingerprint,
      code,
      level: "error",
      source: "client",
      status: "open",
      latestMessage: message,
      totalOccurrences: 1,
      affectedUsersCount: 0,
      firstSeenAt: now,
      lastSeenAt: now,
      resolvedNotes: null,
      resolvedByManagerId: null,
      resolvedAt: null,
    });
  }

  return Promise.resolve({ status: "accepted", fingerprint });
}

export function countErrorLogsSinceBySource(since: Date): {
  server: number;
  client: number;
} {
  let server = 0;
  let client = 0;
  const cutoff = since.getTime();
  for (const group of inMemoryErrorGroups.values()) {
    if (group.lastSeenAt.getTime() < cutoff) {
      continue;
    }
    if (group.source === "server") {
      server += group.totalOccurrences;
    } else {
      client += group.totalOccurrences;
    }
  }
  return { server, client };
}

export function countOpenErrorGroups(): number {
  let count = 0;
  for (const group of inMemoryErrorGroups.values()) {
    if (group.status === "open") {
      count += 1;
    }
  }
  return count;
}
