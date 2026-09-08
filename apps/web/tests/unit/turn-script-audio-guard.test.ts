import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it, vi } from "vitest";
import { usePlayAudio } from "~/composables/play/use-play-audio";

const GAME_VIEWPORT_VSHOW_REGEX =
  /class="game-viewport"[^>]*v-show="!\(isLoading \|\| errorMessage\)"/;

describe("Turn Script Invariants — BR-ETS-02 & BR-ETS-03", () => {
  describe("BR-ETS-02 (Cấm nhận chạm lúc còn preload/loading)", () => {
    it("bề mặt chơi [code].vue bọc game-viewport bằng v-show='!(isLoading || errorMessage)', nuốt cử chỉ lúc preload", () => {
      const pagePath = repoPath("apps/web/app/pages/play/[code].vue");
      const content = readFileSync(pagePath, "utf-8");

      // Bắt buộc game-viewport phải được bảo vệ bởi guard !(isLoading || errorMessage)
      expect(content).toContain('v-show="!(isLoading || errorMessage)"');
      expect(content).toMatch(GAME_VIEWPORT_VSHOW_REGEX);
    });
  });

  describe("BR-ETS-03 (Đề tự phát một lần & dừng lời cũ khi bấm nghe lại)", () => {
    it("nghe lại giữa lúc đang đọc thì dừng lời cũ trước, không bao giờ có hai HTMLAudioElement cùng sống", () => {
      const audioInstances: Array<{
        src: string;
        pause: () => void;
        currentTime: number;
        play: () => Promise<void>;
      }> = [];

      class MockAudio {
        src: string;
        currentTime = 0;
        onended: (() => void) | null = null;
        readonly pause = vi.fn();
        readonly play = vi.fn().mockResolvedValue(undefined);

        constructor(src: string) {
          this.src = src;
          audioInstances.push(this);
        }
      }

      vi.stubGlobal("Audio", MockAudio);

      const mockEngine = {
        audio: {
          speakPrompt: vi.fn(),
        },
      };

      const {
        setInstructionAudio,
        playInstructionNarration,
        stopNarrationAudio,
      } = usePlayAudio({
        getEngine: () => mockEngine as never,
        onFallbackCue: vi.fn(),
      });

      setInstructionAudio("/audio/test_instruction_1.mp3");

      // Phát lần đầu khi vào nhịp N2
      playInstructionNarration("Bé đếm số táo nhé");
      expect(audioInstances).toHaveLength(1);
      const firstAudio = audioInstances[0];
      expect(firstAudio?.src).toBe("/audio/test_instruction_1.mp3");
      expect(firstAudio?.play).toHaveBeenCalledTimes(1);
      expect(firstAudio?.pause).not.toHaveBeenCalled();

      // Trẻ bấm nghe lại giữa chừng (khi firstAudio chưa kết thúc)
      playInstructionNarration("Bé đếm số táo nhé");

      // Invariant: Lời đang phát bị dừng trước khi lời mới phát lại
      expect(firstAudio?.pause).toHaveBeenCalledTimes(1);
      expect(firstAudio?.currentTime).toBe(0);

      // Audio mới được tạo và phát từ đầu
      expect(audioInstances).toHaveLength(2);
      const secondAudio = audioInstances[1];
      expect(secondAudio?.play).toHaveBeenCalledTimes(1);
      expect(secondAudio?.pause).not.toHaveBeenCalled();

      // Dừng chủ động
      stopNarrationAudio();
      expect(secondAudio?.pause).toHaveBeenCalledTimes(1);
      expect(secondAudio?.currentTime).toBe(0);

      vi.unstubAllGlobals();
    });
  });
});
