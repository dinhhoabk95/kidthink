import type { NotificationCode } from "@mindkid/shared";
import mjml2html from "mjml";

const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

export type EmailTemplateCode =
  | NotificationCode
  | "social_identity_linked"
  | "social_identity_unlinked";

export type TemplateVarScalar = string | number | boolean | null | undefined;
export type TemplateVarValue =
  | TemplateVarScalar
  | readonly TemplateVarScalar[]
  | { readonly [key: string]: TemplateVarScalar };
export type TemplateVars = Record<string, TemplateVarValue>;

export interface TemplateDefinition<T = TemplateVars> {
  subject: (vars: T) => string;
  mjml: (vars: T) => string;
  plainText: (vars: T) => string;
  requiredVars: string[];
}

function escapeHtml(str: TemplateVarValue): string {
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

export function escapeTemplateVars<T extends TemplateVars>(vars: T): T {
  const escaped: TemplateVars = {};
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "string") {
      escaped[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      escaped[key] = value.map((item) =>
        typeof item === "string" ? escapeHtml(item) : item
      );
    } else if (value !== null && typeof value === "object") {
      escaped[key] = escapeTemplateVars(
        value as Record<string, TemplateVarScalar>
      );
    } else {
      escaped[key] = value;
    }
  }
  return escaped as T;
}

export const TEMPLATE_REGISTRY: Record<
  EmailTemplateCode,
  TemplateDefinition<TemplateVars>
> = {
  email_verification: {
    requiredVars: ["url"],
    subject: (_vars) => "[MindKid] Xác nhận địa chỉ email của bạn",
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" color="#334155">Xin chào,</mj-text>
              <mj-text font-size="14px" color="#475569">${
                vars.code
                  ? `Mã xác thực email của bạn là: <strong>${vars.code}</strong>`
                  : "Vui lòng bấm vào nút bên dưới để xác thực địa chỉ email của bạn:"
              }</mj-text>
              <mj-button background-color="#1a7f6b" href="${vars.url}">Xác thực email</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      vars.code
        ? `MindKid - Xác thực email\nMã xác thực của bạn: ${vars.code}\nHoặc truy cập: ${vars.url}`
        : `MindKid - Xác thực email\nTruy cập: ${vars.url}`,
  },
  password_reset: {
    requiredVars: ["url"],
    subject: (_vars) => "[MindKid] Yêu cầu đặt lại mật khẩu",
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Bấm vào nút bên dưới để đặt lại mật khẩu tài khoản của bạn:</mj-text>
              <mj-button background-color="#1a7f6b" href="${vars.url}">Đặt lại mật khẩu</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Đặt lại mật khẩu\nTruy cập đường dẫn sau để đặt lại mật khẩu: ${vars.url}`,
  },
  order_submitted: {
    requiredVars: ["orderCode", "packageName", "amountFormatted"],
    subject: (vars) => `[MindKid] Xác nhận đơn hàng #${vars.orderCode}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} cho gói ${vars.packageName} (${vars.amountFormatted}) đã được tiếp nhận.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Đơn hàng #${vars.orderCode} đã được nhận.\nGói: ${vars.packageName}\nSố tiền: ${vars.amountFormatted}`,
  },
  order_approved: {
    requiredVars: ["orderCode", "packageName"],
    subject: (vars) => `[MindKid] Đơn hàng #${vars.orderCode} đã được duyệt!`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Gói học ${vars.packageName} cho đơn hàng #${vars.orderCode} đã được kích hoạt thành công.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Đơn hàng #${vars.orderCode} đã duyệt.\nGói học ${vars.packageName} đã được kích hoạt.`,
  },
  order_rejected: {
    requiredVars: ["orderCode", "reason"],
    subject: (vars) => `[MindKid] Thông báo đơn hàng #${vars.orderCode}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} chưa được duyệt. Lý do: ${vars.reason}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Đơn hàng #${vars.orderCode} chưa được duyệt.\nLý do: ${vars.reason}`,
  },
  subscription_expiring: {
    requiredVars: ["packageName", "daysLeft"],
    subject: (vars) => `[MindKid] Gói ${vars.packageName} sắp hết hạn`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Gói ${vars.packageName} của bạn còn ${vars.daysLeft} ngày sử dụng.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Gói ${vars.packageName} còn ${vars.daysLeft} ngày nữa sẽ hết hạn.`,
  },
  subscription_expired: {
    requiredVars: ["packageName"],
    subject: (vars) => `[MindKid] Gói ${vars.packageName} đã hết hạn`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Gói ${vars.packageName} của bạn đã hết hạn. Hãy gia hạn để tiếp tục theo dõi tiến độ bé.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) => `MindKid - Gói ${vars.packageName} đã hết hạn.`,
  },
  weekly_progress: {
    requiredVars: ["childName", "lessonsCompleted", "starsEarned"],
    subject: (vars) => `[MindKid] Báo cáo học tập tuần của ${vars.childName}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="14px" color="#475569">Bé ${vars.childName} đã hoàn thành ${vars.lessonsCompleted} bài học và nhận ${vars.starsEarned} ngôi sao trong tuần qua.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Báo cáo tuần của ${vars.childName}:\nBài học: ${vars.lessonsCompleted}\nNgôi sao: ${vars.starsEarned}`,
  },
  content_new: {
    requiredVars: ["title", "description"],
    subject: (vars) => `[MindKid] Nội dung mới: ${vars.title}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">${vars.title}</mj-text>
              <mj-text font-size="14px" color="#475569">${vars.description}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Nội dung mới: ${vars.title}\n${vars.description}`,
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
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid Admin</mj-text>
              <mj-text font-size="14px" color="#475569">Đơn hàng #${vars.orderCode} vừa được tạo. Tổng đơn chờ duyệt: ${vars.countPending}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid Admin - Đơn hàng #${vars.orderCode} mới tạo. Tổng chờ duyệt: ${vars.countPending}`,
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
      `MindKid System Alert: ${vars.alertTitle}\n${vars.message}`,
  },
  lesson_plan_source_updated: {
    requiredVars: ["entity_code", "new_version", "plan_title"],
    subject: (vars) =>
      `[MindKid] Nội dung ${vars.entity_code} trong giáo án "${vars.plan_title}" có bản cập nhật mới`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">Cập nhật nội dung giáo án</mj-text>
              <mj-text font-size="14px" color="#475569">Nội dung <strong>${vars.entity_code}</strong> trong giáo án "<strong>${vars.plan_title}</strong>" vừa được cập nhật lên phiên bản ${vars.new_version}.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `Nội dung ${vars.entity_code} trong giáo án "${vars.plan_title}" vừa được cập nhật lên phiên bản ${vars.new_version}.`,
  },
  pdf_export_ready: {
    requiredVars: ["title"],
    subject: (vars) => `[MindKid] File PDF giáo án "${vars.title}" đã sẵn sàng`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">Xuất file PDF thành công</mj-text>
              <mj-text font-size="14px" color="#475569">File PDF cho giáo án "<strong>${vars.title}</strong>" đã được tạo thành công và sẵn sàng để tải về.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - File PDF cho giáo án "${vars.title}" đã sẵn sàng để tải về.`,
  },
  pdf_export_failed: {
    requiredVars: ["title", "error"],
    subject: (vars) =>
      `[MindKid] Xuất PDF giáo án "${vars.title}" không thành công`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#dc2626">Xuất PDF không thành công</mj-text>
              <mj-text font-size="14px" color="#475569">Rất tiếc, quá trình xuất file PDF cho giáo án "<strong>${vars.title}</strong>" gặp lỗi: ${vars.error}. Lượt xuất (quota) của bạn đã được hoàn lại.</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Xuất PDF cho giáo án "${vars.title}" không thành công: ${vars.error}. Lượt xuất đã được hoàn lại.`,
  },
  social_identity_linked: {
    requiredVars: ["provider"],
    subject: (vars) => `[MindKid] Đã liên kết tài khoản ${vars.provider}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">Liên kết mạng xã hội thành công</mj-text>
              <mj-text font-size="14px" color="#475569">Tài khoản MindKid của bạn vừa được liên kết với <strong>${vars.provider}</strong>. Nếu không phải bạn thực hiện, vui lòng kiểm tra cài đặt bảo mật ngay.</mj-text>
              <mj-button background-color="#1a7f6b" href="/me/settings/security">Kiểm tra bảo mật</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Tài khoản của bạn vừa được liên kết với ${vars.provider}. Nếu không phải bạn thực hiện, vui lòng kiểm tra tại /me/settings/security.`,
  },
  social_identity_unlinked: {
    requiredVars: ["provider"],
    subject: (vars) => `[MindKid] Đã gỡ liên kết tài khoản ${vars.provider}`,
    mjml: (vars) => `
      <mjml>
        <mj-body background-color="#f8fafc">
          <mj-section background-color="#ffffff" border-radius="16px">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
              <mj-text font-size="16px" font-weight="bold" color="#334155">Gỡ liên kết mạng xã hội</mj-text>
              <mj-text font-size="14px" color="#475569">Tài khoản MindKid của bạn vừa gỡ liên kết <strong>${vars.provider}</strong>. Nếu không phải bạn thực hiện, vui lòng kiểm tra cài đặt bảo mật ngay.</mj-text>
              <mj-button background-color="#1a7f6b" href="/me/settings/security">Kiểm tra bảo mật</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    plainText: (vars) =>
      `MindKid - Tài khoản của bạn vừa gỡ liên kết ${vars.provider}. Nếu không phải bạn thực hiện, vui lòng kiểm tra tại /me/settings/security.`,
  },
};

export interface NotificationTemplateOverride {
  contentVersion: number;
  subject: string;
  body: string;
  updatedByManagerId: number;
  updatedAt: string;
}

interface TemplateLifecycleEntry {
  published: NotificationTemplateOverride | null;
  draft: NotificationTemplateOverride | null;
}

export interface NotificationTemplateState {
  code: EmailTemplateCode;
  required_vars: string[];
  content_version: number;
  published_version: number;
  status: "draft" | "published";
  subject: string;
  body: string;
  published_subject: string;
  published_body: string;
  is_child_recipient: boolean;
  updated_by_manager_id: number | null;
  updated_at: string | null;
}

const templateLifecycleStore = new Map<
  EmailTemplateCode,
  TemplateLifecycleEntry
>();

function buildSampleVarsForDefault(
  requiredVars: readonly string[]
): TemplateVars {
  const vars: TemplateVars = {};
  for (const key of requiredVars) {
    vars[key] = `{{${key}}}`;
  }
  return vars;
}

function interpolateTemplateString(
  templateStr: string,
  vars: TemplateVars
): string {
  return templateStr.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (_match, key: string) => {
      const val = vars[key];
      if (val === undefined || val === null) {
        return "";
      }
      return String(val);
    }
  );
}

function wrapBodyInMjmlIfNeeded(interpolatedBody: string): string {
  const trimmed = interpolatedBody.trim();
  if (trimmed.startsWith("<mjml")) {
    return trimmed;
  }
  return `
    <mjml>
      <mj-body background-color="#f8fafc">
        <mj-section background-color="#ffffff" border-radius="16px">
          <mj-column>
            <mj-text font-size="20px" font-weight="bold" color="#1a7f6b">MindKid</mj-text>
            <mj-text font-size="14px" color="#475569">${interpolatedBody}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;
}

function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNotificationTemplateState(
  code: EmailTemplateCode
): NotificationTemplateState {
  const def = TEMPLATE_REGISTRY[code];
  if (!def) {
    throw new Error(`Unknown email notification template code '${code}'`);
  }
  const placeholderVars = buildSampleVarsForDefault(def.requiredVars);
  const defaultSubject = def.subject(placeholderVars);
  const defaultBody = def.plainText(placeholderVars);
  const entry = templateLifecycleStore.get(code);
  const published = entry?.published ?? null;
  const draft = entry?.draft ?? null;
  const active = draft ?? published;

  return {
    code,
    required_vars: [...def.requiredVars],
    content_version: active ? active.contentVersion : 1,
    published_version: published ? published.contentVersion : 1,
    status: draft ? "draft" : "published",
    subject: active ? active.subject : defaultSubject,
    body: active ? active.body : defaultBody,
    published_subject: published ? published.subject : defaultSubject,
    published_body: published ? published.body : defaultBody,
    is_child_recipient: code.startsWith("child_"),
    updated_by_manager_id: active ? active.updatedByManagerId : null,
    updated_at: active ? active.updatedAt : null,
  };
}

export function listNotificationTemplateStates(): NotificationTemplateState[] {
  return (Object.keys(TEMPLATE_REGISTRY) as EmailTemplateCode[]).map((code) =>
    getNotificationTemplateState(code)
  );
}

export function saveNotificationTemplateDraft(input: {
  code: EmailTemplateCode;
  subject: string;
  body: string;
  updatedByManagerId: number;
  baseVersion?: number;
}): NotificationTemplateState {
  const def = TEMPLATE_REGISTRY[input.code];
  if (!def) {
    throw new Error(`Unknown email notification template code '${input.code}'`);
  }
  const current = templateLifecycleStore.get(input.code);
  const currentMaxVersion = Math.max(
    1,
    input.baseVersion ?? 1,
    current?.published?.contentVersion ?? 1,
    current?.draft?.contentVersion ?? 1
  );
  const nextVersion = currentMaxVersion + 1;
  const nowIso = new Date().toISOString();

  templateLifecycleStore.set(input.code, {
    published: current?.published ?? null,
    draft: {
      contentVersion: nextVersion,
      subject: input.subject,
      body: input.body,
      updatedByManagerId: input.updatedByManagerId,
      updatedAt: nowIso,
    },
  });

  return getNotificationTemplateState(input.code);
}

export function publishNotificationTemplate(input: {
  code: EmailTemplateCode;
  updatedByManagerId: number;
  subject?: string;
  body?: string;
  baseVersion?: number;
}): NotificationTemplateState {
  const def = TEMPLATE_REGISTRY[input.code];
  if (!def) {
    throw new Error(`Unknown email notification template code '${input.code}'`);
  }
  const current = templateLifecycleStore.get(input.code);
  const sourceDraft = current?.draft ?? null;
  const currentState = getNotificationTemplateState(input.code);
  const finalSubject =
    input.subject ?? sourceDraft?.subject ?? currentState.subject;
  const finalBody = input.body ?? sourceDraft?.body ?? currentState.body;
  const nextVersion = sourceDraft
    ? sourceDraft.contentVersion
    : Math.max(
        1,
        input.baseVersion ?? 1,
        current?.published?.contentVersion ?? 1
      ) + (input.subject !== undefined || input.body !== undefined ? 1 : 0);

  templateLifecycleStore.set(input.code, {
    published: {
      contentVersion: nextVersion,
      subject: finalSubject,
      body: finalBody,
      updatedByManagerId: input.updatedByManagerId,
      updatedAt: new Date().toISOString(),
    },
    draft: null,
  });

  return getNotificationTemplateState(input.code);
}

export function resetNotificationTemplateOverrides(): void {
  templateLifecycleStore.clear();
}

export interface RenderEmailResult {
  subject: string;
  html: string;
  text: string;
}

type MjmlCompiler = (
  mjml: string,
  options?: { validationLevel?: string }
) => Promise<{ html: string; errors?: Array<{ formattedMessage: string }> }>;

type MjmlModuleOrFn = MjmlCompiler | { default: MjmlCompiler };

function resolveActiveTemplateOverride(
  code: EmailTemplateCode,
  useDraft?: boolean
): NotificationTemplateOverride | null {
  const lifecycleEntry = templateLifecycleStore.get(code);
  if (useDraft) {
    return lifecycleEntry?.draft ?? lifecycleEntry?.published ?? null;
  }
  return lifecycleEntry?.published ?? null;
}

function assertSafeRenderedHtml(html: string): void {
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
}

export async function renderEmailTemplate(
  code: EmailTemplateCode,
  payload: TemplateVars,
  options?: { useDraft?: boolean }
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
  const activeOverride = resolveActiveTemplateOverride(code, options?.useDraft);

  const subject = activeOverride
    ? interpolateTemplateString(activeOverride.subject, escapedPayload)
    : template.subject(escapedPayload);

  const interpolatedBody = activeOverride
    ? interpolateTemplateString(activeOverride.body, escapedPayload)
    : null;

  const mjmlContent = interpolatedBody
    ? wrapBodyInMjmlIfNeeded(interpolatedBody)
    : template.mjml(escapedPayload);

  const plainText = interpolatedBody
    ? stripHtmlTags(interpolatedBody)
    : template.plainText(escapedPayload);

  const fn: MjmlModuleOrFn = mjml2html as MjmlModuleOrFn;
  const compileMjml: MjmlCompiler = typeof fn === "function" ? fn : fn.default;

  const renderResult = await compileMjml(mjmlContent, {
    validationLevel: "strict",
  });

  if (renderResult.errors && renderResult.errors.length > 0) {
    throw new Error(
      `MJML strict validation error for template '${code}': ${renderResult.errors[0]?.formattedMessage ?? "Unknown error"}`
    );
  }

  const html = renderResult.html;
  assertSafeRenderedHtml(html);

  return {
    subject,
    html,
    text: plainText,
  };
}
