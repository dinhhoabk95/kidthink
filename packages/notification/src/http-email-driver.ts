import { isCloudflareRuntime } from "@mindkid/config";
import type { NotificationCode } from "@mindkid/shared";
import {
  type EmailTemplateCode,
  escapeTemplateVars,
  renderEmailTemplate,
  TEMPLATE_REGISTRY,
  type TemplateVars,
} from "#src/mjml-renderer";

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

const PARAGRAPH_SPLIT_REGEX = /\n{2,}/;
const LINE_BREAK_REGEX = /\n/g;

export interface BrevoHttpEmailConfig {
  readonly apiKey: string;
  readonly senderEmail: string;
  readonly senderName?: string;
  readonly fetchFn?: typeof fetch;
}

async function renderLightweightEdgeHtml(
  code: EmailTemplateCode,
  rawPayload: TemplateVars
): Promise<{ subject: string; html: string; text: string }> {
  if (!isCloudflareRuntime()) {
    return await renderEmailTemplate(code, rawPayload);
  }
  const tpl = TEMPLATE_REGISTRY[code];
  if (!tpl) {
    throw new Error(`Unknown email template: ${String(code)}`);
  }
  for (const reqKey of tpl.requiredVars) {
    const val = rawPayload[reqKey];
    if (val === undefined || val === null || val === "") {
      throw new Error(`Missing required template variable: ${reqKey}`);
    }
  }
  const safeVars = escapeTemplateVars(rawPayload);
  const subject = tpl.subject(safeVars);
  const text = tpl.plainText(safeVars);
  const paragraphs = text
    .split(PARAGRAPH_SPLIT_REGEX)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;line-height:1.6;">${p.replace(LINE_BREAK_REGEX, "<br/>")}</p>`
    )
    .join("");

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head><body style="margin:0;padding:24px;background:#f8fafc;font-family:Nunito,-apple-system,Segoe UI,sans-serif;color:#1e293b;"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:3px solid #e2e8f0;border-radius:20px;padding:28px;"><h1 style="margin:0 0 16px;font-size:20px;color:#4f46e5;">MindKid</h1>${paragraphs}</div></body></html>`;
  return { subject, html, text };
}

/**
 * HTTP Email Driver miễn phí không cần thẻ tín dụng (Brevo Free API: 300 mail/ngày = 9.000/tháng)
 * dùng chung được ở cả Cloudflare Workers (`JobQueueDO`) và Node.js VPS mà không cần cổng TCP SMTP.
 */
export class BrevoHttpEmailDriver implements EmailDriver {
  private readonly config: BrevoHttpEmailConfig;

  constructor(config: BrevoHttpEmailConfig) {
    if (!(config.apiKey && config.senderEmail)) {
      throw new Error("Missing Brevo HTTP Email config (apiKey, senderEmail)");
    }
    this.config = config;
  }

  async sendEmail(req: SendEmailRequest): Promise<SendEmailResponse> {
    const rendered = await renderLightweightEdgeHtml(
      req.code,
      req.payload as TemplateVars
    );
    const fetchImpl = this.config.fetchFn ?? fetch;

    const response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": this.config.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: this.config.senderName ?? "MindKid",
          email: this.config.senderEmail,
        },
        to: [{ email: req.to }],
        subject: rendered.subject,
        htmlContent: rendered.html,
        textContent: rendered.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        sent: false,
        error: `Brevo HTTP ${response.status}: ${errorBody.slice(0, 240)}`,
      };
    }

    const parsed = (await response.json()) as { messageId?: string };
    return {
      sent: true,
      providerMessageId: parsed.messageId ?? `brevo-${Date.now()}`,
    };
  }
}
