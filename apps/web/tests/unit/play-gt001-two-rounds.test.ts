import {
  computeStageZones,
  createGameSessionSync,
  DEFAULT_LOGIC_SPACE,
  preloadGameSession,
  type RoundConfig,
  RoundRunner,
  type StageZones,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #277 S3 — Test hai vòng liên tiếp GT-001 trên trang chơi.
 *
 * Kiểm tra:
 * 1. Vòng 1 nhận zones.stage qua prepareRound, slot và view entity nằm trong stage.
 * 2. Thắng vòng 1 và chuyển sang vòng 2: session mới vẫn giữ nguyên stageRect,
 *    tính lại slot theo stage, và syncView() cập nhật view entities khớp vòng 2.
 */
describe("GT-001 — hai vòng liên tiếp trên trang chơi (Task #277 S3)", () => {
  const zones: StageZones = computeStageZones({
    logicW: 960,
    logicH: 540,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });

  const roundConfigs: RoundConfig[] = [
    {
      round_index: 0,
      content_pack: {
        prompt: "Tìm quả táo màu đỏ",
        target_item: {
          item_id: "apple_target",
          asset: { kind: "emoji", ref: "🍎" },
        },
        options: [
          {
            item_id: "apple_opt",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: true,
          },
          {
            item_id: "banana_opt",
            asset: { kind: "emoji", ref: "🍌" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        item_count: 2,
        allow_retry: true,
        shuffle_items: false,
      },
    },
    {
      round_index: 1,
      content_pack: {
        prompt: "Tìm quả cam màu cam",
        target_item: {
          item_id: "orange_target",
          asset: { kind: "emoji", ref: "🍊" },
        },
        options: [
          {
            item_id: "grape_opt",
            asset: { kind: "emoji", ref: "🍇" },
            is_correct: false,
          },
          {
            item_id: "orange_opt",
            asset: { kind: "emoji", ref: "🍊" },
            is_correct: true,
          },
        ],
      },
      difficulty_params: {
        item_count: 2,
        allow_retry: true,
        shuffle_items: false,
      },
    },
  ];

  beforeAll(async () => {
    await preloadGameSession("GT-001");
  });

  it("hai vòng liên tiếp đều đồng bộ stageRect, computeSlots, và syncView()", () => {
    let activeEngineSession: TemplateGameSession<unknown, unknown> | null =
      null;
    const onRoundStartedCalls: number[] = [];
    const onRoundCompletedCalls: number[] = [];

    const runner = new RoundRunner({
      rounds: roundConfigs,
      ageBand: "4-5",
      logicSpace: DEFAULT_LOGIC_SPACE,
      stageRect: zones.stage,
      gateOnPromptSettle: false,
      sessionFactory: (contentPack, difficultyParams, seed) => {
        return createGameSessionSync("GT-001", {
          level_code: "test",
          content_version: 1,
          template_code: "GT-001",
          content_pack: contentPack,
          difficulty_params: difficultyParams,
          theme_id: "default",
          age_band: "4-5",
          layout_seed: seed,
        });
      },
      onRoundStarted: (index) => {
        onRoundStartedCalls.push(index);
        activeEngineSession = runner.getCurrentSession() as TemplateGameSession<
          unknown,
          unknown
        >;
      },
      onRoundCompleted: (index) => {
        onRoundCompletedCalls.push(index);
      },
    });

    const fakeEngine = {
      get activeSession() {
        return activeEngineSession;
      },
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        speakPrompt: vi.fn(),
        playItemAudio: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: 960,
        LOGIC_HEIGHT: 540,
        toLogicPoint: (clientX: number, clientY: number) => ({
          x: clientX,
          y: clientY,
        }),
      },
    };

    const gesture = usePlayGesture({
      getEngine: () => fakeEngine as never,
      canvasRef: ref(null),
      onRoundWon: () => {
        runner.completeCurrentRound();
      },
      getStageZones: () => zones,
    });

    // 1. Khởi động vòng 1
    runner.startFirstRound();
    gesture.syncView();

    expect(onRoundStartedCalls).toEqual([0]);
    const session1 = activeEngineSession;
    expect(session1).toBeInstanceOf(TemplateGameSession);
    expect(session1?.stageRect).toEqual(zones.stage);

    // Mọi slot của vòng 1 phải nằm trong stage
    for (const slot of session1?.slots ?? []) {
      expect(slot.x).toBeGreaterThanOrEqual(zones.stage.x);
      expect(slot.x).toBeLessThanOrEqual(zones.stage.x + zones.stage.w);
      expect(slot.y).toBeGreaterThanOrEqual(zones.stage.y);
      expect(slot.y).toBeLessThanOrEqual(zones.stage.y + zones.stage.h);
    }

    // View entities vòng 1 khớp với session1
    expect(gesture.viewEntities.value.map((e) => e.id)).toEqual([
      "prompt:apple_target",
      "apple_opt",
      "banana_opt",
    ]);
    const appleSlot = session1?.slots[0];
    if (!appleSlot) {
      throw new Error("Missing apple slot");
    }

    // Chạm đúng lựa chọn vòng 1
    gesture.handlePointerDown({
      pointerId: 1,
      clientX: appleSlot.x,
      clientY: appleSlot.y,
      timeStamp: 100,
    } as PointerEvent);
    gesture.handlePointerUp({
      pointerId: 1,
      clientX: appleSlot.x,
      clientY: appleSlot.y,
      timeStamp: 200,
    } as PointerEvent);

    // 2. Vòng 1 hoàn thành và tự động chuyển sang vòng 2
    expect(onRoundCompletedCalls).toEqual([0]);
    expect(onRoundStartedCalls).toEqual([0, 1]);

    const session2 = activeEngineSession;
    expect(session2).not.toBe(session1);
    expect(session2?.stageRect).toEqual(zones.stage);

    // Mọi slot của vòng 2 phải nằm trong stage
    for (const slot of session2?.slots ?? []) {
      expect(slot.x).toBeGreaterThanOrEqual(zones.stage.x);
      expect(slot.x).toBeLessThanOrEqual(zones.stage.x + zones.stage.w);
      expect(slot.y).toBeGreaterThanOrEqual(zones.stage.y);
      expect(slot.y).toBeLessThanOrEqual(zones.stage.y + zones.stage.h);
    }

    // Đồng bộ view cho vòng 2
    gesture.syncView();
    expect(gesture.viewEntities.value.map((e) => e.id)).toEqual([
      "prompt:orange_target",
      "grape_opt",
      "orange_opt",
    ]);

    // Chạm đúng lựa chọn vòng 2
    const orangeSlot = session2.slots[1];
    if (!orangeSlot) {
      throw new Error("Missing orange slot");
    }
    gesture.handlePointerDown({
      pointerId: 1,
      clientX: orangeSlot.x,
      clientY: orangeSlot.y,
      timeStamp: 300,
    } as PointerEvent);
    gesture.handlePointerUp({
      pointerId: 1,
      clientX: orangeSlot.x,
      clientY: orangeSlot.y,
      timeStamp: 400,
    } as PointerEvent);

    expect(onRoundCompletedCalls).toEqual([0, 1]);
    expect(runner.getState().roundsCompleted).toBe(2);
    expect(runner.getState().isFinished).toBe(true);
  });
});
