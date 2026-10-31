import "@mindkid/config";
import { createEnv } from "@t3-oss/env-nuxt";
import { z } from "zod";

interface EnvIssuePathSegment {
  readonly key: PropertyKey;
}

interface EnvValidationIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | EnvIssuePathSegment> | undefined;
}

const MIN_SECRET_BYTES = 32;
const MIN_PORT = 1;
const MAX_PORT = 65_535;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nonEmptyString = z
  .string()
  .trim()
  .min(1, "Biến môi trường không được để trống (BR-ENV-03)");

const secretSchema = z
  .string()
  .refine(
    (val: string): boolean =>
      Buffer.byteLength(val, "utf8") >= MIN_SECRET_BYTES,
    {
      message: `Secret phải dài tối thiểu ${MIN_SECRET_BYTES} bytes (BR-ENV-11)`,
    }
  );

const emailSchema = z
  .string()
  .trim()
  .regex(EMAIL_REGEX, "Định dạng email không hợp lệ");

const portSchema = z.string().refine(
  (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length === 0) {
      return false;
    }
    const portNum = Number(trimmed);
    return (
      Number.isInteger(portNum) && portNum >= MIN_PORT && portNum <= MAX_PORT
    );
  },
  {
    message: `Port phải là số nguyên từ ${MIN_PORT} đến ${MAX_PORT}`,
  }
);

function urlWithProtocols(protocols: readonly string[]) {
  return z.string().refine(
    (val: string): boolean => {
      try {
        const parsed = new URL(val);
        return protocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message: `URL không hợp lệ hoặc giao thức không nằm trong: ${protocols.join(", ")} (BR-ENV-13)`,
    }
  );
}

function productionRequired<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  isProduction: boolean
): TSchema | z.ZodOptional<TSchema> {
  return isProduction ? schema : schema.optional();
}

function formatIssuePath(issue: EnvValidationIssue): string {
  if (!issue.path || issue.path.length === 0) {
    return "UNKNOWN_ENV_VAR";
  }
  const firstSegment = issue.path[0];
  if (
    typeof firstSegment === "object" &&
    firstSegment !== null &&
    "key" in firstSegment
  ) {
    return String(firstSegment.key);
  }
  return String(firstSegment);
}

/**
 * BR-ENV-08: Chỉ in tên biến và lý do lỗi, tuyệt đối không in giá trị bí mật.
 */
function handleValidationError(issues: readonly EnvValidationIssue[]): never {
  const details = issues
    .map(
      (issue: EnvValidationIssue): string =>
        `${formatIssuePath(issue)}: ${issue.message}`
    )
    .join("; ");
  throw new Error(
    `Cấu hình biến môi trường web không hợp lệ (${details}). Xem docs/specs/01-platform/env-contract.md.`
  );
}

function handleInvalidClientAccess(variable: string): never {
  throw new Error(
    `Cấm truy cập biến môi trường máy chủ "${variable}" từ trình duyệt (BR-CFO-12).`
  );
}

export interface CreateWebEnvOptions {
  isProduction?: boolean;
  isServer?: boolean;
  skipValidation?: boolean;
}

export function createWebEnv(options: CreateWebEnvOptions = {}) {
  const isProduction =
    options.isProduction ?? process.env.NODE_ENV === "production";

  return createEnv({
    isServer: options.isServer,
    skipValidation: options.skipValidation,
    emptyStringAsUndefined: true,
    onValidationError: handleValidationError,
    onInvalidAccess: handleInvalidClientAccess,
    shared: {
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    },
    client: {
      NUXT_PUBLIC_API_BASE_URL: urlWithProtocols([
        "http:",
        "https:",
      ]).optional(),
      NUXT_PUBLIC_SENTRY_DSN: urlWithProtocols(["https:"]).optional(),
    },
    server: {
      // ---- Runtime ----------------------------------------------------------
      PORT: isProduction ? portSchema : portSchema.default("3000"),
      SITE_URL: urlWithProtocols(["http:", "https:"]),
      NUXT_ALLOWED_ORIGINS: nonEmptyString,
      TRUSTED_PROXY_IPS: nonEmptyString.optional(),

      // ---- Dữ liệu ----------------------------------------------------------
      DATABASE_URL: urlWithProtocols(["postgres:", "postgresql:"]),
      DATABASE_URL_APP: urlWithProtocols(["postgres:", "postgresql:"]),
      VALKEY_URL: urlWithProtocols(["valkey:", "redis:", "rediss:"]),

      // ---- Bí mật phiên và token --------------------------------------------
      NUXT_SESSION_PASSWORD: secretSchema,
      PARENT_GATE_SECRET: secretSchema,
      MFA_ENCRYPTION_KEY: secretSchema,

      // ---- Thanh toán -------------------------------------------------------
      PAYMENT_WEBHOOK_SECRET: productionRequired(secretSchema, isProduction),
      PAYMENT_PAYOS_WEBHOOK_SECRET: secretSchema.optional(),
      PAYMENT_VNPAY_WEBHOOK_SECRET: secretSchema.optional(),
      PAYMENT_MOMO_WEBHOOK_SECRET: secretSchema.optional(),
      PAYMENT_MODE: productionRequired(
        z.enum(["sandbox", "live"]),
        isProduction
      ),
      PAYMENT_MERCHANT_ID: productionRequired(nonEmptyString, isProduction),
      PAYMENT_PAYOS_MERCHANT_ID: nonEmptyString.optional(),
      PAYMENT_VNPAY_MERCHANT_ID: nonEmptyString.optional(),
      PAYMENT_MOMO_MERCHANT_ID: nonEmptyString.optional(),
      VIETQR_BANK_ID: productionRequired(nonEmptyString, isProduction),
      VIETQR_BANK_NAME: productionRequired(nonEmptyString, isProduction),
      VIETQR_ACCOUNT_NO: productionRequired(nonEmptyString, isProduction),
      VIETQR_ACCOUNT_NAME: productionRequired(nonEmptyString, isProduction),

      // ---- Lưu trữ tệp ------------------------------------------------------
      STORAGE_BASE_URL: productionRequired(
        urlWithProtocols(["http:", "https:"]),
        isProduction
      ),
      STORAGE_SIGNING_SECRET: secretSchema,
      AWS_S3_PUBLIC_BUCKET: productionRequired(nonEmptyString, isProduction),
      AWS_S3_PRIVATE_BUCKET: productionRequired(nonEmptyString, isProduction),
      AWS_ACCESS_KEY_ID: nonEmptyString.optional(),
      AWS_SECRET_ACCESS_KEY: secretSchema.optional(),

      // ---- Đăng nhập bên thứ ba --------------------------------------------
      GOOGLE_CLIENT_ID: nonEmptyString.optional(),
      GOOGLE_CLIENT_SECRET: secretSchema.optional(),
      FACEBOOK_CLIENT_ID: nonEmptyString.optional(),
      FACEBOOK_CLIENT_SECRET: secretSchema.optional(),

      // ---- Thông báo --------------------------------------------------------
      NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY: secretSchema,
      FCM_ENCRYPTION_SECRET: secretSchema.optional(),

      // ---- Trợ lý AI và tìm kiếm ngữ nghĩa (Add-on P4) ----------------------
      AI_PROVIDER_API_KEY: secretSchema.optional(),
      AI_PROVIDER_BASE_URL: urlWithProtocols(["http:", "https:"]).optional(),

      // ---- Vận hành và cảnh báo --------------------------------------------
      TELEGRAM_BOT_TOKEN: productionRequired(secretSchema, isProduction),
      TELEGRAM_CHAT_ID: productionRequired(nonEmptyString, isProduction),
      HEALTHCHECKS_PING_URL: productionRequired(
        urlWithProtocols(["https:"]),
        isProduction
      ),
      HEALTHCHECKS_CHECK_UUID: nonEmptyString.optional(),
      OPERATIONS_ALERT_EMAIL: productionRequired(emailSchema, isProduction),
      SENTRY_DSN: urlWithProtocols(["https:"]).optional(),
      CLIENT_ERROR_SAMPLING_RATE: nonEmptyString.optional(),

      // ---- Vận hành một lần -------------------------------------------------
      INITIAL_ADMIN_EMAIL: emailSchema.optional(),
      INITIAL_ADMIN_PASSWORD: isProduction
        ? secretSchema.optional()
        : nonEmptyString.optional(),
      GIT_SHA: nonEmptyString.optional(),
      PR_URL: urlWithProtocols(["https:"]).optional(),
    },
  });
}
