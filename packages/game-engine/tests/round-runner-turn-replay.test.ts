import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  type ActionResult,
  BaseGameSession,
  type GameAction,
} from "#src/game-session";
import { type RoundConfig, RoundRunner } from "#src/round-runner";

class TurnTrackingSession extends BaseGameSession {
  readonly receivedContentPack: Record<string, string | readonly string[]>;
  readonly receivedDifficultyParams: Record<string, number | boolean>;
  readonly receivedSeed: number;

  constructor(
    contentPack: Record<string, string | readonly string[]>,
    difficultyParams: Record<string, number | boolean>,
    layoutSeed: number
  ) {
    super();
    this.receivedContentPack = contentPack;
    this.receivedDifficultyParams = difficultyParams;
    this.receivedSeed = layoutSeed;
  }

  setupEntities(): void {
    /* noop */
  }

  validateAction(_action: GameAction): ActionResult {
    return ACTION_CORRECT;
  }

  checkWinCondition(): boolean {
    return true;
  }
}

/**
 * `BR-ETS-10` có hai nửa và chúng ở hai chỗ khác nhau:
 *
 * - **Bàn mới** sinh ở route config (`createLayoutSeed`) — giữ bởi
 *   `apps/web/tests/unit/turn-script-replay-seed.test.ts`.
 * - **Độ khó giữ nguyên** là việc của runner: nó chuyển `difficulty_params` cho
 *   session **y nguyên**, và số lần nhận trợ giúp ở lượt trước Cấm — NEVER
 *   chạm vào nó. Đó là nửa mà file này giữ.
 */
describe("Turn Script Invariant — BR-ETS-10 (Chơi lại không đổi độ khó)", () => {
  const roundConfig: RoundConfig = {
    round_index: 0,
    instruction: "Bé chọn đúng số lượng quả táo",
    instruction_audio_path: "audio/c1_cnt_01_inst.mp3",
    content_pack: {
      prompt: "Đếm số táo",
      items: ["apple_1", "apple_2", "apple_3"],
    },
    difficulty_params: {
      item_count: 3,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  };

  it("hai lượt liên tiếp cùng level: seed đi qua nguyên vẹn, difficulty_params bằng nhau, trợ giúp về L0", () => {
    let turn1Session: TurnTrackingSession | null = null;
    let turn2Session: TurnTrackingSession | null = null;

    // Lượt 1 (Turn 1)
    const turn1Seed = 1001;
    const runnerTurn1 = new RoundRunner({
      rounds: [roundConfig],
      layoutSeed: turn1Seed,
      sessionFactory: (pack, diff, seed) => {
        turn1Session = new TurnTrackingSession(
          pack as Record<string, string | readonly string[]>,
          diff as Record<string, number | boolean>,
          seed
        );
        return turn1Session;
      },
    });

    runnerTurn1.startFirstRound();
    expect(runnerTurn1.getState().hintCountTotal).toBe(0); // Bắt đầu từ L0
    runnerTurn1.recordHint(); // Giả lập trẻ gặp bế tắc và nhận hint
    expect(runnerTurn1.getState().hintCountTotal).toBe(1);

    // Trẻ chơi xong hoặc bấm chơi lại, runner 1 kết thúc
    runnerTurn1.destroy();

    // Lượt 2 (Turn 2 — Chơi lại cùng level)
    const turn2Seed = 2002; // Seed mới được sinh cho lượt 2
    const runnerTurn2 = new RoundRunner({
      rounds: [roundConfig],
      layoutSeed: turn2Seed,
      sessionFactory: (pack, diff, seed) => {
        turn2Session = new TurnTrackingSession(
          pack as Record<string, string | readonly string[]>,
          diff as Record<string, number | boolean>,
          seed
        );
        return turn2Session;
      },
    });

    runnerTurn2.startFirstRound();

    if (!(turn1Session && turn2Session)) {
      throw new Error("turn1Session và turn2Session phải được khởi tạo");
    }

    const s1: TurnTrackingSession = turn1Session;
    const s2: TurnTrackingSession = turn2Session;

    // Invariant 1: runner chuyển đúng seed nó nhận xuống session, không tự chế
    // seed riêng — nếu không, seed mới của route sẽ bị nuốt và bàn không đổi.
    expect(s1.receivedSeed).toBe(turn1Seed);
    expect(s2.receivedSeed).toBe(turn2Seed);

    // Invariant 2: difficulty_params của lượt mới BẰNG ĐÚNG lượt trước (không phạt tăng/giảm)
    expect(s2.receivedDifficultyParams).toEqual(s1.receivedDifficultyParams);
    expect(s2.receivedDifficultyParams).toEqual(roundConfig.difficulty_params);

    // Invariant 3: Cấp trợ giúp reset về L0 ở lượt mới
    expect(runnerTurn2.getState().hintCountTotal).toBe(0);

    runnerTurn2.destroy();
  });
});
