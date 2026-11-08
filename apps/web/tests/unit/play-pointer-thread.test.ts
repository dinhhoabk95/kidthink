import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GT033Content,
  type GT033Difficulty,
  preloadGameSession,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/** Nối `pointermove` của shell vào hook con trỏ của session (`BR-ENG-18`, `BR-E033-07`). */
const YARN = { kind: "emoji", ref: "🧶" } as const;
const CONTENT: GT033Content = {
  prompt: "Bé chọn sợi len màu phù hợp để dệt vào ô trống nhé!",
  grid: { rows: 2, cols: 2 },
  palette: [
    { color_id: "red", asset: YARN, name_vi: "Đỏ" },
    { color_id: "blue", asset: YARN, name_vi: "Xanh dương" },
  ],
  cells: ["red", "blue", "blue", null],
  solution: ["red", "blue", "blue", "red"],
  row_rule: "Đỏ xen kẽ Xanh",
  col_rule: "Đỏ xen kẽ Xanh",
};
const DIFFICULTY: GT033Difficulty = {
  item_count: 2,
  grid_size: 2,
  color_count: 2,
  blank_count: 1,
  allow_retry: true,
  hint_after_ms: 8000,
};

interface ThreadSession extends TemplateGameSession {
  getPlacedCells(): readonly (string | null)[];
  getYarnThread(
    reducedMotion: boolean
  ): { readonly to: { readonly x: number; readonly y: number } } | null;
}

function isThreadSession(s: unknown): s is ThreadSession {
  return (
    s instanceof TemplateGameSession &&
    typeof Reflect.get(s, "getYarnThread") === "function"
  );
}

const CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT033",
  content_version: 1,
  template_code: "GT-033",
  content_pack: CONTENT,
  difficulty_params: DIFFICULTY,
  theme_id: "default",
  age_band: "5-6",
  reduced_motion: false,
  audio_enabled: false,
  layout_seed: 1,
};

function pointer(x: number, y: number): PointerEvent {
  return { pointerId: 1, clientX: x, clientY: y, timeStamp: 0 } as PointerEvent;
}

describe("shell nối pointermove vào sợi chỉ GT-033", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-033");
  });

  function build() {
    const session = createGameSessionSync("GT-033", CONFIG);
    if (!isThreadSession(session)) {
      throw new Error("GT-033 thiếu getYarnThread");
    }
    const zones = computeStageZones({
      logicW: 960,
      logicH: 540,
      ageBand: "5-6",
      cssPerLogic: 1,
      needsTray: session.needsTray,
      trayItems: session.trayItemCount,
      trayLabels: session.trayHasLabels,
      stageRows: session.stageRowCount,
      needsCommit: session.needsCommit,
    });
    session.prepareRound(
      "5-6",
      { w: 960, h: 540 },
      zones.stage,
      zones.tray ?? undefined,
      1
    );
    const onMiss = vi.fn();
    const engine = {
      activeSession: session,
      acceptingInput: true,
      scaffolding: { onMiss, onSuccess: vi.fn() },
      resetScaffolding: vi.fn(),
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        playTapSound: vi.fn(),
        playPromptAudio: vi.fn(),
        speakPrompt: vi.fn(),
        speakEncouragement: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: 960,
        LOGIC_HEIGHT: 540,
        toLogicPoint: (x: number, y: number) => ({ x, y }),
      },
    };
    const gesture = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
      getAgeBand: () => "5-6",
    });
    gesture.syncView();
    const total = CONTENT.grid.rows * CONTENT.grid.cols;
    const blank = CONTENT.cells.indexOf(null);
    const cell = session.slots[blank];
    const yarn = session.slots[total];
    const blueYarn = session.slots[total + 1];
    if (!(cell && yarn && blueYarn)) {
      throw new Error("Thiếu slot");
    }
    return { session, gesture, cell, yarn, blueYarn, onMiss };
  }

  it("kéo quá ngưỡng: sợi theo ngón tay; nhả trên ô thì đặt sợi và sợi biến mất", () => {
    const { session, gesture, cell, yarn } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    expect(session.getYarnThread(false)).toBeNull();
    gesture.handlePointerMove(pointer(cell.x + 6, cell.y - 6));
    expect(session.getYarnThread(false)?.to).toEqual({
      x: cell.x + 6,
      y: cell.y - 6,
    });
    gesture.handlePointerMove(pointer(cell.x, cell.y));
    expect(session.getYarnThread(false)?.to).toEqual({ x: cell.x, y: cell.y });
    gesture.handlePointerUp(pointer(cell.x, cell.y));
    expect(session.getYarnThread(false)).toBeNull();
    expect(session.getPlacedCells()).toEqual(["red", "blue", "blue", "red"]);
  });

  it("lướt qua ô khi kéo không đặt sợi, chỉ đặt khi nhả", () => {
    const { session, gesture, cell, yarn } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    gesture.handlePointerMove(pointer(cell.x, cell.y));
    expect(session.getPlacedCells()).toEqual(CONTENT.cells);
  });

  it("đang cầm màu khác: kéo cuộn lướt qua ô không đặt màu đang cầm, nhả thì đặt màu cuộn kéo", () => {
    // Cầm Đỏ (đúng ở ô trống) rồi kéo cuộn Xanh qua ô: live-step kiểu mê cung
    // sẽ đặt Đỏ ngay lúc lướt; đúng luật là chỉ nhả mới đặt, và đặt Xanh.
    const { session, gesture, cell, yarn, blueYarn } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    gesture.handlePointerUp(pointer(yarn.x, yarn.y));
    gesture.syncView();
    gesture.handlePointerDown(pointer(blueYarn.x, blueYarn.y));
    gesture.handlePointerMove(pointer(cell.x, cell.y));
    expect(session.getPlacedCells()).toEqual(CONTENT.cells);
    gesture.handlePointerUp(pointer(cell.x, cell.y));
    expect(session.getPlacedCells()).toEqual(["red", "blue", "blue", "blue"]);
  });

  it("nhả ngoài ô: không đặt, không lượt sai, sợi co về", () => {
    const { session, gesture, yarn, onMiss } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    gesture.handlePointerMove(pointer(yarn.x + 40, yarn.y - 40));
    gesture.handlePointerUp(pointer(yarn.x + 40, yarn.y - 40));
    expect(session.getPlacedCells()).toEqual(CONTENT.cells);
    expect(onMiss).not.toHaveBeenCalled();
    session.update(250);
    expect(session.getYarnThread(false)).toBeNull();
  });

  it("chạm không kéo: không có sợi, chạm-chọn vẫn chạy", () => {
    const { session, gesture, cell, yarn } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    gesture.handlePointerMove(pointer(yarn.x + 2, yarn.y));
    expect(session.getYarnThread(false)).toBeNull();
    gesture.handlePointerUp(pointer(yarn.x + 2, yarn.y));
    gesture.handlePointerDown(pointer(cell.x, cell.y));
    gesture.handlePointerUp(pointer(cell.x, cell.y));
    expect(session.getYarnThread(false)).toBeNull();
    expect(session.getPlacedCells()).toEqual(["red", "blue", "blue", "red"]);
  });

  it("pointercancel: sợi co về cuộn", () => {
    const { session, gesture, yarn } = build();
    gesture.handlePointerDown(pointer(yarn.x, yarn.y));
    gesture.handlePointerMove(pointer(yarn.x + 40, yarn.y - 40));
    expect(session.getYarnThread(false)).not.toBeNull();
    gesture.handlePointerCancel(pointer(yarn.x + 40, yarn.y - 40));
    session.update(250);
    expect(session.getYarnThread(false)).toBeNull();
  });
});
