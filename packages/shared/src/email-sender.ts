import fs from "node:fs";
import path from "node:path";
import type { NotificationCode } from "./notifications.js";
import { type RedactableValue, redactPii } from "./redactor.js";

const SENSITIVE_EMAIL_FIELD_KEYS = new Set([
  "token",
  "otp",
  "otp_code",
  "password",
  "secret",
  "reset_url",
  "verify_url",
  "verification_url",
]);

const URL_QUERY_SECRET_RE =
  /([?&](?:token|access_token|refresh_token|secret|otp)=)[^&#\s]+/gi;

function isSensitiveEmailKey(key: string): boolean {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .trim();
  return (
    SENSITIVE_EMAIL_FIELD_KEYS.has(normalized) || normalized.endsWith("_otp")
  );
}

function redactEmailString(value: string): string {
  return value.replace(URL_QUERY_SECRET_RE, "$1[REDACTED]");
}

function sanitizeEmailValue(
  value: RedactableValue,
  seen: WeakSet<object>
): RedactableValue {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactEmailString(value);
  }
  if (typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item: RedactableValue) => sanitizeEmailValue(item, seen));
  }
  if (value instanceof Date || value instanceof RegExp) {
    return value;
  }
  return sanitizeEmailRecord(value, seen);
}

function sanitizeEmailRecord(
  obj: object,
  seen: WeakSet<object> = new WeakSet<object>()
): Record<string, RedactableValue> {
  const out: Record<string, RedactableValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveEmailKey(key)) {
      continue;
    }
    const val: RedactableValue =
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "object"
        ? value
        : String(value);
    out[key] = sanitizeEmailValue(val, seen);
  }
  return out;
}

export interface SendEmailInput {
  /** User or manager email address. Type enforces string only (BR-NOT-02: never child profile object). */
  to: string;
  code: NotificationCode;
  payload: Record<string, unknown>;
  recipientStatus?: "active" | "deleted";
}

export interface SendEmailResult {
  sent: boolean;
  providerMessageId?: string;
  suppressedReason?: string;
}

export interface EmailAdapter {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}

/**
 * Local File System Email Adapter for P0/Development testing (D-EK).
 * Writes JSON email records to a local directory.
 */
export class LocalFileEmailAdapter implements EmailAdapter {
  private readonly outputDir: string;

  constructor(outputDir = ".backups/emails") {
    this.outputDir = outputDir;
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    await Promise.resolve();
    if (
      process.env.NODE_ENV === "production" ||
      process.env.MINDKID_RUNTIME === "cloudflare"
    ) {
      throw new Error(
        "LocalFileEmailAdapter is forbidden in production/Cloudflare runtime"
      );
    }

    // BR-NOT-02 compile/type check guard
    if (typeof input.to !== "string" || !input.to.includes("@")) {
      throw new Error(
        "BR-NOT-02 violation: Email recipient must be a valid email address string (child profiles forbidden)"
      );
    }

    // Account deleted check
    if (input.recipientStatus === "deleted") {
      return {
        sent: false,
        suppressedReason: "ACCOUNT_DELETED",
      };
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true, mode: 0o700 });
    }

    const messageId = `msg_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = path.join(this.outputDir, `${messageId}.json`);
    const piiRedacted = redactPii(input.payload);
    const sanitizedPayload = sanitizeEmailRecord(piiRedacted);

    const record = {
      messageId,
      to: input.to,
      code: input.code,
      payload: sanitizedPayload,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });

    return {
      sent: true,
      providerMessageId: messageId,
    };
  }
}
