import { SpeechSynthesisAdapter } from "@mindkid/game-engine";
import { onUnmounted } from "vue";

export interface UseSpeechReturn {
  readonly speak: (text: string) => boolean;
  readonly cancel: () => void;
}

/**
 * Đọc to câu dẫn tiếng Việt trên bề mặt trẻ (`BR-CCE-08`, `BR-ENG-10`, `BR-A11-11`).
 *
 * Dùng `SpeechSynthesisAdapter` của game-engine khi có giọng `vi-VN`, và dự phòng
 * sang `window.speechSynthesis` trực tiếp cho môi trường trình duyệt/test chưa nạp
 * danh sách giọng đầy đủ.
 */
export function useSpeech(): UseSpeechReturn {
  let adapter: SpeechSynthesisAdapter | null = null;

  function getAdapter(): SpeechSynthesisAdapter {
    adapter ??= new SpeechSynthesisAdapter();
    return adapter;
  }

  function speak(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    const instance = getAdapter();
    if (instance.speak(trimmed)) {
      return true;
    }
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.speechSynthesis?.speak === "function" &&
      typeof SpeechSynthesisUtterance !== "undefined"
    ) {
      try {
        window.speechSynthesis.cancel?.();
        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.lang = "vi-VN";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  function cancel(): void {
    adapter?.cancel();
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.speechSynthesis?.cancel === "function"
    ) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Bỏ qua lỗi trình duyệt khi huỷ đọc
      }
    }
  }

  onUnmounted(() => {
    adapter?.dispose();
    adapter = null;
  });

  return { speak, cancel };
}
