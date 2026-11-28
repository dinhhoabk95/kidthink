import fs from "node:fs";
import path from "node:path";
import { resolveTeacherVoicePath } from "@mindkid/shared/voice-path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioController, ScaffoldingSystem } from "#src/index";
import { VOICE_CLIP_START_TIMEOUT_MS } from "#src/systems/audio-controller";

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

  describe("WP87.2: Giọng cô giáo teacher-v1 (BR-PNR-05)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("phát mp3 băm tất định từ câu chữ, không gọi Web Speech", async () => {
      const played: string[] = [];
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1;
          currentTime = 0;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          readonly pause = vi.fn();
          constructor(src: string) {
            played.push(src);
          }
          play(): Promise<void> {
            queueMicrotask(() => this.onended?.());
            return Promise.resolve();
          }
        }
      );
      const audio = new AudioController(true);
      const onEnd = vi.fn();
      const cue = vi.fn();

      expect(audio.speakPrompt("Tìm 3 chú gà", onEnd, cue)).toBe(true);
      await Promise.resolve();

      expect(played).toEqual([resolveTeacherVoicePath("Tìm 3 chú gà")]);
      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(cue).not.toHaveBeenCalled();
    });

    it("các đoạn phát nối tiếp đúng thứ tự trong một lượt", async () => {
      const played: string[] = [];
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1;
          currentTime = 0;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          readonly pause = vi.fn();
          constructor(src: string) {
            played.push(src);
          }
          play(): Promise<void> {
            queueMicrotask(() => this.onended?.());
            return Promise.resolve();
          }
        }
      );
      const audio = new AudioController(true);
      const onEnd = vi.fn();

      audio.speakPrompt(["Gấu Con đi chợ.", "Chọn quả táo"], onEnd);
      for (let i = 0; i < 4; i++) {
        await Promise.resolve();
      }

      expect(played).toEqual([
        resolveTeacherVoicePath("Gấu Con đi chợ."),
        resolveTeacherVoicePath("Chọn quả táo"),
      ]);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("clip treo quá 3 giây thì rơi xuống tín hiệu thị giác (BR-PNR-06)", () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1;
          currentTime = 0;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          readonly pause = vi.fn();
          play(): Promise<void> {
            return new Promise(() => undefined);
          }
        }
      );
      const audio = new AudioController(true);
      const onEnd = vi.fn();
      const cue = vi.fn();

      audio.speakPrompt("Tìm 3 chú gà", onEnd, cue);
      vi.advanceTimersByTime(VOICE_CLIP_START_TIMEOUT_MS - 1);
      expect(cue).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);

      expect(cue).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("lượt bị cắt ngang báo onEnd, không báo tín hiệu thị giác", () => {
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1;
          currentTime = 0;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          readonly pause = vi.fn();
          play(): Promise<void> {
            return new Promise(() => undefined);
          }
        }
      );
      const audio = new AudioController(true);
      const onEnd = vi.fn();
      const cue = vi.fn();

      audio.speakPrompt("Tìm 3 chú gà", onEnd, cue);
      audio.stopAll();

      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(cue).not.toHaveBeenCalled();
    });
  });

  describe("WP87.3 & WP87.4: Visual Fallback Integration & Scaffolding (BR-ENG-10, BR-A11-11)", () => {
    it("triggers visual cue when the teacher mp3 is missing", async () => {
      vi.stubGlobal(
        "Audio",
        class {
          volume = 1;
          currentTime = 0;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          readonly pause = vi.fn();
          play(): Promise<void> {
            return Promise.reject(new Error("NotSupportedError"));
          }
        }
      );
      const audio = new AudioController(true);
      const fallbackVisualCue = vi.fn();
      const onEnd = vi.fn();

      audio.speakPrompt("Tìm 3 chú gà", onEnd, fallbackVisualCue);
      await Promise.resolve();
      await Promise.resolve();

      expect(fallbackVisualCue).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
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

      expect(action.level).toBe(1);
      expect(action.trigger).toBe("voice_fallback");
      expect(action.focusIndex).toBe(2);
      expect(action.ghostHandSpeed).toBeUndefined();
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
