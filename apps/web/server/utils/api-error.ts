import { ValidationError, type ValidationFieldError } from "@mindkid/auth";
import type { ZodError } from "zod";

/**
 * Bộ chuyển ZodError → `details.fields[]` của ERROR-CODES §7.7.
 *
 * `ValidationError` sống ở `packages/auth` và cố ý không biết zod; chỗ nối
 * giữa hai bên nằm ở đây, tầng app — đúng một chỗ cho cả `server/api/**`.
 *
 * ❌ NEVER dựng body VALIDATION_FAILED bằng tay trong route. Trước đây tầng API
 * có bốn hình dạng khác nhau (`data: issues[]`, `details.errors`,
 * `details.fields[]`, và `message` trơn) nên client phải đoán; §7.7 chỉ công
 * nhận một hình dạng.
 */
export function toValidationFields(error: ZodError): ValidationFieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/** Ném `VALIDATION_FAILED` 422 kèm `details.fields[]` từ một ZodError. */
export function throwValidationError(error: ZodError): never {
  throw new ValidationError(toValidationFields(error));
}
