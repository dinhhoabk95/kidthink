import { AppError, type AuthErrorDetails } from "./errors";

/**
 * Lớp exception theo model, cùng tư tưởng `ModelNotFoundException` và
 * `ValidationException` của Laravel: tầng service ném lỗi **domain**, không
 * dựng response. `AppError` đã là H3Error hạng nhất nên handler chung ở
 * `apps/*` render, route không cần try/catch.
 *
 * Mọi lớp ở đây đều kế thừa `AppError`, nên mã lỗi vẫn phải có trong registry
 * `AUTH_ERROR_DEFINITIONS` (ERROR-CODES `BR-ERR-01`).
 */

/** Một trường không hợp lệ — hình dạng `details.fields[]` của ERROR-CODES §7.7. */
export interface ValidationFieldError {
  readonly path: string;
  readonly message: string;
}

/**
 * Lỗi validate dữ liệu vào. Tương đương `ValidationException` của Laravel.
 *
 * Body luôn là `details.fields[]` — đúng một hình dạng cho mọi route, để client
 * có một đường xử lý duy nhất (ERROR-CODES §7.7).
 *
 * Cố ý KHÔNG nhận `ZodError`: `packages/auth` không phụ thuộc zod. Bộ chuyển
 * từ ZodError sang `fields[]` nằm ở tầng app (`server/utils/api-error.ts`).
 */
export class ValidationError extends AppError {
  readonly fields: readonly ValidationFieldError[];

  constructor(fields: readonly ValidationFieldError[]) {
    super("VALIDATION_FAILED", { fields });
    this.name = "ValidationError";
    this.fields = fields;
  }

  /** Lỗi một trường — dùng cho ràng buộc nghiệp vụ ngoài schema. */
  static field(path: string, message: string): ValidationError {
    return new ValidationError([{ path, message }]);
  }
}

/**
 * Không tìm thấy record, hoặc record không thuộc caller.
 * Tương đương `ModelNotFoundException` của Laravel.
 *
 * `model` và `key` chỉ để **log phía server**. ERROR-CODES `BR-ERR-03` cấm tên
 * bảng và id nội bộ xuất hiện trong body, nên hai trường này ❌ NEVER được đưa
 * vào `details` — `toResponse()` của `AppError` chỉ thấy `details`, và ở đây
 * `details` là thông báo hướng người dùng.
 *
 * ERROR-CODES `BR-ERR-05`: record của người khác cũng trả về lớp này (404),
 * không phải FORBIDDEN — 403 xác nhận record tồn tại.
 */
export class ModelNotFoundError extends AppError {
  readonly model: string;
  readonly key?: string | number;

  constructor(
    model: string,
    message: string,
    key?: string | number,
    details?: AuthErrorDetails
  ) {
    super("NOT_FOUND", details ?? message);
    this.name = "ModelNotFoundError";
    this.model = model;
    this.key = key;
  }
}

/** Lỗi gắn với một model — mang ngữ cảnh chỉ dành cho log phía server. */
export interface ModelBoundError {
  readonly model: string;
  readonly key?: string | number;
}

export function isModelBoundError(error: unknown): error is ModelBoundError {
  return (
    error instanceof AppError &&
    typeof (error as AppError & { model?: unknown }).model === "string"
  );
}

/**
 * Ngữ cảnh log cho lỗi gắn model. Handler chung ghi cái này ra log server và
 * ❌ NEVER đưa vào body response (ERROR-CODES `BR-ERR-03`).
 */
export function modelErrorContext(
  error: ModelBoundError
): Readonly<Record<string, unknown>> {
  return { model: error.model, key: error.key ?? null };
}

/**
 * Sinh lớp not-found cho một model. Các lớp con chỉ khác nhau ở (model,
 * thông báo), nên factory là chỗ duy nhất giữ cặp đó — thông báo tiếng Việt
 * hiện đang bị gõ lại ở hàng trăm lời gọi `appError("NOT_FOUND", "…")`.
 */
function defineModelNotFound(
  className: string,
  model: string,
  message: string
) {
  return class extends ModelNotFoundError {
    constructor(key?: string | number) {
      super(model, message, key);
      this.name = className;
    }
  };
}

export const ChildNotFoundError = defineModelNotFound(
  "ChildNotFoundError",
  "child_profiles",
  "Không tìm thấy hồ sơ bé."
);
export const UserNotFoundError = defineModelNotFound(
  "UserNotFoundError",
  "users",
  "Không tìm thấy người dùng."
);
export const LessonNotFoundError = defineModelNotFound(
  "LessonNotFoundError",
  "lessons",
  "Không tìm thấy bài học."
);
export const ActivityNotFoundError = defineModelNotFound(
  "ActivityNotFoundError",
  "activities",
  "Không tìm thấy hoạt động."
);
export const GameLevelNotFoundError = defineModelNotFound(
  "GameLevelNotFoundError",
  "game_levels",
  "Không tìm thấy màn chơi."
);
export const CurriculumNotFoundError = defineModelNotFound(
  "CurriculumNotFoundError",
  "curricula",
  "Không tìm thấy chương trình học."
);
export const WorksheetNotFoundError = defineModelNotFound(
  "WorksheetNotFoundError",
  "worksheets",
  "Không tìm thấy phiếu bài tập."
);
export const LessonPlanNotFoundError = defineModelNotFound(
  "LessonPlanNotFoundError",
  "lesson_plans",
  "Không tìm thấy giáo án."
);
export const PersonalCurriculumNotFoundError = defineModelNotFound(
  "PersonalCurriculumNotFoundError",
  "personal_curricula",
  "Không tìm thấy lộ trình học cá nhân."
);
export const CustomGameNotFoundError = defineModelNotFound(
  "CustomGameNotFoundError",
  "custom_games",
  "Không tìm thấy trò chơi tùy chỉnh."
);
export const OrderNotFoundError = defineModelNotFound(
  "OrderNotFoundError",
  "payment_orders",
  "Không tìm thấy đơn hàng."
);
export const SubscriptionNotFoundError = defineModelNotFound(
  "SubscriptionNotFoundError",
  "subscriptions",
  "Không tìm thấy gói thuê bao định kỳ."
);
export const EntitlementNotFoundError = defineModelNotFound(
  "EntitlementNotFoundError",
  "user_entitlements",
  "Không tìm thấy quyền cần thu hồi."
);
export const ExportNotFoundError = defineModelNotFound(
  "ExportNotFoundError",
  "export_jobs",
  "Không tìm thấy yêu cầu xuất file."
);

/**
 * Phiên chơi có mã riêng `SESSION_NOT_FOUND` trong ERROR-CODES §7.5, không
 * dùng `NOT_FOUND` chung — nên không đi qua `ModelNotFoundError`.
 */
export class PlaySessionNotFoundError extends AppError {
  readonly model = "play_sessions";
  readonly key?: string | number;

  constructor(key?: string | number) {
    super("SESSION_NOT_FOUND", "Không tìm thấy phiên chơi.");
    this.name = "PlaySessionNotFoundError";
    this.key = key;
  }
}
