import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT028Content,
  type GT028Difficulty,
  preloadGameSession,
  RoundRunner,
  type StageZones,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #277 S0, hiện trạng H3 — GT-028 chỉ nộp bài qua gesture `commit`
 * (`GT-028/session.ts` `toAction`), còn trang chơi chỉ gửi `commit` từ ba nút
 * intro của GT-000 (`pages/play/[code].vue` `handleEcho*`, `handleIntroPrev`).
 * Mọi đường còn lại của bề mặt web là `tap` tại một toạ độ canvas.
 *
 * S4 (`BR-PSZ-05` — nút hành động do shell đổi thành `commit`):
 * Khi chạm vào `zones.action`, shell đổi `tap` thành `commit` và GT-028 nộp bài thành công.
 * Ca âm: khi shell không có nhánh đổi chạm (hoặc needsCommit=false), quét tap không thể thắng.
 */

const GT028_CONTENT: GT028Content = {
  prompt: "Bé hãy chạm từng quả táo để đếm nhảy cóc 2 cho đủ 8 nhé!",
  step: 2,
  target_total: 8,
  items: [
    { item_id: "apple_1", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_2", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_3", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_4", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_5", asset: { kind: "emoji", ref: "🍎" } },
    { item_id: "apple_6", asset: { kind: "emoji", ref: "🍎" } },
  ],
};

const GT028_DIFFICULTY: GT028Difficulty = {
  step: 2,
  item_count: 6,
  allow_undo: true,
  hint_after_ms: 8000,
  shuffle_items: false,
};

const GT028_ENGINE_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT028",
  content_version: 1,
  template_code: "GT-028",
  content_pack: GT028_CONTENT,
  difficulty_params: GT028_DIFFICULTY,
  theme_id: "default",
  age_band: "4-5",
  reduced_motion: false,
  audio_enabled: false,
};

const LOGIC_W = 960;
const LOGIC_H = 540;
const SWEEP_STEP_PX = 12;

function countSelected(session: GameSession): number {
  const entities = session.getView?.().entities ?? [];
  return entities.filter((e) => e.state === "selected").length;
}

function makeRunner(): RoundRunner {
  return new RoundRunner({
    rounds: [
      {
        round_index: 0,
        content_pack: GT028_CONTENT,
        difficulty_params: GT028_DIFFICULTY,
      },
    ],
    ageBand: "4-5",
    layoutSeed: 1,
    sessionFactory: (contentPack, difficultyParams, roundSeed) =>
      createGameSessionSync("GT-028", {
        ...GT028_ENGINE_CONFIG,
        content_pack: contentPack,
        difficulty_params: difficultyParams,
        layout_seed: roundSeed,
      }),
    onPlayNarration: () => undefined,
  });
}

describe("Task #277 S4 — BR-PSZ-05: GT-028 nộp bài từ bề mặt web", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-028");
  });

  it("chạm đủ số đúng rồi dispatch commit thì thắng — engine đúng", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    const session = runner.getCurrentSession();
    if (!session) {
      throw new Error("Thiếu session GT-028");
    }
    const needed = GT028_CONTENT.target_total / GT028_CONTENT.step;
    for (const entity of (session.getView?.().entities ?? []).slice(
      0,
      needed
    )) {
      session.dispatch?.({ type: "tap", x: entity.x, y: entity.y, timeMs: 0 });
    }
    expect(countSelected(session)).toBe(needed);

    session.dispatch?.({ type: "commit", timeMs: 0 });

    expect(session.checkWinCondition()).toBe(true);
  });

  it("BR-PSZ-05 — chạm đủ số rồi chỉ dùng tap trên canvas vẫn thắng được vòng nhờ shell đổi chạm tại action zone", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    const session = runner.getCurrentSession();
    if (!session) {
      throw new Error("Thiếu session GT-028");
    }

    const zones: StageZones = computeStageZones({
      logicW: LOGIC_W,
      logicH: LOGIC_H,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: true,
    });

    const engine = {
      activeSession: session,
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        playPromptAudio: vi.fn(),
        speakPrompt: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: LOGIC_W,
        LOGIC_HEIGHT: LOGIC_H,
        toLogicPoint: (clientX: number, clientY: number) => ({
          x: clientX,
          y: clientY,
        }),
      },
    };

    const gesture = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
    });
    gesture.syncView();

    function gestureTap(x: number, y: number): void {
      gesture.handlePointerDown({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 10,
      } as PointerEvent);
      gesture.handlePointerUp({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 20,
      } as PointerEvent);
    }

    function probeTapCanvas(x: number, y: number): void {
      const before = countSelected(session as GameSession);
      gestureTap(x, y);

      if (
        countSelected(session as GameSession) !== before &&
        !session?.checkWinCondition()
      ) {
        gestureTap(x, y);
      }
    }

    const needed = GT028_CONTENT.target_total / GT028_CONTENT.step;
    for (const entity of (session.getView?.().entities ?? []).slice(
      0,
      needed
    )) {
      gestureTap(entity.x, entity.y);
    }
    expect(countSelected(session)).toBe(needed);

    for (
      let y = 0;
      y <= LOGIC_H && !session.checkWinCondition();
      y += SWEEP_STEP_PX
    ) {
      for (
        let x = 0;
        x <= LOGIC_W && !session.checkWinCondition();
        x += SWEEP_STEP_PX
      ) {
        probeTapCanvas(x, y);
      }
    }

    expect(session.checkWinCondition()).toBe(true);
  });

  it("ca âm: khi needsCommit=false, quét tap trên canvas không bao giờ thắng được", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    const session = runner.getCurrentSession();
    if (!session) {
      throw new Error("Thiếu session GT-028");
    }

    const zonesWithoutCommit: StageZones = computeStageZones({
      logicW: LOGIC_W,
      logicH: LOGIC_H,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });

    // Giả lập phiên needsCommit = false
    const engine = {
      activeSession: Object.assign(Object.create(session), {
        needsCommit: false,
      }),
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        playPromptAudio: vi.fn(),
        speakPrompt: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: LOGIC_W,
        LOGIC_HEIGHT: LOGIC_H,
        toLogicPoint: (clientX: number, clientY: number) => ({
          x: clientX,
          y: clientY,
        }),
      },
    };

    const gesture = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zonesWithoutCommit,
    });
    gesture.syncView();

    function tapCanvas(x: number, y: number): void {
      const before = countSelected(session as GameSession);
      gesture.handlePointerDown({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 10,
      } as PointerEvent);
      gesture.handlePointerUp({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 20,
      } as PointerEvent);

      if (
        countSelected(session as GameSession) !== before &&
        !session?.checkWinCondition()
      ) {
        gesture.handlePointerDown({
          pointerId: 1,
          clientX: x,
          clientY: y,
          timeStamp: 30,
        } as PointerEvent);
        gesture.handlePointerUp({
          pointerId: 1,
          clientX: x,
          clientY: y,
          timeStamp: 40,
        } as PointerEvent);
      }
    }

    const needed = GT028_CONTENT.target_total / GT028_CONTENT.step;
    for (const entity of (session.getView?.().entities ?? []).slice(
      0,
      needed
    )) {
      session.dispatch?.({ type: "tap", x: entity.x, y: entity.y, timeMs: 0 });
    }
    expect(countSelected(session)).toBe(needed);

    for (
      let y = 0;
      y <= LOGIC_H && !session.checkWinCondition();
      y += SWEEP_STEP_PX
    ) {
      for (
        let x = 0;
        x <= LOGIC_W && !session.checkWinCondition();
        x += SWEEP_STEP_PX
      ) {
        tapCanvas(x, y);
      }
    }

    expect(session.checkWinCondition()).toBe(false);
  });
});
