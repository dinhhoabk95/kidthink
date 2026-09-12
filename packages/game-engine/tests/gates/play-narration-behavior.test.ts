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

  // T5.2: Không bậc nào kết thúc bằng im lặng — đo trên chính đường phát của
  // RoundRunner, không đo trên một lời gọi AudioController rời.
  it("T5.2 (BR-PNR-06): mp3 hỏng và không có giọng Việt thì nhịp mở vòng vẫn chạm tới tín hiệu thị giác", () => {
    const audio = new AudioController(true);

    // Bậc 1 hỏng: mọi lần phát mp3 đều báo lỗi ngay.
    vi.spyOn(audio, "playPromptAudio").mockImplementation(
      (_ref, onEnd, onError) => {
        onError?.();
        onEnd?.();
      }
    );
    // Bậc 2 hỏng: máy không có giọng Việt.
    vi.spyOn(audio.getSpeechAdapter(), "hasVietnameseVoice").mockReturnValue(
      false
    );
    const speakSpy = vi.spyOn(audio, "speakPrompt");

    const fallbackCue = vi.fn();
    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          instruction: "Bé tìm quả táo",
          instruction_audio_path: "/audio/voice/khong_co_that.mp3",
          content_pack: {},
          difficulty_params: { item_count: 3 },
        },
      ],
      sessionFactory: () => new StubSession(),
      audioController: audio,
      onNarrationFallbackCue: fallbackCue,
    });

    runner.startFirstRound();

    // Bậc 2 được thử, rồi bậc 3 chạy — không bậc nào dừng ở im lặng.
    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(fallbackCue).toHaveBeenCalledTimes(1);
    runner.destroy();
  });

  // T3.1/BR-PNR-04: nhịp mở vòng phát ĐÚNG MỘT lệnh câu dẫn, và phát qua
  // kịch bản lượt chung nên mọi engine đều được, không phải sửa từng engine.
  it("BR-PNR-04: nhịp mở vòng phát đúng một lệnh câu dẫn qua kịch bản lượt chung", () => {
    const audio = new AudioController(true);
    const playSpy = vi
      .spyOn(audio, "playPromptAudio")
      .mockImplementation(() => {
        // Bậc 1 coi như phát thành công.
      });
    const speakSpy = vi.spyOn(audio, "speakPrompt");

    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          instruction: "Bé chọn hình tròn",
          instruction_audio_path: "/audio/voice/common/numbers/1.mp3",
          content_pack: {},
          difficulty_params: { item_count: 3 },
        },
      ],
      sessionFactory: () => new StubSession(),
      audioController: audio,
    });

    runner.startFirstRound();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0]?.[0]).toBe(
      "/audio/voice/common/numbers/1.mp3"
    );
    expect(speakSpy).not.toHaveBeenCalled();
    runner.destroy();
  });

  // BR-PNR-03: khi bề mặt chơi nhận việc phát, RoundRunner Cấm — NEVER phát
  // thêm một lần nữa. Hai nguồn song song cho ra hai giọng chồng nhau.
  it("BR-PNR-03: bề mặt chơi nhận việc phát thì RoundRunner không phát song song", () => {
    const audio = new AudioController(true);
    const playSpy = vi
      .spyOn(audio, "playPromptAudio")
      .mockImplementation(() => {
        // không làm gì
      });
    const speakSpy = vi.spyOn(audio, "speakPrompt");
    const hostNarration = vi.fn();

    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          instruction: "Bé chọn hình tròn",
          instruction_audio_path: "/audio/voice/common/numbers/1.mp3",
          content_pack: {},
          difficulty_params: { item_count: 3 },
        },
      ],
      sessionFactory: () => new StubSession(),
      audioController: audio,
      onPlayNarration: hostNarration,
    });

    runner.startFirstRound();
    expect(hostNarration).toHaveBeenCalledTimes(1);
    expect(hostNarration.mock.calls[0]?.[1]).toBe("round_open");
    expect(playSpy).not.toHaveBeenCalled();
    expect(speakSpy).not.toHaveBeenCalled();

    runner.replayCurrentRoundNarration();
    expect(hostNarration).toHaveBeenCalledTimes(2);
    expect(hostNarration.mock.calls[1]?.[1]).toBe("replay");
    runner.destroy();
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

  // T5.4: BR-PNR-09 — câu dẫn treo vô hạn thì vòng vẫn phải bắt đầu và chơi được.
  it("T5.4 (BR-PNR-09): câu dẫn không bao giờ trả lời cũng không chặn vòng chơi", () => {
    const audio = new AudioController(true);
    // Nạp treo: không gọi onEnd, không gọi onError, không bao giờ xong.
    vi.spyOn(audio, "playPromptAudio").mockImplementation(() => {
      // cố ý im lặng, mô phỏng tệp nằm trên mạng yếu
    });

    const runner = new RoundRunner({
      rounds: [
        {
          round_index: 0,
          instruction: "Bé đếm số táo",
          instruction_audio_path: "/audio/voice/rat_cham.mp3",
          content_pack: {},
          difficulty_params: { item_count: 3 },
        },
      ],
      sessionFactory: () => new StubSession(),
      audioController: audio,
    });

    runner.startFirstRound();

    // Vòng đã mở, phiên chơi đã dựng: narration không nằm trên đường tới hạn.
    expect(runner.getCurrentSession()).not.toBeNull();
    expect(runner.getState().currentRoundIndex).toBe(0);
    expect(runner.getState().isFinished).toBe(false);
    runner.destroy();
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

  // T5.7 đã gỡ: bản cũ khai báo hàm onItemTouch ngay trong thân test rồi tự
  // kiểm hàm đó, nên nó không chạm vào mã sản phẩm nào. Việc phát tên vật lúc
  // trẻ chạm CHƯA được thi công (xem mục "Chưa làm trong task này"), nên ở
  // đây chưa có gì để đo.
});
