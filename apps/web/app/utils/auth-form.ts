/**
 * Lỗi và kiểm tra form đăng nhập/đăng ký bằng tiếng Việt (BR-LGN-01, BR-REG-05).
 * Không bao giờ hiện nguyên văn thông báo tiếng Anh của better-auth.
 */

export interface AuthErrorLike {
  readonly code?: string;
  readonly status?: number;
}

const HTTP_TOO_MANY_REQUESTS = 429;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CREDENTIAL_CODES: ReadonlySet<string> = new Set([
  "INVALID_EMAIL_OR_PASSWORD",
  "INVALID_CREDENTIALS",
  "INVALID_PASSWORD",
  "USER_NOT_FOUND",
  "CREDENTIAL_ACCOUNT_NOT_FOUND",
]);

export const LOGIN_FAILED_MESSAGE =
  "Email hoặc mật khẩu chưa đúng. Anh chị kiểm tra lại giúp em nhé.";

export function mapLoginError(error: AuthErrorLike | null | undefined): string {
  if (
    error?.status === HTTP_TOO_MANY_REQUESTS ||
    error?.code === "TOO_MANY_REQUESTS"
  ) {
    return "Anh chị thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.";
  }
  if (error?.code === "EMAIL_NOT_VERIFIED") {
    return "Email chưa được xác minh. Anh chị kiểm tra hộp thư để xác minh trước khi đăng nhập.";
  }
  if (error?.code && CREDENTIAL_CODES.has(error.code)) {
    return LOGIN_FAILED_MESSAGE;
  }
  return LOGIN_FAILED_MESSAGE;
}

export function validateEmailField(value: string): string {
  const email = value.trim();
  if (!email) {
    return "Vui lòng nhập email.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Email chưa đúng định dạng, ví dụ phuhuynh@example.com.";
  }
  return "";
}

export function validateRequiredField(value: string, message: string): string {
  return value.trim() ? "" : message;
}

export function validatePasswordField(
  value: string,
  enforceLength: boolean
): string {
  if (!value) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (enforceLength && value.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  return "";
}

export interface RegisterFormValues {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly acceptTerms: boolean;
  readonly acceptPrivacy: boolean;
}

export type RegisterFieldKey =
  | "name"
  | "email"
  | "password"
  | "acceptTerms"
  | "acceptPrivacy";

export type RegisterFieldErrors = Partial<Record<RegisterFieldKey, string>>;

export function validateRegisterForm(
  values: RegisterFormValues
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const name = validateRequiredField(
    values.name,
    "Vui lòng nhập tên phụ huynh."
  );
  const email = validateEmailField(values.email);
  const password = validatePasswordField(values.password, true);
  if (name) {
    errors.name = name;
  }
  if (email) {
    errors.email = email;
  }
  if (password) {
    errors.password = password;
  }
  if (!values.acceptTerms) {
    errors.acceptTerms = "Vui lòng đồng ý với Điều khoản sử dụng.";
  }
  if (!values.acceptPrivacy) {
    errors.acceptPrivacy = "Vui lòng đồng ý với Chính sách quyền riêng tư.";
  }
  return errors;
}
