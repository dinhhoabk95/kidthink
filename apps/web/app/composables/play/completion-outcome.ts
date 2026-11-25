import type {
  CelebrationTier,
  SessionCompleteSticker,
} from "~/composables/play/use-play-telemetry";

export interface CompletionOutcome {
  readonly celebration: CelebrationTier;
  readonly stars: number | null;
  readonly sticker?: SessionCompleteSticker | null;
}

/** Tier tạm khi vừa chơi xong: hoàn thành là thắng, chưa biết sao. */
const PROVISIONAL_OUTCOME: CompletionOutcome = {
  celebration: "good",
  stars: null,
  sticker: null,
};

/** `/complete` trả 401 sau khi đã thử làm mới phiên: tiến độ chưa lưu (BR-FBK-19). */
export class CompletionUnsavedError extends Error {
  constructor() {
    super("completion_unsaved");
    this.name = "CompletionUnsavedError";
  }
}

interface PresentCompletionOptions {
  /** Tải tier/sao từ server; `null` hoặc lỗi nghĩa là giữ tier tạm. */
  readonly fetchOutcome: () => Promise<CompletionOutcome | null>;
  readonly show: (outcome: CompletionOutcome) => void;
  readonly update: (outcome: CompletionOutcome) => void;
  /** Tiến độ chưa lưu được (phiên hết hạn): báo thân thiện, giữ tier tạm. */
  readonly unsaved?: () => void;
}

/**
 * Hiện modal chiến thắng ngay, rồi cập nhật tier/sao khi server trả lời.
 * Mạng chậm hay offline không làm bảng đơ và không tụt xuống `nice_try`
 * (Task #313 B4).
 */
export async function presentCompletion(
  options: PresentCompletionOptions
): Promise<void> {
  options.show(PROVISIONAL_OUTCOME);
  try {
    const outcome = await options.fetchOutcome();
    if (outcome) {
      options.update(outcome);
    }
  } catch (err) {
    // Giữ tier tạm: lỗi mạng không phải lỗi của bé.
    if (err instanceof CompletionUnsavedError) {
      options.unsaved?.();
    }
  }
}

const HTTP_UNAUTHORIZED = 401;

export interface FinishAttempt<T> {
  readonly ok: boolean;
  readonly statusCode?: number;
  readonly data?: T;
}

/**
 * Gọi `/complete`; nhận 401 thì làm mới phiên rồi thử lại đúng một lần.
 * Vẫn 401 ⇒ `CompletionUnsavedError` (BR-FBK-19). Lỗi khác trả nguyên kết quả.
 */
export async function finishWithSessionRefresh<R extends FinishAttempt<object>>(
  finish: () => Promise<R>,
  refreshSession: (() => Promise<boolean>) | undefined
): Promise<R> {
  let result = await finish();
  if (result.ok || result.statusCode !== HTTP_UNAUTHORIZED) {
    return result;
  }
  if (refreshSession && (await refreshSession())) {
    result = await finish();
  }
  if (!result.ok && result.statusCode === HTTP_UNAUTHORIZED) {
    throw new CompletionUnsavedError();
  }
  return result;
}

/** Chặn chạy hai lần cho cùng một khoá (BR-FBK-19): `true` ở lần đầu. */
export function createOnceGuard(): (key: string) => boolean {
  let last: string | null = null;
  return (key) => {
    if (last === key) {
      return false;
    }
    last = key;
    return true;
  };
}
