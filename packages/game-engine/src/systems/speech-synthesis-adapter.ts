/**
 * SpeechSynthesisAdapter — Web Speech API TTS wrapper for Vietnamese (vi-VN) narration.
 * Implements BR-ENG-10 (non-verbal & audio guidance), BR-A11-11 (multimodal presentation).
 * Pure Vanilla TS — ZERO Vue / Pinia / Reactivity dependencies (BR-ENG-01).
 * Zero microphone / recording permissions — audio output only (BR-CDC-04, BR-AST-04).
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  timeoutMs?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Utterance đang đọc. Giữ tham chiếu trên instance vì Chrome có thể thu gom
 * một utterance chỉ còn biến cục bộ trỏ tới trước khi `onend` bắn — khi đó cổng
 * chờ đọc (`BR-PNR-11`) khoá cử chỉ tới hết hẹn giờ an toàn (Task #274 S8).
 */
interface ActiveUtterance {
  readonly utterance: SpeechSynthesisUtterance;
  /** Kết thúc do bị cắt ngang: báo `onEnd`, không báo `onError`. */
  readonly interrupt: () => void;
}

export class SpeechSynthesisAdapter {
  private isVoiceAvailable = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private hasListeningVoicesChanged = false;
  private active: ActiveUtterance | null = null;

  constructor() {
    this.initVoices();
  }

  /** Initialize voice list and detect vi-VN availability */
  initVoices(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.isVoiceAvailable = false;
      this.isInitialized = true;
      return;
    }

    const checkVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        const viVoice = voices.find((v) => {
          const lang = (v.lang || "").toLowerCase().replace("_", "-");
          return lang === "vi-vn" || lang.startsWith("vi");
        });

        if (viVoice) {
          this.selectedVoice = viVoice;
          this.isVoiceAvailable = true;
        } else {
          this.selectedVoice = null;
          this.isVoiceAvailable = false;
        }
      } catch {
        this.isVoiceAvailable = false;
      }
      this.isInitialized = true;
    };

    checkVoices();

    if (this.hasListeningVoicesChanged) {
      return;
    }
    const synth = window.speechSynthesis;
    // `addEventListener`, không gán `onvoiceschanged`: mỗi `AudioController`
    // mới (GT-000 tạo một cái mỗi vòng) gán đè listener của adapter tạo
    // trước, nên `engine.audio` không bao giờ biết giọng đã về (Task #274 S8).
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", checkVoices);
      this.hasListeningVoicesChanged = true;
    } else if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = checkVoices;
      this.hasListeningVoicesChanged = true;
    }
  }

  /**
   * Có giọng vi-VN hay chưa.
   *
   * `initVoices()` chỉ chạy khi CHƯA khởi tạo lần nào, và `checkVoices` luôn
   * đặt `isInitialized = true` (kể cả khi không có giọng nào), nên hàm này quét
   * `getVoices()` tối đa một lần thêm dù bị gọi mỗi khung hình. Danh sách giọng
   * về muộn thì `voiceschanged` cập nhật, handler gắn đúng một lần.
   */
  hasVietnameseVoice(): boolean {
    if (!this.isInitialized) {
      this.initVoices();
    }
    return this.isVoiceAvailable;
  }

  /** Whether Web Speech API is supported in current environment */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  /**
   * Speak text in Vietnamese.
   * Returns true if utterance queued, false if speech unavailable (triggering visual fallback).
   */
  speak(text: string, options: SpeechOptions = {}): boolean {
    if (!(this.isSupported() && this.hasVietnameseVoice() && text.trim())) {
      return false;
    }

    try {
      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Tốc độ mặc định của bậc dự phòng TTS (Task #273): người đặt việc
      // yêu cầu 2026-09-17 "TTS API tốc độ nhanh hơn" khi mp3 không có —
      // 1.0 là tốc độ đọc tự nhiên của giọng tổng hợp, nhanh hơn 0.9 cũ mà
      // vẫn rõ chữ cho trẻ 3-6 tuổi.
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = Math.min(Math.max(options.volume ?? 0.85, 0), 1);

      // Mọi trạng thái của utterance này nằm trong closure của nó — kể cả
      // hẹn giờ an toàn. Sự kiện trễ của một utterance cũ (Chrome bắn
      // `error: interrupted` sau `cancel()`) chỉ chạm được `finished` của
      // chính nó, Cấm — NEVER chạm hẹn giờ của utterance mới (Task #274 S8).
      let finished = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const finish = (error?: SpeechSynthesisErrorEvent) => {
        if (finished) {
          return;
        }
        finished = true;
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (this.active?.utterance === utterance) {
          this.active = null;
        }
        if (error) {
          options.onError?.(error);
        }
        // onEnd luôn đến, kể cả sau lỗi, để vòng chơi không treo.
        options.onEnd?.();
      };

      utterance.onstart = () => {
        options.onStart?.();
      };
      utterance.onend = () => finish();
      utterance.onerror = (e) => finish(e);

      // `speak()` ném thì chưa có gì để dọn: không active, không hẹn giờ —
      // nhánh `catch` chỉ báo lỗi, người gọi tự rơi xuống bậc sau.
      window.speechSynthesis.speak(utterance);
      if (!finished) {
        this.active = { utterance, interrupt: () => finish() };
        // Safety timeout in case browser drops speech onend event
        const timeoutMs = options.timeoutMs ?? 10_000;
        timeoutId = setTimeout(() => {
          if (finished) {
            return;
          }
          finish();
          this.cancelSynthesis();
        }, timeoutMs);
      }
      return true;
    } catch (err) {
      options.onError?.(err);
      return false;
    }
  }

  /**
   * Dừng mọi lời đang đọc. Utterance bị cắt ngang kết thúc bằng `onEnd` —
   * nó không lỗi, nó bị thay — và sự kiện trễ của trình duyệt cho nó bị bỏ
   * qua.
   */
  cancel(): void {
    const active = this.active;
    this.active = null;
    active?.interrupt();
    this.cancelSynthesis();
  }

  private cancelSynthesis(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe no-op
      }
    }
  }
}
