import {
  type ActionResult,
  computeStageZones,
  type Gesture,
  type Slot,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/** Verdict của session → `onVerdict` (ghi `answer_*` cho server chấm điểm, `BR-SCO-01`). */
describe("usePlayGesture — onVerdict", () => {
  const zones = computeStageZones({
    logicW: 960,
    logicH: 540,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });

  function harness(verdict: ActionResult) {
    class TestSession extends TemplateGameSession<
      Record<string, unknown>,
      Record<string, unknown>
    > {
      override setupEntities(): void {
        /* noop */
      }
      override validateAction(): ActionResult {
        return verdict;
      }
      override checkWinCondition(): boolean {
        return false;
      }
      protected override computeSlots(): readonly Slot[] {
        return [];
      }
      override dispatch(_gesture: Gesture): ActionResult | null {
        return verdict;
      }
    }
    const engine = {
      activeSession: new TestSession({}, {}),
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        speakEncouragement: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: 960,
        LOGIC_HEIGHT: 540,
        toLogicPoint: (x: number, y: number) => ({ x, y }),
      },
    };
    const onVerdict = vi.fn();
    const g = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
      onVerdict,
    });
    const tap = (): void => {
      g.handlePointerDown({
        pointerId: 1,
        clientX: 500,
        clientY: 300,
        timeStamp: 100,
      } as PointerEvent);
      g.handlePointerUp({
        pointerId: 1,
        clientX: 500,
        clientY: 300,
        timeStamp: 200,
      } as PointerEvent);
    };
    return { onVerdict, tap };
  }

  it("báo đúng khi verdict hợp lệ", () => {
    const { onVerdict, tap } = harness({
      valid: true,
      feedback: "pop_celebrate",
    });
    tap();
    expect(onVerdict).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("báo sai khi verdict không hợp lệ", () => {
    const { onVerdict, tap } = harness({
      valid: false,
      feedback: "amber_soft",
    });
    tap();
    expect(onVerdict).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("không báo khi cử chỉ bị nuốt (feedback none)", () => {
    const { onVerdict, tap } = harness({ valid: false, feedback: "none" });
    tap();
    expect(onVerdict).not.toHaveBeenCalled();
  });

  it("cập nhật getGestureVisualState khi kéo thả trực tiếp và bay đàn hồi khi thả trượt", () => {
    class DragSession extends TemplateGameSession<
      Record<string, string>,
      Record<string, number>
    > {
      override setupEntities(): void {
        /* noop */
      }
      override validateAction(): ActionResult {
        return { valid: false, feedback: "amber_soft" };
      }
      override checkWinCondition(): boolean {
        return false;
      }
      protected override computeSlots(): readonly Slot[] {
        return [];
      }
      override dispatch(_gesture: Gesture): ActionResult | null {
        return { valid: false, feedback: "amber_soft" };
      }
    }
    const engine = {
      activeSession: new DragSession({}, {}),
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
        speakEncouragement: vi.fn(),
      },
      renderSystem: {
        LOGIC_WIDTH: 960,
        LOGIC_HEIGHT: 540,
        toLogicPoint: (x: number, y: number) => ({ x, y }),
      },
    };
    const g = usePlayGesture({
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
    });
    g.viewEntities.value = [
      {
        id: "src-1",
        role: "source",
        x: 150,
        y: 420,
        w: 80,
        h: 80,
        glyph: "🍎",
        state: "idle",
      },
      {
        id: "dst-1",
        role: "target",
        x: 480,
        y: 220,
        w: 96,
        h: 96,
        state: "idle",
      },
    ];

    g.handlePointerDown({
      pointerId: 7,
      clientX: 150,
      clientY: 420,
      timeStamp: 100,
    } as PointerEvent);
    const downState = g.getGestureVisualState(110);
    expect(downState.isPointerDown).toBe(true);
    expect(downState.isDragging).toBe(false);
    expect(downState.activeEntity?.id).toBe("src-1");

    g.handlePointerMove({
      pointerId: 7,
      clientX: 475,
      clientY: 225,
      timeStamp: 150,
    } as PointerEvent);
    const moveState = g.getGestureVisualState(150);
    expect(moveState.isDragging).toBe(true);
    expect(moveState.currentX).toBe(475);
    expect(moveState.currentY).toBe(225);
    expect(moveState.hoveredTarget?.id).toBe("dst-1");

    g.handlePointerUp({
      pointerId: 7,
      clientX: 475,
      clientY: 225,
      timeStamp: 180,
    } as PointerEvent);
    const afterUpState = g.getGestureVisualState(performance.now() + 20);
    expect(afterUpState.isPointerDown).toBe(false);
    expect(afterUpState.flight?.kind).toBe("spring_back");
    expect(afterUpState.flight?.toX).toBe(150);
    expect(afterUpState.flight?.toY).toBe(420);
  });
});
