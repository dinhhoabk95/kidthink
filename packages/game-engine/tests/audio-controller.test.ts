import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AudioController,
  ScaffoldingSystem,
  SpeechSynthesisAdapter,
} from "#src/index";

const FORBIDDEN_MIC_PATTERNS = [
  /getUserMedia/,
  /MediaRecorder/,
  /webkitGetUserMedia/,
  /createMediaStreamSource/,
];

describe("Task #87 — Audio Runtime Delivery & Fallback (BR-ENG-10, BR-ENG-16, BR-CDC-04)", () => {
  let savedWindow: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedWindow = (globalThis as any).window;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).window = savedWindow;
  });

  describe("WP87.1: AudioController Web Audio & Gain Ceiling (BR-ENG-16)", () => {
    it("initializes with enabled state and safe master ceiling", () => {
      const audio = new AudioController(true);
      expect(audio.isEnabled()).toBe(true);

      audio.setEnabled(false);
      expect(audio.isEnabled()).toBe(false);
    });

    it("manages AudioBuffer cache for offline assets", () => {
      const audio = new AudioController(true);
      expect(audio.hasAudioBuffer("chime")).toBe(false);

      const dummyBuffer = {} as AudioBuffer;
      audio.cacheAudioBuffer("chime", dummyBuffer);

      expect(audio.hasAudioBuffer("chime")).toBe(true);
      expect(audio.getAudioBuffer("chime")).toBe(dummyBuffer);

      audio.clearBufferCache();
      expect(audio.hasAudioBuffer("chime")).toBe(false);
    });

    it("plays non-punitive amber soft feedback sound (BR-ENG-07)", () => {
      const audio = new AudioController(true);
      const playSpy = vi.spyOn((audio as any).sfxEngine, "play");

      audio.playSoftFeedbackSound();
      expect(playSpy).toHaveBeenCalledWith("amber_soft");

      audio.playPopCelebrateSound();
      expect(playSpy).toHaveBeenCalledWith("pop_celebrate");

      audio.playLevelCelebrateSound();
      expect(playSpy).toHaveBeenCalledWith("level_celebrate");

      audio.playTapSound();
      expect(playSpy).toHaveBeenCalledWith("tap");

      audio.playExitSound();
      expect(playSpy).toHaveBeenCalledWith("longpress_exit");
    });

    it("suppresses sound output when disabled", () => {
      const audio = new AudioController(false);
      const playSpy = vi.spyOn((audio as any).sfxEngine, "play");

      audio.playSoftFeedbackSound();
      audio.playPopCelebrateSound();
      audio.playLevelCelebrateSound();

      expect(playSpy).not.toHaveBeenCalled();
    });
  });

  describe("WP87.2: SpeechSynthesisAdapter & Vietnamese Voice Detection", () => {
    it("detects vi-VN voice when present in system voices", () => {
      const mockVoices: Partial<SpeechSynthesisVoice>[] = [
        { name: "Alex", lang: "en-US" },
        { name: "Mai", lang: "vi-VN" },
      ];

      (globalThis as any).window = {
        speechSynthesis: {
          getVoices: vi.fn().mockReturnValue(mockVoices),
          speak: vi.fn(),
          cancel: vi.fn(),
          onvoiceschanged: null,
        },
      };
      (globalThis as any).SpeechSynthesisUtterance = class {
        lang = "";
        text = "";
        rate = 1;
        pitch = 1;
        volume = 1;
        voice = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((err: any) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      };

      const adapter = new SpeechSynthesisAdapter();
      expect(adapter.hasVietnameseVoice()).toBe(true);
      expect(adapter.isSupported()).toBe(true);
    });

    it("returns false when device lacks vi-VN voice (Lenovo Tab M8 scenario)", () => {
      const mockVoices: Partial<SpeechSynthesisVoice>[] = [
        { name: "English Voice", lang: "en-US" },
        { name: "French Voice", lang: "fr-FR" },
      ];

      (globalThis as any).window = {
        speechSynthesis: {
          getVoices: vi.fn().mockReturnValue(mockVoices),
          speak: vi.fn(),
          cancel: vi.fn(),
        },
      };

      const adapter = new SpeechSynthesisAdapter();
      expect(adapter.hasVietnameseVoice()).toBe(false);

      const fallbackTriggered = adapter.speak("Đếm số quả táo");
      expect(fallbackTriggered).toBe(false);
    });

    it("handles speech errors gracefully without throwing", () => {
      const mockVoices: Partial<SpeechSynthesisVoice>[] = [
        { name: "Linh", lang: "vi-VN" },
      ];

      let utteranceInstance: any = null;
      (globalThis as any).SpeechSynthesisUtterance = class {
        lang = "";
        text = "";
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((err: any) => void) | null = null;
        constructor(text: string) {
          this.text = text;
          utteranceInstance = this;
        }
      };

      (globalThis as any).window = {
        speechSynthesis: {
          getVoices: vi.fn().mockReturnValue(mockVoices),
          speak: vi.fn().mockImplementation(() => {
            setTimeout(() => {
              utteranceInstance?.onerror?.({ error: "not-allowed" });
            }, 10);
          }),
          cancel: vi.fn(),
        },
      };

      const adapter = new SpeechSynthesisAdapter();
      const onError = vi.fn();
      const onEnd = vi.fn();

      const started = adapter.speak("Hãy chọn hình vuông", { onError, onEnd });
      expect(started).toBe(true);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onError).toHaveBeenCalled();
          expect(onEnd).toHaveBeenCalled();
          resolve();
        }, 50);
      });
    });

    it("safely handles timeout if onend event is dropped by browser", () => {
      vi.useFakeTimers();

      const mockVoices: Partial<SpeechSynthesisVoice>[] = [
        { name: "Linh", lang: "vi-VN" },
      ];

      (globalThis as any).SpeechSynthesisUtterance = class {
        text = "";
        constructor(text: string) {
          this.text = text;
        }
      };
      (globalThis as any).window = {
        speechSynthesis: {
          getVoices: vi.fn().mockReturnValue(mockVoices),
          speak: vi.fn(),
          cancel: vi.fn(),
        },
      };

      const adapter = new SpeechSynthesisAdapter();
      const onEnd = vi.fn();

      adapter.speak("Chỉ dẫn dài", { onEnd, timeoutMs: 1000 });
      expect(onEnd).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(onEnd).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("WP87.3 & WP87.4: Visual Fallback Integration & Scaffolding (BR-ENG-10, BR-A11-11)", () => {
    it("triggers visual cue immediately when voice is unavailable", () => {
      const audio = new AudioController(true);
      vi.spyOn(audio, "isVoiceAvailable").mockReturnValue(false);
      vi.spyOn(audio.getSpeechAdapter(), "hasVietnameseVoice").mockReturnValue(
        false
      );

      const fallbackVisualCue = vi.fn();
      const onEnd = vi.fn();

      const result = audio.speakPrompt(
        "Tìm 3 chú gà",
        onEnd,
        fallbackVisualCue
      );

      expect(result).toBe(false);
      expect(fallbackVisualCue).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("triggers visual cue when audio is disabled", () => {
      const audio = new AudioController(false);
      const fallbackVisualCue = vi.fn();
      const onEnd = vi.fn();

      const result = audio.speakPrompt(
        "Tìm 3 chú gà",
        onEnd,
        fallbackVisualCue
      );

      expect(result).toBe(false);
      expect(fallbackVisualCue).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("ScaffoldingSystem triggers L2 ghost hand visual fallback immediately", () => {
      const scaffolding = new ScaffoldingSystem("3-4");
      const action = scaffolding.triggerVisualFallback(2);

      expect(action.level).toBe(2);
      expect(action.trigger).toBe("voice_fallback");
      expect(action.focusIndex).toBe(2);
      expect(action.ghostHandSpeed).toBe(1.0);
    });
  });

  describe("WP87.4: Zero Microphone / Recording Check (BR-CDC-04, BR-AST-04)", () => {
    it("guarantees zero calls to getUserMedia or MediaRecorder across source code", () => {
      const srcDir = path.resolve(import.meta.dirname, "../src");

      const scanDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (file.endsWith(".ts")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            for (const pattern of FORBIDDEN_MIC_PATTERNS) {
              expect(content).not.toMatch(pattern);
            }
          }
        }
      };

      scanDir(srcDir);
    });
  });
});
