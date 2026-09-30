import {
  type ActionResult,
  computeStageZones,
  type Gesture,
  type Slot,
  type StageZones,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #277 S3 — Vùng lời dẫn và loa nghe lại (`BR-PSZ-08`).
 *
 * Loa trong vùng lời dẫn (`zones.promptSpeaker`) bắt chạm thật và phát lại
 * đúng đường lời dẫn của vòng (`replayCurrentRoundNarration`). Engine cấm — NEVER
 * nhận gesture khi trẻ chạm vào loa (không chấm đúng/sai, không miss).
 */
describe("usePlayGesture — BR-PSZ-08 loa bắt chạm thật", () => {
  const zones: StageZones = computeStageZones({
    logicW: 960,
    logicH: 540,
    ageBand: "4-5",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });

  const speakerCenterX = zones.promptSpeaker.x + zones.promptSpeaker.w / 2;
  const speakerCenterY = zones.promptSpeaker.y + zones.promptSpeaker.h / 2;

  function makeHarness() {
    const replayNarration = vi.fn();
    const sessionDispatch = vi.fn();

    class TestSession extends TemplateGameSession<
      Record<string, unknown>,
      Record<string, unknown>
    > {
      override setupEntities(): void {
        /* noop */
      }
      override validateAction(): ActionResult {
        return { valid: true, feedback: "none" };
      }
      override checkWinCondition(): boolean {
        return false;
      }
      protected override computeSlots(): readonly Slot[] {
        return [];
      }
      override dispatch(gesture: Gesture): ActionResult | null {
        sessionDispatch(gesture);
        return { valid: true, feedback: "none" };
      }
    }

    const session = new TestSession({}, {});

    const engine = {
      activeSession: session,
      acceptingInput: true,
      audio: {
        playSnapSound: vi.fn(),
        playPopCelebrateSound: vi.fn(),
        playSoftFeedbackSound: vi.fn(),
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
      getEngine: () => engine as never,
      canvasRef: ref(null),
      onRoundWon: vi.fn(),
      getStageZones: () => zones,
      onPromptSpeakerTap: replayNarration,
    });

    function tapAt(x: number, y: number): void {
      gesture.handlePointerDown({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 100,
      } as PointerEvent);

      gesture.handlePointerUp({
        pointerId: 1,
        clientX: x,
        clientY: y,
        timeStamp: 200,
      } as PointerEvent);
    }

    return { gesture, replayNarration, sessionDispatch, tapAt };
  }

  it("chạm tâm zones.promptSpeaker: gọi replayCurrentRoundNarration đúng 1 lần và engine không nhận gesture", () => {
    const { replayNarration, sessionDispatch, tapAt } = makeHarness();

    tapAt(speakerCenterX, speakerCenterY);

    expect(replayNarration).toHaveBeenCalledTimes(1);
    expect(sessionDispatch).not.toHaveBeenCalled();
  });

  it("chạm ngoài zones.promptSpeaker: không gọi replayNarration và chuyển gesture cho engine", () => {
    const { replayNarration, sessionDispatch, tapAt } = makeHarness();

    // Chạm ở sân khấu (x=500, y=300)
    tapAt(500, 300);

    expect(replayNarration).not.toHaveBeenCalled();
    expect(sessionDispatch).toHaveBeenCalledTimes(1);
  });
});
