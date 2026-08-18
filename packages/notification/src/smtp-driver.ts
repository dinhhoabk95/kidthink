import type { NotificationCode } from "@mindkid/shared";
import nodemailer, { type Transporter } from "nodemailer";
import { renderEmailTemplate } from "./mjml-renderer.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface SendEmailRequest {
  to: string;
  code: NotificationCode;
  payload: Record<string, unknown>;
  deliveryId?: number;
}

export interface SendEmailResponse {
  sent: boolean;
  providerMessageId?: string;
  suppressedReason?: string;
  error?: string;
}

export interface EmailDriver {
  sendEmail(req: SendEmailRequest): Promise<SendEmailResponse>;
}

export class NodemailerSmtpDriver implements EmailDriver {
  private transporter: Transporter | null = null;
  private readonly config: SmtpConfig;

  constructor(config: SmtpConfig) {
    if (!(config.host && config.user && config.pass)) {
      throw new Error("Missing SMTP credentials (host, user, pass required)");
    }
    this.config = config;
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure ?? this.config.port === 465,
        pool: true,
        maxConnections: 5,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(req: SendEmailRequest): Promise<SendEmailResponse> {
    if (typeof req.to !== "string" || !req.to.includes("@")) {
      throw new Error(
        "BR-NOT-02 violation: Recipient must be a valid email string"
      );
    }

    try {
      const rendered = await renderEmailTemplate(req.code, req.payload);
      const transporter = this.getTransporter();

      const messageIdHeader = req.deliveryId
        ? `<deliv_${req.deliveryId}_${Date.now()}@tinimath.vn>`
        : undefined;

      const info = await transporter.sendMail({
        from: this.config.from,
        to: req.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        messageId: messageIdHeader,
      });

      return {
        sent: true,
        providerMessageId: info.messageId || messageIdHeader,
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "SMTP dispatch failed";
      return {
        sent: false,
        error: errorMsg,
      };
    }
  }
}

export class FakeLocalEmailDriver implements EmailDriver {
  private sentMails: Array<SendEmailRequest & { messageId: string }> = [];

  sendEmail(req: SendEmailRequest): Promise<SendEmailResponse> {
    if (typeof req.to !== "string" || !req.to.includes("@")) {
      throw new Error(
        "BR-NOT-02 violation: Recipient must be a valid email string"
      );
    }

    const messageId = `msg_fake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.sentMails.push({ ...req, messageId });

    return Promise.resolve({
      sent: true,
      providerMessageId: messageId,
    });
  }

  getSentMails() {
    return [...this.sentMails];
  }

  clear() {
    this.sentMails = [];
  }
}
