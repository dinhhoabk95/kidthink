import type { NotificationCode } from "@kidthink/shared";
import mjml2html from "mjml";

const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

export interface TemplateDefinition<T = Record<string, unknown>> {
  subject: (vars: T) => string;
  mjml: (vars: T) => string;
  plainText: (vars: T) => string;
  requiredVars: string[];
}

function escapeHtml(str: unknown): string {
  if (typeof str !== "string") {
    return String(str ?? "");
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeTemplateVars<T extends Record<string, unknown>>(
  vars: T
): T {
  const escaped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "string") {
      escaped[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      escaped[key] = value.map((item) =>
        typeof item === "string" ? escapeHtml(item) : item
      );
    } else if (value !== null && typeof value === "object") {
      escaped[key] = escapeTemplateVars(value as Record<string, unknown>);
    } else {
      escaped[key] = value;
    }
  }
  return escaped as T;
}

export const TEMPLATE_REGISTRY: Record<
  NotificationCode,
  TemplateDefinition<Record<string, unknown>>
> = {
  email_verification: {
    requiredVars: ["url", "code"],
    subject: (_vars) => "[TiniMath] Xác nhận địa chỉ email của bạn",
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="16px" color="#334155">Xin chào,</mj-text>
              <mj-text font-size="14px" color="#475569">Mã xác thực email của bạn là: <strong>${vars.code}</strong></mj-text>
              <mj-button background-color="#4f46e5" href="${vars.url}">Xác thực email</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Xác thực email\nMã xác thực của bạn: ${vars.code}\nHoặc truy cập: ${vars.url}`,
  },
  password_reset: {
    requiredVars: ["url"],
    subject: (_vars) => "[TiniMath] Yêu cầu đặt lại mật khẩu",
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Bấm vào nút bên dưới để đặt lại mật khẩu tài khoản của bạn:</mj-text>
              <mj-button background-color="#4f46e5" href="${vars.url}">Đặt lại mật khẩu</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Đặt lại mật khẩu\nTruy cập đường dẫn sau để đặt lại mật khẩu: ${vars.url}`,
  },
  order_submitted: {
    requiredVars: ["orderCode", "packageName", "amountFormatted"],
    subject: (vars) => `[TiniMath] Xác nhận đơn hàng #${vars.orderCode}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} cho gói ${vars.packageName} (${vars.amountFormatted}) đã được tiếp nhận.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Đơn hàng #${vars.orderCode} đã được nhận.\nGói: ${vars.packageName}\nSố tiền: ${vars.amountFormatted}`,
  },
  order_approved: {
    requiredVars: ["orderCode", "packageName"],
    subject: (vars) => `[TiniMath] Đơn hàng #${vars.orderCode} đã được duyệt!`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Gói học ${vars.packageName} cho đơn hàng #${vars.orderCode} đã được kích hoạt thành công.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Đơn hàng #${vars.orderCode} đã duyệt.\nGói học ${vars.packageName} đã được kích hoạt.`,
  },
  order_rejected: {
    requiredVars: ["orderCode", "reason"],
    subject: (vars) => `[TiniMath] Thông báo đơn hàng #${vars.orderCode}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} chưa được duyệt. Lý do: ${vars.reason}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Đơn hàng #${vars.orderCode} chưa được duyệt.\nLý do: ${vars.reason}`,
  },
  subscription_expiring: {
    requiredVars: ["packageName", "daysLeft"],
    subject: (vars) => `[TiniMath] Gói ${vars.packageName} sắp hết hạn`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Gói ${vars.packageName} của bạn còn ${vars.daysLeft} ngày sử dụng.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Gói ${vars.packageName} còn ${vars.daysLeft} ngày nữa sẽ hết hạn.`,
  },
  subscription_expired: {
    requiredVars: ["packageName"],
    subject: (vars) => `[TiniMath] Gói ${vars.packageName} đã hết hạn`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Gói ${vars.packageName} của bạn đã hết hạn. Hãy gia hạn để tiếp tục theo dõi tiến độ bé.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) => `TiniMath - Gói ${vars.packageName} đã hết hạn.`,
  },
  weekly_progress: {
    requiredVars: ["childName", "lessonsCompleted", "starsEarned"],
    subject: (vars) => `[TiniMath] Báo cáo học tập tuần của ${vars.childName}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="14px" color="#475569">Bé ${vars.childName} đã hoàn thành ${vars.lessonsCompleted} bài học và nhận ${vars.starsEarned} ngôi sao trong tuần qua.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Báo cáo tuần của ${vars.childName}:\nBài học: ${vars.lessonsCompleted}\nNgôi sao: ${vars.starsEarned}`,
  },
  content_new: {
    requiredVars: ["title", "description"],
    subject: (vars) => `[TiniMath] Nội dung mới: ${vars.title}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">${vars.title}</mj-text>
              <mj-text font-size="14px" color="#475569">${vars.description}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath - Nội dung mới: ${vars.title}\n${vars.description}`,
  },
  admin_order_pending: {
    requiredVars: ["orderCode", "countPending"],
    subject: (vars) =>
      `[Admin Alert] Có ${vars.countPending} đơn hàng chờ duyệt`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#4f46e5">TiniMath Admin</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} vừa được tạo. Tổng đơn chờ duyệt: ${vars.countPending}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath Admin - Đơn hàng #${vars.orderCode} mới tạo. Tổng chờ duyệt: ${vars.countPending}`,
  },
  admin_alert: {
    requiredVars: ["alertTitle", "message"],
    subject: (vars) => `[System Alert] ${vars.alertTitle}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#dc2626">Cảnh báo hệ thống</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">${vars.alertTitle}</mj-text>
              <mj-text font-size="14px" color="#475569">${vars.message}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `TiniMath System Alert: ${vars.alertTitle}\n${vars.message}`,
  },
};

export interface RenderEmailResult {
  subject: string;
  html: string;
  text: string;
}

export async function renderEmailTemplate(
  code: NotificationCode,
  payload: Record<string, unknown>
): Promise<RenderEmailResult> {
  const template = TEMPLATE_REGISTRY[code];
  if (!template) {
    throw new Error(`Unknown email notification template code '${code}'`);
  }

  for (const field of template.requiredVars) {
    if (payload[field] === undefined || payload[field] === null) {
      throw new Error(
        `Missing required variable '${field}' for notification template '${code}'`
      );
    }
  }

  const escapedPayload = escapeTemplateVars(payload);
  const subject = template.subject(escapedPayload);
  const mjmlContent = template.mjml(escapedPayload);
  const plainText = template.plainText(escapedPayload);

  type MjmlCompiler = (
    mjml: string,
    options?: { validationLevel?: string }
  ) => Promise<{ html: string; errors?: Array<{ formattedMessage: string }> }>;

  const fn: unknown = mjml2html;
  const compileMjml: MjmlCompiler =
    typeof fn === "function"
      ? (fn as MjmlCompiler)
      : (fn as { default: MjmlCompiler }).default;

  const renderResult = await compileMjml(mjmlContent, {
    validationLevel: "strict",
  });

  if (renderResult.errors && renderResult.errors.length > 0) {
    throw new Error(
      `MJML strict validation error for template '${code}': ${renderResult.errors[0].formattedMessage}`
    );
  }

  const html = renderResult.html;

  // Security gate checks
  if (SCRIPT_TAG_REGEX.test(html)) {
    throw new Error(
      "Security gate error: Remote <script> tag detected in rendered email HTML"
    );
  }
  if (EXTERNAL_IMG_REGEX.test(html)) {
    throw new Error(
      "Security gate error: External tracking image detected in rendered email HTML"
    );
  }

  return {
    subject,
    html,
    text: plainText,
  };
}
