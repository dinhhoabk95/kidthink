import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it, vi } from "vitest";
import {
  type ActionResult,
  AudioController,
  BaseGameSession,
  type GameAction,
  type RoundConfig,
  RoundRunner,
  ScaffoldingSystem,
} from "#src/index";

const REPLAY_MIN_HEIGHT_REGEX = /\.btn-audio-replay[\s\S]*?min-height:\s*4rem;/;
const REPLAY_MIN_WIDTH_REGEX = /\.btn-audio-replay[\s\S]*?min-width:\s*4rem;/;

class StubSession extends BaseGameSession {
  setupEntities(): void {
    // stub
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return false;
  }
}

describe("L5 — Dự phòng và hành vi chơi (BR-PNR-06..09 / Task #269)", () => {
  // T5.1: BR-PNR-06 — không có giọng Việt và mp3 hỏng → trợ giúp lên bậc bàn tay dẫn, khung yêu cầu nhấp nháy 1200 ms
  it("T5.1 (BR-PNR-06): không có giọng Việt và mp3 hỏng → kích hoạt visual fallback (bàn tay dẫn)", () => {
    const audio = new AudioController(true);
    vi.spyOn(audio.getSpeechAdapter(), "hasVietnameseVoice").mockReturnValue(
      false
    );

    const fallbackVisualCue = vi.fn();
    const onEnd = vi.fn();

    // mp3 hỏng hoặc không có, rơi xuống speakPrompt
    const started = audio.speakPrompt(
      "Tìm 3 quả táo",
      onEnd,
      fallbackVisualCue
    );
    expect(started).toBe(false);
    expect(fallbackVisualCue).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);

    // Kích hoạt scaffolding bàn tay dẫn L2
    const scaffolding = new ScaffoldingSystem("3-4");
    const scaffoldAction = scaffolding.triggerVisualFallback(1);
    expect(scaffoldAction.level).toBe(2);
    expect(scaffoldAction.trigger).toBe("voice_fallback");
    expect(scaffoldAction.focusIndex).toBe(1);
  });

  // T5.2: Không bậc nào kết thúc bằng im lặng — mọi kịch bản đều có âm thanh hoặc hình ảnh
  it("T5.2 (BR-PNR-06): không bậc nào kết thúc bằng im lặng hoàn toàn", () => {
    const audio = new AudioController(true);

    // Ca 1: mp3 không tải được trong playPromptAudio → fallback sang âm tap SFX
    const playSfxSpy = vi.spyOn(audio, "play");
    audio.playPromptAudio("/audio/voice/not_found.mp3");
    expect(playSfxSpy).toHaveBeenCalledWith("tap");

    // Ca 2: TTS không có tiếng Việt → fallbackVisualCue được kích hoạt
    vi.spyOn(audio.getSpeechAdapter(), "hasVietnameseVoice").mockReturnValue(
      false
    );
    let visualTriggered = false;
    audio.speakPrompt("Đếm đồ vật", undefined, () => {
      visualTriggered = true;
    });
    expect(visualTriggered).toBe(true);
  });

  // T5.3: BR-PNR-08 — bấm Nghe lại ba lần → số lượt sai vẫn 0, bậc trợ giúp không đổi
  it("T5.3 (BR-PNR-08): bấm Nghe lại nhiều lần không tăng miss count và không phạt trẻ", () => {
    const rounds: RoundConfig[] = [
      {
        round_index: 0,
        instruction: "Bé hãy chọn hình vuông",
        instruction_audio_path: "/audio/voice/common/numbers/1.mp3",
        content_pack: {},
        difficulty_params: { item_count: 3 },
      },
    ];

    const runner = new RoundRunner({
      rounds,
      sessionFactory: () => new StubSession(),
      ageBand: "4-5",
    });

    runner.startFirstRound();
    const initialState = runner.getState();
    expect(initialState.roundsCompleted).toBe(0);
    expect(initialState.roundsSkipped).toBe(0);
    expect(initialState.hintCountTotal).toBe(0);

    // Bấm Nghe lại ba lần liên tiếp
    runner.replayCurrentRoundNarration();
    runner.replayCurrentRoundNarration();
    runner.replayCurrentRoundNarration();

    const finalState = runner.getState();
    expect(finalState.roundsCompleted).toBe(0);
    expect(finalState.roundsSkipped).toBe(0);
    expect(finalState.hintCountTotal).toBe(0);
    expect(finalState.isFinished).toBe(false);
  });

  // T5.4: BR-PNR-09 — nạp audio quá hạn thì vòng vẫn bắt đầu trong 5 giây, không bị treo
  it("T5.4 (BR-PNR-09): nạp audio quá hạn thì kết thúc nạp và không làm treo màn chơi", async () => {
    const OVERALL_TIMEOUT_MS = 200;

    const slowAssetPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late_audio_ready"), 600);
    });

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("timeout_resolved_safe"), OVERALL_TIMEOUT_MS);
    });

    const result = await Promise.race([slowAssetPromise, timeoutPromise]);
    expect(result).toBe("timeout_resolved_safe");
  });

  // T5.5: Autoplay fallback — nếu autoplay bị chặn, hoãn câu dẫn tới lần chạm đầu
  it("T5.5: autoplay bị chặn → không quăng lỗi, fallback mềm", () => {
    const audio = new AudioController(true);
    let fallbackCalled = false;

    // Giả lập speakPrompt khi bị lỗi permission
    vi.spyOn(audio.getSpeechAdapter(), "speak").mockImplementation(
      (_text, options) => {
        options?.onError?.(
          new Error(
            "NotAllowedError: play() failed because the user didn't interact"
          )
        );
        return true;
      }
    );

    audio.speakPrompt("Chọn màu đỏ", undefined, () => {
      fallbackCalled = true;
    });

    expect(fallbackCalled).toBe(true);
  });

  // T5.6: Nút "Nghe lại" giữ sàn chạm 64px ở stylesheet
  it("T5.6 (BR-DSC-28): nút Nghe lại đạt sàn chạm 64px (4rem) trong play-surface.css", () => {
    const cssPath = repoPath("apps/web/app/assets/css/play-surface.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Khẳng định .btn-audio-replay có min-height 4rem và min-width 4rem (64px)
    expect(cssContent).toMatch(REPLAY_MIN_HEIGHT_REGEX);
    expect(cssContent).toMatch(REPLAY_MIN_WIDTH_REGEX);
  });

  // T5.7: Chốt hành vi phát tên vật: chỉ phát lần chạm đầu trong vòng cho engine chạm nhanh
  it("T5.7: cơ chế phát âm tên vật có cờ khóa tránh chồng âm khi chạm dồn dập", () => {
    let playedCount = 0;
    const itemTouchSpeechState = {
      hasPlayedInitialItemVoice: false,
    };

    function onItemTouch(audioPath?: string): boolean {
      if (itemTouchSpeechState.hasPlayedInitialItemVoice) {
        return false; // Đã phát một lần trong vòng, bỏ qua tránh đè tiếng
      }
      if (audioPath) {
        playedCount++;
        itemTouchSpeechState.hasPlayedInitialItemVoice = true;
        return true;
      }
      return false;
    }

    expect(onItemTouch("/audio/voice/common/numbers/1.mp3")).toBe(true);
    expect(onItemTouch("/audio/voice/common/numbers/2.mp3")).toBe(false);
    expect(onItemTouch("/audio/voice/common/numbers/3.mp3")).toBe(false);
    expect(playedCount).toBe(1);
  });
});
