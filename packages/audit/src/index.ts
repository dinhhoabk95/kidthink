import { createHash } from "node:crypto";
import { auditLogs } from "@mindkid/db";
import type { AuditAction, AuditInput } from "@mindkid/shared";
import { ACTIONS_REQUIRING_REASON } from "@mindkid/shared";
import type { PgTransaction } from "drizzle-orm/pg-core";

export class AuditError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuditError";
    this.code = code;
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

/**
 * BR-AUD-05 & BR-AUD-06: Payload runtime scanner
 */
export function assertCleanAuditPayload(
  payload: Record<string, unknown> | null | undefined,
  fieldLabel: string
): void {
  if (!payload || typeof payload !== "object") {
    return;
  }

  function scan(obj: Record<string, unknown>, path = ""): void {
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // BR-AUD-05: Block child PII except child_uuid
      if (FORBIDDEN_PII_KEYS.has(lowerKey)) {
        throw new AuditError(
          `BR-AUD-05: Forbidden PII field '${key}' found in ${fieldLabel} payload`,
          "FORBIDDEN_PII_IN_AUDIT"
        );
      }

      // BR-AUD-06: Block secrets (passwords, tokens, hashes)
      if (FORBIDDEN_SECRET_KEYS.has(lowerKey)) {
        throw new AuditError(
          `BR-AUD-06: Forbidden secret field '${key}' found in ${fieldLabel} payload`,
          "FORBIDDEN_SECRET_IN_AUDIT"
        );
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        scan(value as Record<string, unknown>, `${path}.${key}`);
      }
    }
  }

  scan(payload);
}

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100KB payload threshold

function processDataPayload(
  data?: Record<string, unknown> | null
): Record<string, unknown> | null {
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
  return data;
}

/**
 * BR-AUD-02, D-EU, D-EV, D-EW: Primary entry point to write audit logs.
 * Requiring transaction `tx` as first parameter.
 */
export async function writeAudit<A extends AuditAction>(
  // biome-ignore lint/suspicious/noExplicitAny: PgTransaction requires generic arguments
  tx: PgTransaction<any, any, any>,
  input: AuditInput<A>
): Promise<typeof auditLogs.$inferSelect> {
  // Runtime reason check for actions requiring reason
  if (
    // biome-ignore lint/suspicious/noExplicitAny: action cast for array lookup
    ACTIONS_REQUIRING_REASON.includes(input.action as any) &&
    !input.reason?.trim()
  ) {
    throw new AuditError(
      `Action '${input.action}' requires a non-empty reason (BR-AUD-03)`,
      "AUDIT_REASON_REQUIRED"
    );
  }

  // Runtime payload scanners (BR-AUD-05 & BR-AUD-06)
  assertCleanAuditPayload(input.before_data, "before_data");
  assertCleanAuditPayload(input.after_data, "after_data");

  // System actor check: system -> actor_id must be null
  const actorId =
    input.actor_type === "system" ? null : (input.actor_id ?? null);
  if (input.actor_type !== "system" && actorId === null) {
    throw new AuditError(
      `Non-system actor '${input.actor_type}' requires actor_id`,
      "AUDIT_ACTOR_ID_REQUIRED"
    );
  }

  const processedBefore = processDataPayload(input.before_data);
  const processedAfter = processDataPayload(input.after_data);

  const [row] = await tx
    .insert(auditLogs)
    .values({
      actorType: input.actor_type,
      actorId,
      action: input.action,
      entityType: input.entity_type,
      entityId: input.entity_id.toString(),
      beforeData: processedBefore,
      afterData: processedAfter,
      reason: input.reason ?? null,
      ipAddress: input.ip_address ?? null,
      userAgent: input.user_agent ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to insert audit log");
  }

  return row;
}

/**
 * BR-AUD-07: Batch helper — writes one audit row per entity item in tx.
 */
export async function writeAuditBatch<A extends AuditAction>(
  // biome-ignore lint/suspicious/noExplicitAny: PgTransaction requires generic arguments
  tx: PgTransaction<any, any, any>,
  items: AuditInput<A>[]
): Promise<(typeof auditLogs.$inferSelect)[]> {
  const results: (typeof auditLogs.$inferSelect)[] = [];
  for (const item of items) {
    const row = await writeAudit(tx, item);
    results.push(row);
  }
  return results;
}
