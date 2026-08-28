/**
 * Environment variable registry and validator.
 * Contract: docs/specs/01-platform/env-contract.md
 *
 * Every entry below corresponds to a name this repository actually reads.
 * Measured 2026-08-19 by scanning `apps/` and `packages/` for `process.env.*`;
 * `apps` is the set of applications whose dependency graph can reach the
 * reading module (BR-ENV-04). A name nothing reads does not belong here: the
 * validator would demand a value no process consumes.
 *
 * This module must stay dependency-free. The release workflow runs it through
 * `packages/config/scripts/validate-env-file.ts` BEFORE `pnpm install` (BR-DEP-04).
 */

export type AppType = "web" | "admin" | "worker";
export type EnvRequired = "always" | "production" | "when-enabled" | "optional";
export type EnvKind = "url" | "secret" | "email" | "port" | "enum" | "text";

export interface EnvVarDef {
  name: string;
  apps: readonly AppType[];
  required: EnvRequired;
  kind: EnvKind;
  secret: boolean;
  enabledBy?: string;
  enumValues?: readonly string[];
  /**
   * BR-ENV-13 — bắt buộc khi `kind` là `url`.
   *
   * `new URL()` chấp mọi scheme, nên nếu chỉ kiểm "phân tích được" thì
   * `DATABASE_URL_APP=https://example.com/endpoint` qua cổng env màu xanh rồi
   * mới chết ở runtime. Cổng giữ ràng buộc này là
   * `packages/config/tests/env-contract.test.ts`.
   */
  urlProtocols?: readonly string[];
  note: string;
}

const ALL_APPS: readonly AppType[] = ["web", "worker"];

export const ENV_REGISTRY: readonly EnvVarDef[] = [
  // ---- Runtime ------------------------------------------------------------
  {
    name: "NODE_ENV",
    apps: ALL_APPS,
    required: "always",
    kind: "enum",
    secret: false,
    enumValues: ["development", "test", "production"],
    note: "Chế độ chạy; quyết định biến nào bắt buộc ở máy chủ",
  },
  {
    name: "PORT",
    apps: ["web", "worker"],
    required: "always",
    kind: "port",
    secret: false,
    note: "Cổng loopback của tiến trình, xem server-provisioning.md §7.3",
  },
  {
    name: "SITE_URL",
    apps: ALL_APPS,
    required: "always",
    kind: "url",
    urlProtocols: ["http:", "https:"],
    secret: false,
    note: "Địa chỉ công khai của site; dùng cho SEO, sitemap, OAuth callback, URL tài sản",
  },
  {
    name: "NUXT_ALLOWED_ORIGINS",
    apps: ["web"],
    required: "always",
    kind: "text",
    secret: false,
    note: "Danh sách origin được phép gọi API; web dùng cho CORS và CSRF allowlist",
  },
  {
    name: "TRUSTED_PROXY_IPS",
    apps: ["web"],
    required: "optional",
    kind: "text",
    secret: false,
    note: "Danh sách IP proxy tin cậy; chỉ peer trong danh sách này mới được đọc X-Real-IP (BR-RTL-11). Vắng mặt thì mặc định 127.0.0.1,::1",
  },
  {
    name: "NUXT_PUBLIC_API_BASE_URL",
    apps: ["admin"],
    required: "always",
    kind: "url",
    urlProtocols: ["http:", "https:"],
    secret: false,
    note: "Origin tuyệt đối của web API được nướng vào static admin SPA",
  },

  // ---- Dữ liệu ------------------------------------------------------------
  {
    name: "DATABASE_URL",
    apps: ALL_APPS,
    required: "always",
    kind: "url",
    urlProtocols: ["postgres:", "postgresql:"],
    secret: true,
    note: "Chuỗi kết nối PostgreSQL của tiến trình di trú và ứng dụng",
  },
  {
    name: "DATABASE_URL_APP",
    apps: ALL_APPS,
    required: "always",
    kind: "url",
    urlProtocols: ["postgres:", "postgresql:"],
    secret: true,
    note: "Chuỗi kết nối quyền hẹp cho ứng dụng",
  },
  {
    name: "VALKEY_URL",
    apps: ALL_APPS,
    required: "always",
    kind: "url",
    urlProtocols: ["valkey:", "redis:", "rediss:"],
    secret: true,
    note: "Chuỗi kết nối Valkey cho cache, hàng đợi và giới hạn tần suất",
  },

  // ---- Bí mật phiên và token ----------------------------------------------
  {
    name: "NUXT_SESSION_PASSWORD",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Mật khẩu niêm phong cookie phiên; tên do thư viện session cố định",
  },
  {
    name: "PARENT_GATE_SECRET",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá ký chứng cứ vượt cổng người lớn",
  },

  {
    name: "MFA_ENCRYPTION_KEY",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá bí mật TOTP lưu trong cơ sở dữ liệu",
  },

  // ---- Thanh toán ---------------------------------------------------------
  {
    name: "PAYMENT_WEBHOOK_SECRET",
    apps: ["web"],
    required: "production",
    kind: "secret",
    secret: true,
    note: "Khoá kiểm chữ ký webhook thanh toán, dùng chung khi không có khoá riêng nhà cung cấp",
  },
  {
    name: "PAYMENT_PAYOS_WEBHOOK_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Khoá webhook riêng của PayOS; thiếu thì dùng PAYMENT_WEBHOOK_SECRET",
  },
  {
    name: "PAYMENT_VNPAY_WEBHOOK_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Khoá webhook riêng của VNPay; thiếu thì dùng PAYMENT_WEBHOOK_SECRET",
  },
  {
    name: "PAYMENT_MOMO_WEBHOOK_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Khoá webhook riêng của MoMo; thiếu thì dùng PAYMENT_WEBHOOK_SECRET",
  },
  {
    name: "VIETQR_BANK_ID",
    apps: ["web"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Mã ngân hàng in trên mã QR chuyển khoản thủ công",
  },
  {
    name: "VIETQR_BANK_NAME",
    apps: ["web"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Tên ngân hàng hiển thị kèm mã QR",
  },
  {
    name: "VIETQR_ACCOUNT_NO",
    apps: ["web"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Số tài khoản nhận chuyển khoản",
  },
  {
    name: "VIETQR_ACCOUNT_NAME",
    apps: ["web"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Tên chủ tài khoản nhận chuyển khoản",
  },

  // ---- Lưu trữ tệp --------------------------------------------------------
  {
    name: "STORAGE_BASE_URL",
    apps: ["web", "worker"],
    required: "production",
    kind: "url",
    urlProtocols: ["http:", "https:"],
    secret: false,
    note: "Địa chỉ gốc phục vụ tài sản; thiếu thì rơi về SITE_URL",
  },
  {
    name: "STORAGE_SIGNING_SECRET",
    apps: ["web", "worker"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá ký URL tài sản riêng tư của trẻ; không có mặc định",
  },
  {
    name: "AWS_S3_PUBLIC_BUCKET",
    apps: ["web", "worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Tên bucket chứa tài sản công khai",
  },
  {
    name: "AWS_S3_PRIVATE_BUCKET",
    apps: ["web", "worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Tên bucket chứa tài sản riêng tư",
  },
  {
    name: "AWS_ACCESS_KEY_ID",
    apps: ["web", "worker"],
    required: "optional",
    kind: "text",
    secret: false,
    note: "Khoá truy cập S3; thiếu cả cặp thì tầng lưu trữ chạy chế độ cục bộ",
  },
  {
    name: "AWS_SECRET_ACCESS_KEY",
    apps: ["web", "worker"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Bí mật truy cập S3, đi cùng AWS_ACCESS_KEY_ID",
  },

  // ---- Đăng nhập bên thứ ba ----------------------------------------------
  {
    name: "GOOGLE_CLIENT_ID",
    apps: ["web"],
    required: "optional",
    kind: "text",
    secret: false,
    note: "Định danh ứng dụng OAuth Google; thiếu thì nút đăng nhập Google tắt",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Bí mật OAuth Google, đi cùng GOOGLE_CLIENT_ID",
  },
  {
    name: "FACEBOOK_CLIENT_ID",
    apps: ["web"],
    required: "optional",
    kind: "text",
    secret: false,
    note: "Định danh ứng dụng OAuth Facebook; thiếu thì nút đăng nhập Facebook tắt",
  },
  {
    name: "FACEBOOK_CLIENT_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Bí mật OAuth Facebook, đi cùng FACEBOOK_CLIENT_ID",
  },

  // ---- Thông báo ----------------------------------------------------------
  {
    name: "NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY",
    apps: ["web"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá token thiết bị nhận thông báo đẩy",
  },
  {
    name: "FCM_ENCRYPTION_SECRET",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá dữ liệu FCM; thiếu thì tầng thông báo đẩy tắt",
  },

  // ---- Vận hành và cảnh báo ----------------------------------------------
  {
    name: "TELEGRAM_BOT_TOKEN",
    apps: ["web", "worker"],
    required: "production",
    kind: "secret",
    secret: true,
    note: "Token bot gửi cảnh báo vận hành. Thiếu nó ở production thì mọi cảnh báo P0 rơi xuống console.warn trong tệp log không ai đọc (BR-MON-01)",
  },
  {
    name: "TELEGRAM_CHAT_ID",
    apps: ["web", "worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Nhóm nhận cảnh báo vận hành, đi cùng TELEGRAM_BOT_TOKEN",
  },
  {
    name: "HEALTHCHECKS_PING_URL",
    apps: ["web", "worker"],
    required: "production",
    kind: "url",
    urlProtocols: ["https:"],
    secret: true,
    note: "Địa chỉ ping báo hiệu tiến trình định kỳ còn sống, và là kênh cảnh báo dự phòng khi Telegram hỏng. Bắt buộc ở production vì đường thư điện tử trong repo này vẫn là LocalFileEmailAdapter — nó ghi ra tệp, không gửi cho ai",
  },
  {
    name: "HEALTHCHECKS_CHECK_UUID",
    apps: ["web", "worker"],
    required: "optional",
    kind: "text",
    secret: false,
    note: "Định danh check tương ứng trên dịch vụ theo dõi",
  },
  {
    name: "OPERATIONS_ALERT_EMAIL",
    apps: ["web", "worker"],
    required: "production",
    kind: "email",
    secret: false,
    note: "Hộp thư nhận cảnh báo khi kênh chính im. Bắt buộc ở production vì nó là đường dự phòng duy nhất khi Telegram hỏng (D-S)",
  },
  {
    name: "SENTRY_DSN",
    apps: ALL_APPS,
    required: "optional",
    kind: "url",
    urlProtocols: ["https:"],
    secret: true,
    note: "Đích gửi lỗi phía máy chủ; thiếu thì tắt thu thập",
  },
  {
    name: "NUXT_PUBLIC_SENTRY_DSN",
    apps: ALL_APPS,
    required: "optional",
    kind: "url",
    urlProtocols: ["https:"],
    secret: false,
    note: "Đích gửi lỗi phía trình duyệt",
  },
  {
    name: "CLIENT_ERROR_SAMPLING_RATE",
    apps: ALL_APPS,
    required: "optional",
    kind: "text",
    secret: false,
    note: "Tỉ lệ lấy mẫu lỗi trình duyệt; thiếu thì dùng mặc định trong mã",
  },

  // ---- Worker -------------------------------------------------------------
  {
    name: "BACKUP_ENCRYPTION_KEY",
    apps: ["worker"],
    required: "always",
    kind: "secret",
    secret: true,
    note: "Khoá mã hoá bản sao lưu cơ sở dữ liệu",
  },

  {
    name: "BACKUP_S3_ENDPOINT",
    apps: ["worker"],
    required: "production",
    kind: "url",
    urlProtocols: ["https:"],
    secret: false,
    note: "Điểm cuối tương thích S3 nhận bản sao lưu. Chỉ https: — dump là toàn bộ dữ liệu trẻ trong một tệp di chuyển được",
  },
  {
    name: "BACKUP_S3_BUCKET",
    apps: ["worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Bucket chứa dump. Cấm — NEVER dùng chung bucket với tài sản công khai (BR-BAK-07)",
  },
  {
    name: "BACKUP_S3_REGION",
    apps: ["worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Vùng dùng để ký yêu cầu SigV4",
  },
  {
    name: "BACKUP_S3_PREFIX",
    apps: ["worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Tiền tố khoá đối tượng, ví dụ 'postgres'. Không có mặc định (BR-ENV-03): nó quyết định chỗ dump nằm trong bucket",
  },
  {
    name: "BACKUP_S3_ACCESS_KEY_ID",
    apps: ["worker"],
    required: "production",
    kind: "text",
    secret: false,
    note: "Khoá truy cập RIÊNG cho bucket sao lưu. Không dùng lại AWS_ACCESS_KEY_ID: khoá của tầng lưu trữ ảnh không nên đọc được dump toàn bộ cơ sở dữ liệu",
  },
  {
    name: "BACKUP_S3_SECRET_ACCESS_KEY",
    apps: ["worker"],
    required: "production",
    kind: "secret",
    secret: true,
    note: "Bí mật đi cùng BACKUP_S3_ACCESS_KEY_ID",
  },

  // ---- Vận hành một lần ---------------------------------------------------
  {
    name: "INITIAL_ADMIN_EMAIL",
    apps: ["web"],
    required: "optional",
    kind: "email",
    secret: false,
    note: "Tài khoản quản trị đầu tiên, chỉ đọc khi chạy lệnh gieo dữ liệu",
  },
  {
    name: "INITIAL_ADMIN_PASSWORD",
    apps: ["web"],
    required: "optional",
    kind: "secret",
    secret: true,
    note: "Mật khẩu tài khoản quản trị đầu tiên, chỉ đọc khi chạy lệnh gieo dữ liệu",
  },
  {
    name: "GIT_SHA",
    apps: ALL_APPS,
    required: "optional",
    kind: "text",
    secret: false,
    note: "Mã commit của bản đang chạy; quy trình phát hành đặt vào để truy vết",
  },
  {
    name: "PR_URL",
    apps: ALL_APPS,
    required: "optional",
    kind: "url",
    urlProtocols: ["https:"],
    secret: false,
    note: "Đường dẫn pull request sinh ra bản này, dùng khi điều tra sự cố",
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_SECRET_BYTES = 32;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

function isMandatoryVariable(
  def: EnvVarDef,
  parsed: Map<string, string>,
  isProduction: boolean
): boolean {
  if (def.required === "optional") {
    return false;
  }
  if (def.required === "always") {
    return true;
  }
  if (def.required === "production") {
    return isProduction;
  }
  if (def.required === "when-enabled" && def.enabledBy) {
    return parsed.get(def.enabledBy) === "true";
  }
  return false;
}

/**
 * BR-ENV-13 — kiểm cả **dạng** lẫn **giao thức**.
 *
 * Chỉ kiểm `new URL()` là kiểm nửa vời: mọi scheme đều phân tích được, nên một
 * địa chỉ `https` lọt vào biến chuỗi kết nối Postgres vẫn cho cổng màu xanh.
 */
function checkUrlValidation(
  def: EnvVarDef,
  rawVal: string,
  errors: ValidationError[]
) {
  let parsed: URL;
  try {
    parsed = new URL(rawVal);
  } catch {
    errors.push({ varName: def.name, issue: "Invalid URL format" });
    return;
  }

  const allowed = def.urlProtocols;
  if (!allowed?.length) {
    errors.push({
      varName: def.name,
      issue: "kind url must declare urlProtocols (BR-ENV-13)",
    });
    return;
  }

  if (!allowed.includes(parsed.protocol)) {
    errors.push({
      varName: def.name,
      issue: `Protocol must be one of: ${allowed.join(", ")} (BR-ENV-13)`,
    });
  }
}

function checkKindValidation(
  def: EnvVarDef,
  rawVal: string,
  errors: ValidationError[]
) {
  if (
    def.kind === "secret" &&
    Buffer.byteLength(rawVal, "utf8") < MIN_SECRET_BYTES
  ) {
    errors.push({
      varName: def.name,
      issue: `Secret must be at least ${MIN_SECRET_BYTES} bytes (BR-ENV-11)`,
    });
    return;
  }
  if (def.kind === "url") {
    checkUrlValidation(def, rawVal, errors);
    return;
  }
  if (def.kind === "email" && !EMAIL_REGEX.test(rawVal)) {
    errors.push({ varName: def.name, issue: "Invalid email format" });
    return;
  }
  if (def.kind === "port") {
    const portNum = Number(rawVal);
    if (
      !Number.isInteger(portNum) ||
      portNum < MIN_PORT ||
      portNum > MAX_PORT
    ) {
      errors.push({
        varName: def.name,
        issue: `Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`,
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
 * Validates an already-parsed env file against the registry.
 *
 * Takes a Map rather than reading `process.env` (BR-ENV-06): the shell of the
 * operator running a release must never be able to satisfy a variable that the
 * file on the server is missing.
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

    if (isMandatoryVariable(def, parsed, isProduction) && !hasValue) {
      errors.push({
        varName: def.name,
        issue: `Missing required environment variable for ${app} (${def.required})`,
      });
      continue;
    }

    if (hasValue && value !== undefined) {
      checkKindValidation(def, value, errors);
    }
  }

  // A variable a process does not read is not an error, but it is a smell:
  // usually a rename that only landed in half the places (BR-ENV-10).
  for (const [key] of parsed) {
    if (!registeredNames.has(key)) {
      warnings.push({
        varName: key,
        issue: "Not declared in ENV_REGISTRY; no process reads this name",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
