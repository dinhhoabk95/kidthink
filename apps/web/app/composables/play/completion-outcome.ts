import type { CelebrationTier } from "~/composables/play/use-play-telemetry";

export interface CompletionOutcome {
  readonly celebration: CelebrationTier;
  readonly stars: number | null;
}

/** Tier tạm khi vừa chơi xong: hoàn thành là thắng, chưa biết sao. */
const PROVISIONAL_OUTCOME: CompletionOutcome = {
  celebration: "good",
  stars: null,
};

interface PresentCompletionOptions {
  /** Tải tier/sao từ server; `null` hoặc lỗi nghĩa là giữ tier tạm. */
  readonly fetchOutcome: () => Promise<CompletionOutcome | null>;
  readonly show: (outcome: CompletionOutcome) => void;
  readonly update: (outcome: CompletionOutcome) => void;
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
  } catch {
    // Giữ tier tạm: lỗi mạng không phải lỗi của bé.
  }
}
