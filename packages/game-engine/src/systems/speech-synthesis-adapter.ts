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

export class SpeechSynthesisAdapter {
  private isVoiceAvailable = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private currentTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }

  /** Whether a vi-VN voice is detected and ready */
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

      // Slower rate (~0.85-0.9) is optimal for preschoolers (3-6yo)
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = Math.min(Math.max(options.volume ?? 0.85, 0), 1);

      let finished = false;
      const cleanup = () => {
        if (this.currentTimeoutId) {
          clearTimeout(this.currentTimeoutId);
          this.currentTimeoutId = null;
        }
        finished = true;
      };

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        if (!finished) {
          cleanup();
          options.onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        if (!finished) {
          cleanup();
          options.onError?.(e);
          // Still notify onEnd so game loop does not hang indefinitely
          options.onEnd?.();
        }
      };

      // Safety timeout in case browser drops speech onend event
      const timeoutMs = options.timeoutMs ?? 10_000;
      this.currentTimeoutId = setTimeout(() => {
        if (!finished) {
          cleanup();
          this.cancel();
          options.onEnd?.();
        }
      }, timeoutMs);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      options.onError?.(err);
      return false;
    }
  }

  /** Cancel any ongoing speech synthesis */
  cancel(): void {
    if (this.currentTimeoutId) {
      clearTimeout(this.currentTimeoutId);
      this.currentTimeoutId = null;
    }
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe no-op
      }
    }
  }
}
