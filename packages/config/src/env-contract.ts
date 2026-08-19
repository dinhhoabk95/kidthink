/**
 * Single Source of Truth for Environment Variables Registry & Validator
 * Contract: docs/specs/01-platform/env-contract.md
 * Rules: BR-ENV-01..12
 */

export type AppType = "web" | "admin" | "worker";
export type EnvRequired = "always" | "production" | "when-enabled";
export type EnvKind = "url" | "secret" | "email" | "port" | "enum" | "text";

export interface EnvVarDef {
  name: string;
  apps: readonly AppType[];
  required: EnvRequired;
  kind: EnvKind;
  secret: boolean;
  enabledBy?: string;
  enumValues?: readonly string[];
  note: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ENV_REGISTRY: readonly EnvVarDef[] = [
  // ─── Core & Runtime ──────────────────────────────────────────────────────────
  {
    name: "NODE_ENV",
    apps: ["web", "admin", "worker"],
    required: "always",
    kind: "enum",
    secret: false,
    enumValues: ["development", "production", "test"],
    note: "Môi trường thực thi của tiến trình",
  },
  {
    name: "PORT",
    apps: ["web", "admin", "worker"],
    required: "always",
    kind: "port",
    secret: false,
    note: "Cổng lắng nghe của HTTP server",
  },
  {
    name: "NUXT_ALLOWED_ORIGINS",
    apps: ["web", "admin"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Danh sách domain được phép gọi API (CORS whitelist)",
  },

  // ─── Database ────────────────────────────────────────────────────────────────
  {
    name: "DATABASE_URL",
    apps: ["web", "admin", "worker"],
    required: "always",
    kind: "url",
    secret: true,
    note: "Chuỗi kết nối PostgreSQL (postgres://...)",
  },
  {
    name: "DATABASE_POOL_MIN",
    apps: ["web", "admin", "worker"],
    required: "production",
    kind: "port",
    secret: false,
    note: "Số kết nối tối thiểu trong DB pool",
  },
  {
    name: "DATABASE_POOL_MAX",
    apps: ["web", "admin", "worker"],
    required: "production",
    kind: "port",
    secret: false,
    note: "Số kết nối tối đa trong DB pool",
  },

  // ─── Cache & Queue ───────────────────────────────────────────────────────────
  {
    name: "VALKEY_URL",
    apps: ["web", "admin", "worker"],
    required: "always",
    kind: "url",
    secret: true,
    note: "Chuỗi kết nối Valkey/Redis cho cache và queue",
  },

  // ─── Auth & Secrets ──────────────────────────────────────────────────────────
  {
    name: "NUXT_SESSION_PASSWORD",
    apps: ["web", "admin"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Mật khẩu niêm phong cookie session (tối thiểu 32 byte)",
  },
  {
    name: "WEB_JWT_SECRET",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá ký JWT access/refresh token cho người dùng web",
  },
  {
    name: "ADMIN_JWT_SECRET",
    apps: ["admin", "web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá ký JWT token cho manager / super admin",
  },
  {
    name: "PARENT_GATE_SECRET",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Bí mật HMAC cho Parent Gate token",
  },
  {
    name: "MFA_ENCRYPTION_KEY",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá MFA TOTP secrets (tối thiểu 32 byte)",
  },
  {
    name: "PAYMENT_WEBHOOK_SECRET",
    apps: ["web"],
    required: "production",
    kind: "secret",
    secret: true,
    note: "Khoá xác thực webhook cổng thanh toán",
  },

  // ─── Site & Public URLs ──────────────────────────────────────────────────────
  {
    name: "SITE_URL",
    apps: ["web", "admin"],
    required: "always",
    kind: "url",
    secret: false,
    note: "Địa chỉ công khai của site web chính (https://...)",
  },
  {
    name: "ADMIN_SITE_URL",
    apps: ["web", "admin"],
    required: "always",
    kind: "url",
    secret: false,
    note: "Địa chỉ công khai của admin site (https://...)",
  },

  // ─── Storage ─────────────────────────────────────────────────────────────────
  {
    name: "STORAGE_DRIVER",
    apps: ["web", "admin", "worker"],
    required: "always",
    kind: "enum",
    secret: false,
    enumValues: ["local", "s3"],
    note: "Driver lưu trữ tệp (local hoặc s3)",
  },
  {
    name: "S3_BUCKET",
    apps: ["web", "admin", "worker"],
    required: "when-enabled",
    enabledBy: "STORAGE_DRIVER",
    kind: "text",
    secret: false,
    note: "Tên S3 Bucket lưu trữ ảnh và assets",
  },
  {
    name: "S3_REGION",
    apps: ["web", "admin", "worker"],
    required: "when-enabled",
    enabledBy: "STORAGE_DRIVER",
    kind: "text",
    secret: false,
    note: "AWS Region của S3 bucket",
  },
  {
    name: "S3_ACCESS_KEY_ID",
    apps: ["web", "admin", "worker"],
    required: "when-enabled",
    enabledBy: "STORAGE_DRIVER",
    kind: "text",
    secret: true,
    note: "S3 Access Key ID",
  },
  {
    name: "S3_SECRET_ACCESS_KEY",
    apps: ["web", "admin", "worker"],
    required: "when-enabled",
    enabledBy: "STORAGE_DRIVER",
    kind: "secret",
    secret: true,
    note: "S3 Secret Access Key",
  },
  {
    name: "S3_ENDPOINT",
    apps: ["web", "admin", "worker"],
    required: "when-enabled",
    enabledBy: "STORAGE_DRIVER",
    kind: "url",
    secret: false,
    note: "S3 custom endpoint cho MinIO hoặc Cloudflare R2",
  },

  // ─── Email (SMTP) ────────────────────────────────────────────────────────────
  {
    name: "SMTP_HOST",
    apps: ["web", "worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Địa chỉ máy chủ SMTP gửi email",
  },
  {
    name: "SMTP_PORT",
    apps: ["web", "worker"],
    required: "production",
    kind: "port",
    secret: false,
    note: "Cổng máy chủ SMTP (587, 465, 25, 1025)",
  },
  {
    name: "SMTP_USER",
    apps: ["web", "worker"],
    required: "production",
    kind: "text",
    secret: true,
    note: "Tên đăng nhập SMTP",
  },
  {
    name: "SMTP_PASSWORD",
    apps: ["web", "worker"],
    required: "production",
    kind: "secret",
    secret: true,
    note: "Mật khẩu SMTP",
  },
  {
    name: "SMTP_FROM",
    apps: ["web", "worker"],
    required: "production",
    kind: "email",
    secret: false,
    note: "Địa chỉ email người gửi mặc định",
  },

  // ─── Push Notifications (FCM) ────────────────────────────────────────────────
  {
    name: "FCM_PROJECT_ID",
    apps: ["web", "worker"],
    required: "when-enabled",
    enabledBy: "FCM_ENABLED",
    kind: "text",
    secret: false,
    note: "Google Firebase Project ID cho Web Push / FCM",
  },
  {
    name: "FCM_CLIENT_EMAIL",
    apps: ["web", "worker"],
    required: "when-enabled",
    enabledBy: "FCM_ENABLED",
    kind: "email",
    secret: false,
    note: "FCM Service Account Client Email",
  },
  {
    name: "FCM_PRIVATE_KEY",
    apps: ["web", "worker"],
    required: "when-enabled",
    enabledBy: "FCM_ENABLED",
    kind: "secret",
    secret: true,
    note: "FCM Service Account Private Key PEM",
  },
  {
    name: "FCM_ENCRYPTION_KEY",
    apps: ["web", "worker"],
    required: "when-enabled",
    enabledBy: "FCM_ENABLED",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá FCM token (tối thiểu 32 byte)",
  },

  // ─── Backups & Ops ───────────────────────────────────────────────────────────
  {
    name: "BACKUP_ENCRYPTION_KEY",
    apps: ["worker"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá AES-256-GCM file dump backup database (32 byte)",
  },
  {
    name: "BACKUP_DIR",
    apps: ["worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Đường dẫn thư mục lưu trữ backup trên máy chủ",
  },
  {
    name: "ALERT_WEBHOOK_URL",
    apps: ["worker"],
    required: "when-enabled",
    enabledBy: "ALERT_ENABLED",
    kind: "url",
    secret: true,
    note: "Webhook gửi cảnh báo hệ thống (Telegram/Slack)",
  },

  // ─── Social Login (OAuth) ────────────────────────────────────────────────────
  {
    name: "GOOGLE_CLIENT_ID",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_GOOGLE",
    kind: "text",
    secret: false,
    note: "Google OAuth Client ID",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_GOOGLE",
    kind: "secret",
    secret: true,
    note: "Google OAuth Client Secret",
  },
  {
    name: "FACEBOOK_CLIENT_ID",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_FACEBOOK",
    kind: "text",
    secret: false,
    note: "Facebook App Client ID",
  },
  {
    name: "FACEBOOK_CLIENT_SECRET",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_FACEBOOK",
    kind: "secret",
    secret: true,
    note: "Facebook App Client Secret",
  },
  {
    name: "APPLE_CLIENT_ID",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_APPLE",
    kind: "text",
    secret: false,
    note: "Apple Services ID",
  },
  {
    name: "APPLE_TEAM_ID",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_APPLE",
    kind: "text",
    secret: false,
    note: "Apple Developer Team ID",
  },
  {
    name: "APPLE_KEY_ID",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_APPLE",
    kind: "text",
    secret: false,
    note: "Apple Sign-in Key ID",
  },
  {
    name: "APPLE_PRIVATE_KEY",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "OAUTH_APPLE",
    kind: "secret",
    secret: true,
    note: "Apple Sign-in Private Key (.p8)",
  },

  // ─── Feature Flags & Optional Addons ─────────────────────────────────────────
  {
    name: "FEATURE_PWA_OFFLINE",
    apps: ["web"],
    required: "production",
    kind: "enum",
    secret: false,
    enumValues: ["true", "false"],
    note: "Cờ bật tính năng offline pack cho PWA",
  },
  {
    name: "FEATURE_CUSTOM_GAMES",
    apps: ["web", "admin"],
    required: "production",
    kind: "enum",
    secret: false,
    enumValues: ["true", "false"],
    note: "Cờ bật tạo game tuỳ chỉnh cho người dạy",
  },
  {
    name: "FEATURE_AI_ASSISTANT",
    apps: ["web"],
    required: "production",
    kind: "enum",
    secret: false,
    enumValues: ["true", "false"],
    note: "Cờ bật trợ lý AI soạn bài học",
  },
  {
    name: "FEATURE_RECURRING_BILLING",
    apps: ["web", "worker"],
    required: "production",
    kind: "enum",
    secret: false,
    enumValues: ["true", "false"],
    note: "Cờ bật tự động thanh toán gia hạn",
  },
  {
    name: "OPENAI_API_KEY",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "FEATURE_AI_ASSISTANT",
    kind: "secret",
    secret: true,
    note: "API Key gọi OpenAI / AI Planner",
  },
  {
    name: "OPENAI_BASE_URL",
    apps: ["web"],
    required: "when-enabled",
    enabledBy: "FEATURE_AI_ASSISTANT",
    kind: "url",
    secret: false,
    note: "Base URL cho AI service proxy",
  },
  {
    name: "SEEDED_ADMIN_EMAIL",
    apps: ["web", "admin"],
    required: "when-enabled",
    enabledBy: "SEED_ENABLED",
    kind: "email",
    secret: false,
    note: "Email tài khoản admin ban đầu khi chạy seed",
  },
  {
    name: "SEEDED_ADMIN_PASSWORD",
    apps: ["web", "admin"],
    required: "when-enabled",
    enabledBy: "SEED_ENABLED",
    kind: "secret",
    secret: true,
    note: "Mật khẩu tài khoản admin ban đầu khi chạy seed",
  },
] as const;

export interface ValidationError {
  varName: string;
  issue: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

function isMandatoryVariable(
  def: EnvVarDef,
  parsed: Map<string, string>,
  isProduction: boolean
): boolean {
  if (def.required === "always") {
    return true;
  }
  if (def.required === "production" && isProduction) {
    return true;
  }
  if (def.required === "when-enabled" && def.enabledBy) {
    const enabler = parsed.get(def.enabledBy);
    return enabler === "true" || enabler === "s3";
  }
  return false;
}

function checkKindValidation(
  def: EnvVarDef,
  rawVal: string,
  errors: ValidationError[]
) {
  if (def.kind === "secret" && Buffer.byteLength(rawVal, "utf8") < 32) {
    errors.push({
      varName: def.name,
      issue: "Secret value must be at least 32 bytes long (BR-ENV-11)",
    });
    return;
  }
  if (def.kind === "url") {
    try {
      new URL(rawVal);
    } catch {
      errors.push({ varName: def.name, issue: "Invalid URL format" });
    }
    return;
  }
  if (def.kind === "email" && !EMAIL_REGEX.test(rawVal)) {
    errors.push({ varName: def.name, issue: "Invalid email format" });
    return;
  }
  if (def.kind === "port") {
    const portNum = Number(rawVal);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65_535) {
      errors.push({
        varName: def.name,
        issue: "Port must be an integer between 1 and 65535",
      });
    }
    return;
  }
  if (
    def.kind === "enum" &&
    def.enumValues &&
    !def.enumValues.includes(rawVal)
  ) {
    errors.push({
      varName: def.name,
      issue: `Value must be one of: ${def.enumValues.join(", ")}`,
    });
  }
}

/**
 * Validates an in-memory Map of parsed environment variables against the registry.
 * Does NOT access process.env (BR-ENV-06).
 */
export function validateEnvFile(
  app: AppType,
  parsed: Map<string, string>,
  isProduction = false
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const registeredNames = new Set(ENV_REGISTRY.map((v) => v.name));

  for (const def of ENV_REGISTRY) {
    if (!def.apps.includes(app)) {
      continue;
    }

    const value = parsed.get(def.name);
    const hasValue = value !== undefined && value.trim().length > 0;
    const isMandatory = isMandatoryVariable(def, parsed, isProduction);

    if (isMandatory && !hasValue) {
      errors.push({
        varName: def.name,
        issue: `Missing required environment variable for ${app} (${def.required})`,
      });
      continue;
    }

    if (hasValue && typeof value === "string") {
      checkKindValidation(def, value, errors);
    }
  }

  for (const [key] of parsed) {
    if (!registeredNames.has(key)) {
      warnings.push({
        varName: key,
        issue: "Unrecognized variable not declared in ENV_REGISTRY",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
