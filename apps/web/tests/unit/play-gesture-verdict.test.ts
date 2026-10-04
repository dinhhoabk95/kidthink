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
});
