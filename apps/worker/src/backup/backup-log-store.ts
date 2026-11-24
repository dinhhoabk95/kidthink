import fs from "node:fs";
import path from "node:path";

export type LocalBackupType = "dump" | "verify" | "drill";
export type LocalBackupStatus = "started" | "success" | "failed";

export interface LocalBackupLogEntry {
  readonly id: number;
  readonly backupType: LocalBackupType;
  readonly status: LocalBackupStatus;
  readonly sizeBytes: number | null;
  readonly restoredRows: number | null;
  readonly storagePath: string | null;
  readonly checksum: string | null;
  readonly errorMessage: string | null;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
}

export interface CreateLocalBackupLogInput {
  readonly backupType: LocalBackupType;
  readonly status: LocalBackupStatus;
  readonly startedAt: Date;
}

export interface UpdateLocalBackupLogPatch {
  readonly status?: LocalBackupStatus;
  readonly sizeBytes?: number | null;
  readonly restoredRows?: number | null;
  readonly storagePath?: string | null;
  readonly checksum?: string | null;
  readonly errorMessage?: string | null;
  readonly finishedAt?: Date | null;
}

interface SerializedBackupLogEntry {
  readonly id: number;
  readonly backupType: LocalBackupType;
  readonly status: LocalBackupStatus;
  readonly sizeBytes: number | null;
  readonly restoredRows: number | null;
  readonly storagePath: string | null;
  readonly checksum: string | null;
  readonly errorMessage: string | null;
  readonly startedAt: string;
  readonly finishedAt: string | null;
}

const LOG_FILENAME = ".backup-log.json";

function getLogFilePath(directory: string): string {
  return path.join(directory, LOG_FILENAME);
}

function isLocalBackupType(value: string): value is LocalBackupType {
  return value === "dump" || value === "verify" || value === "drill";
}

function isLocalBackupStatus(value: string): value is LocalBackupStatus {
  return value === "started" || value === "success" || value === "failed";
}

function serializeEntry(entry: LocalBackupLogEntry): SerializedBackupLogEntry {
  return {
    id: entry.id,
    backupType: entry.backupType,
    status: entry.status,
    sizeBytes: entry.sizeBytes,
    restoredRows: entry.restoredRows,
    storagePath: entry.storagePath,
    checksum: entry.checksum,
    errorMessage: entry.errorMessage,
    startedAt: entry.startedAt.toISOString(),
    finishedAt: entry.finishedAt ? entry.finishedAt.toISOString() : null,
  };
}

function parseEntry(raw: SerializedBackupLogEntry): LocalBackupLogEntry | null {
  if (
    typeof raw.id !== "number" ||
    !isLocalBackupType(raw.backupType) ||
    !isLocalBackupStatus(raw.status) ||
    typeof raw.startedAt !== "string"
  ) {
    return null;
  }
  const startedAt = new Date(raw.startedAt);
  if (Number.isNaN(startedAt.getTime())) {
    return null;
  }
  const finishedAt =
    typeof raw.finishedAt === "string" ? new Date(raw.finishedAt) : null;
  return {
    id: raw.id,
    backupType: raw.backupType,
    status: raw.status,
    sizeBytes: typeof raw.sizeBytes === "number" ? raw.sizeBytes : null,
    restoredRows:
      typeof raw.restoredRows === "number" ? raw.restoredRows : null,
    storagePath: typeof raw.storagePath === "string" ? raw.storagePath : null,
    checksum: typeof raw.checksum === "string" ? raw.checksum : null,
    errorMessage:
      typeof raw.errorMessage === "string" ? raw.errorMessage : null,
    startedAt,
    finishedAt:
      finishedAt && !Number.isNaN(finishedAt.getTime()) ? finishedAt : null,
  };
}

function readAllEntries(directory: string): LocalBackupLogEntry[] {
  const filePath = getLogFilePath(directory);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const text = fs.readFileSync(filePath, "utf8");
  const parsed: SerializedBackupLogEntry[] = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    return [];
  }
  const entries: LocalBackupLogEntry[] = [];
  for (const item of parsed) {
    const entry = parseEntry(item);
    if (entry) {
      entries.push(entry);
    }
  }
  return entries;
}

function writeAllEntries(
  directory: string,
  entries: readonly LocalBackupLogEntry[]
): void {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filePath = getLogFilePath(directory);
  const serialized = entries.map(serializeEntry);
  fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2), "utf8");
}

export function createLocalBackupLog(
  directory: string,
  input: CreateLocalBackupLogInput
): LocalBackupLogEntry {
  const entries = readAllEntries(directory);
  const nextId =
    entries.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  const entry: LocalBackupLogEntry = {
    id: nextId,
    backupType: input.backupType,
    status: input.status,
    sizeBytes: null,
    restoredRows: null,
    storagePath: null,
    checksum: null,
    errorMessage: null,
    startedAt: input.startedAt,
    finishedAt: null,
  };
  writeAllEntries(directory, [...entries, entry]);
  return entry;
}

export function updateLocalBackupLog(
  directory: string,
  id: number,
  patch: UpdateLocalBackupLogPatch
): LocalBackupLogEntry | null {
  const entries = readAllEntries(directory);
  let updated: LocalBackupLogEntry | null = null;
  const nextEntries = entries.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }
    updated = {
      ...entry,
      status: patch.status ?? entry.status,
      sizeBytes:
        patch.sizeBytes === undefined ? entry.sizeBytes : patch.sizeBytes,
      restoredRows:
        patch.restoredRows === undefined
          ? entry.restoredRows
          : patch.restoredRows,
      storagePath:
        patch.storagePath === undefined ? entry.storagePath : patch.storagePath,
      checksum: patch.checksum === undefined ? entry.checksum : patch.checksum,
      errorMessage:
        patch.errorMessage === undefined
          ? entry.errorMessage
          : patch.errorMessage,
      finishedAt:
        patch.finishedAt === undefined ? entry.finishedAt : patch.finishedAt,
    };
    return updated;
  });
  if (updated) {
    writeAllEntries(directory, nextEntries);
  }
  return updated;
}

export function listRecentLocalBackupLogs(
  directory: string,
  limit: number,
  filter?: {
    readonly backupType?: LocalBackupType;
    readonly status?: LocalBackupStatus;
  }
): LocalBackupLogEntry[] {
  const entries = readAllEntries(directory);
  const filtered = entries.filter((entry) => {
    if (filter?.backupType && entry.backupType !== filter.backupType) {
      return false;
    }
    if (filter?.status && entry.status !== filter.status) {
      return false;
    }
    return true;
  });
  filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  return filtered.slice(0, Math.max(0, limit));
}

export function findLatestLocalBackupLogByTypeAndStatus(
  directory: string,
  backupType: LocalBackupType,
  status: LocalBackupStatus
): LocalBackupLogEntry | null {
  const matches = listRecentLocalBackupLogs(directory, 1, {
    backupType,
    status,
  });
  return matches[0] ?? null;
}
