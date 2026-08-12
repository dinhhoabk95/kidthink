import fs from "node:fs";
import path from "node:path";
import type { NotificationCode } from "./notifications.js";

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
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const messageId = `msg_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = path.join(this.outputDir, `${messageId}.json`);

    const record = {
      messageId,
      to: input.to,
      code: input.code,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf-8");

    return {
      sent: true,
      providerMessageId: messageId,
    };
  }
}
