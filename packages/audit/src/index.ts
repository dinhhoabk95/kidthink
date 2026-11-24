import { createHash } from "node:crypto";
import {
  ACTOR_TYPE_CODEC,
  type AppDb,
  auditLogs,
  type DbExecutor,
  type InsertAuditLogInput,
  type JsonRecord,
  type JsonValue,
} from "@mindkid/db";
import { AppError } from "@mindkid/errors/base";
import type { AuditAction, AuditInput } from "@mindkid/shared";
import { ACTIONS_REQUIRING_REASON } from "@mindkid/shared";

type DbTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type AuditRow = typeof auditLogs.$inferSelect;
type AuditPayloadInput = AuditInput["before_data"];

const REQUIRED_REASON_ACTION_SET: ReadonlySet<string> = new Set<string>(
  ACTIONS_REQUIRING_REASON
);

export class AuditError extends AppError {
  constructor(message: string, code: string) {
    super({
      code,
      status: 500,
      message,
      name: "AuditError",
    });
  }
}

const FORBIDDEN_PII_KEYS = new Set([
  "display_name",
  "displayname",
  "birth_year",
  "birthyear",
  "dob",
  "date_of_birth",
  "first_name",
  "last_name",
  "full_name",
  "avatar_url",
  "phone",
  "phone_number",
]);

const FORBIDDEN_SECRET_KEYS = new Set([
  "password",
  "password_hash",
  "passwordhash",
  "token",
  "token_hash",
  "tokenhash",
  "secret",
  "totp_secret",
  "totpsecret",
  "access_token",
  "refresh_token",
  "auth_token",
  "verification_token",
  "reset_token",
  "recovery_code",
  "recovery_codes",
]);

type AuditFieldValue = string | number | boolean | null | undefined | object;

function scanAuditObject(
  obj: Record<string, AuditFieldValue>,
  fieldLabel: string,
  path = ""
): void {
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (FORBIDDEN_PII_KEYS.has(lowerKey)) {
      throw new AuditError(
        `BR-AUD-05: Forbidden PII field '${key}' found in ${fieldLabel} payload`,
        "FORBIDDEN_PII_IN_AUDIT"
      );
    }

    if (FORBIDDEN_SECRET_KEYS.has(lowerKey)) {
      throw new AuditError(
        `BR-AUD-06: Forbidden secret field '${key}' found in ${fieldLabel} payload`,
        "FORBIDDEN_SECRET_IN_AUDIT"
      );
    }

    scanAuditValue(value, fieldLabel, `${path}.${key}`);
  }
}

function scanAuditValue(
  val: AuditFieldValue,
  fieldLabel: string,
  path: string
): void {
  if (!val || typeof val !== "object") {
    return;
  }
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i += 1) {
      scanAuditValue(val[i] as AuditFieldValue, fieldLabel, `${path}[${i}]`);
    }
    return;
  }
  scanAuditObject(val as Record<string, AuditFieldValue>, fieldLabel, path);
}

/**
 * BR-AUD-05 & BR-AUD-06: Payload runtime scanner
 */
export function assertCleanAuditPayload(
  payload: AuditPayloadInput,
  fieldLabel: string
): void {
  if (!payload || typeof payload !== "object") {
    return;
  }
  scanAuditObject(payload as Record<string, AuditFieldValue>, fieldLabel);
}

const MAX_PAYLOAD_BYTES = 100 * 1024;

function toJsonRecord(obj: Record<string, AuditFieldValue>): JsonRecord {
  const out: Record<string, JsonValue | undefined> = {};
  for (const [k, v] of Object.entries(obj)) {
    const converted = toJsonValue(v);
    if (converted !== undefined) {
      out[k] = converted;
    }
  }
  return out;
}

function toJsonValue(value: AuditFieldValue): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item as AuditFieldValue) ?? null);
  }
  return toJsonRecord(value as Record<string, AuditFieldValue>);
}

function processDataPayload(data?: AuditPayloadInput): JsonRecord | null {
  if (!data) {
    return null;
  }
  const jsonStr = JSON.stringify(data);
  if (Buffer.byteLength(jsonStr, "utf8") > MAX_PAYLOAD_BYTES) {
    const hash = createHash("sha256").update(jsonStr).digest("hex");
    return {
      _truncated: true,
      _sha256: hash,
      _summary: "Payload exceeded max size limit",
    };
  }
  return toJsonRecord(data as Record<string, AuditFieldValue>);
}

export interface AuditTx {
  insert: (table: typeof auditLogs) => {
    values: (vals: typeof auditLogs.$inferInsert) => {
      returning: () => Promise<Array<Partial<AuditRow> & { id: number }>>;
    };
  };
}

function isDbExecutor(tx: DbTx | AuditTx): tx is DbExecutor {
  return (
    "select" in tx &&
    typeof tx.select === "function" &&
    "update" in tx &&
    typeof tx.update === "function"
  );
}

async function persistAuditEntry(
  tx: DbTx | AuditTx,
  entry: InsertAuditLogInput
): Promise<AuditRow> {
  if (isDbExecutor(tx)) {
    const dbMod = await import("@mindkid/db");
    if (
      "AuditLogsRepository" in dbMod &&
      typeof dbMod.AuditLogsRepository === "function"
    ) {
      const repo = new dbMod.AuditLogsRepository(tx);
      return await repo.insertLog(entry);
    }
  }

  const [row] = await tx
    .insert(auditLogs)
    .values({
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeData: entry.beforeData ?? null,
      afterData: entry.afterData ?? null,
      reason: entry.reason ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to insert audit log");
  }

  return row as AuditRow;
}

/**
 * BR-AUD-02, D-EU, D-EV, D-EW: Primary entry point to write audit logs.
 * Requiring transaction `tx` as first parameter.
 */
export async function writeAudit<A extends AuditAction>(
  tx: DbTx | AuditTx,
  input: AuditInput<A>
): Promise<AuditRow> {
  if (REQUIRED_REASON_ACTION_SET.has(input.action) && !input.reason?.trim()) {
    throw new AuditError(
      `Action '${input.action}' requires a non-empty reason (BR-AUD-03)`,
      "AUDIT_REASON_REQUIRED"
    );
  }

  assertCleanAuditPayload(input.before_data, "before_data");
  assertCleanAuditPayload(input.after_data, "after_data");

  const actorId =
    input.actor_type === "system" ? null : (input.actor_id ?? null);
  if (input.actor_type !== "system" && actorId === null) {
    throw new AuditError(
      `Non-system actor '${input.actor_type}' requires actor_id`,
      "AUDIT_ACTOR_ID_REQUIRED"
    );
  }

  return await persistAuditEntry(tx, {
    actorType: ACTOR_TYPE_CODEC.toCode(input.actor_type),
    actorId,
    action: input.action,
    entityType: input.entity_type,
    entityId: input.entity_id.toString(),
    beforeData: processDataPayload(input.before_data),
    afterData: processDataPayload(input.after_data),
    reason: input.reason ?? null,
    ipAddress: input.ip_address ?? null,
    userAgent: input.user_agent ?? null,
  });
}

/**
 * BR-AUD-07: Batch helper — writes one audit row per entity item in tx.
 */
export async function writeAuditBatch<A extends AuditAction>(
  tx: DbTx | AuditTx,
  items: AuditInput<A>[]
): Promise<AuditRow[]> {
  const results: AuditRow[] = [];
  for (const item of items) {
    const row = await writeAudit(tx, item);
    results.push(row);
  }
  return results;
}
