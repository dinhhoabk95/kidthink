import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type AgeBand,
  type GameAction,
  type Gesture,
  type PlayVerb,
  type Slot,
  TemplateGameSession,
  type ViewEntity,
} from "@mindkid/game-engine";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/** Task #320 — shell xử lý nét kéo theo verb phiên nhận (BR-EIC-08, BR-EIC-09). */

class VerbSession extends TemplateGameSession<
  Record<string, number>,
  Record<string, number>
> {
  readonly gestures: Gesture["type"][] = [];
  commitAllowed = true;
  override readonly needsCommit = true;

  constructor(verbs: readonly PlayVerb[]) {
    super({}, {});
    this.setDeclaredVerbs(verbs);
  }

  override setupEntities(): void {
    /* noop */
  }

  override canCommit(): boolean {
    return this.commitAllowed;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      // Thả hụt: không có ô đích nào nhận.
      return gesture.toX < 400 ? { type: "drop_item", data: {} } : null;
    }
    return { type: `${gesture.type}_item`, data: {} };
  }

  override validateAction(action: GameAction): ActionResult {
    return action.type === "drop_item" ? ACTION_CORRECT : ACTION_IGNORED;
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    this.gestures.push(gesture.type);
    return super.dispatch(gesture);
  }

  protected override computeSlots(_band: AgeBand): readonly Slot[] {
    return [];
  }
}

const SOURCE: ViewEntity = {
  id: "piece",
  slotIndex: 0,
  role: "source",
  state: "idle",
  x: 100,
  y: 100,
  w: 80,
  h: 80,
  label: "mảnh",
};
const TARGET: ViewEntity = { ...SOURCE, id: "slot", role: "target", x: 300 };

function pointer(x: number, y: number): PointerEvent {
  return { pointerId: 1, clientX: x, clientY: y, timeStamp: 0 } as PointerEvent;
}

function build(verbs: readonly PlayVerb[]) {
  const session = new VerbSession(verbs);
  const playWoodPickup = vi.fn();
  const engine = {
    activeSession: session,
    acceptingInput: true,
    scaffolding: { onMiss: vi.fn(), onSuccess: vi.fn() },
    resetScaffolding: vi.fn(),
    audio: {
      playWoodPickup,
      playWoodClackSnap: vi.fn(),
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
      playPromptAudio: vi.fn(),
      speakPrompt: vi.fn(),
      speakEncouragement: vi.fn(),
    },
    renderSystem: { LOGIC_WIDTH: 960, LOGIC_HEIGHT: 540 },
  };
  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
  });
  gesture.viewEntities.value = [SOURCE, TARGET];
  const drag = (toX: number, toY: number) => {
    gesture.handlePointerDown(pointer(SOURCE.x, SOURCE.y));
    gesture.handlePointerMove(pointer(toX, toY));
    const midDrag = gesture.getGestureVisualState(0);
    gesture.handlePointerUp(pointer(toX, toY));
    return midDrag;
  };
  return { session, engine, gesture, playWoodPickup, drag };
}

describe("Trò chỉ chạm không có kéo (BR-EIC-08)", () => {
  it("không âm nhấc, không bóng kéo, không ô đích nhấp nháy", () => {
    const { playWoodPickup, drag } = build(["tap"]);
    const midDrag = drag(300, 100);
    expect(playWoodPickup).not.toHaveBeenCalled();
    expect(midDrag.isDragging).toBe(false);
    expect(midDrag.targetEntities).toEqual([]);
  });

  it("nhả trên ô khác: không gửi drop vô nghĩa", () => {
    const { session, drag } = build(["tap"]);
    drag(300, 100);
    expect(session.gestures).toEqual([]);
  });

  it("trò kéo-thả vẫn có âm nhấc và bóng kéo", () => {
    const { playWoodPickup, drag } = build(["drop", "tap"]);
    const midDrag = drag(300, 100);
    expect(playWoodPickup).toHaveBeenCalledTimes(1);
    expect(midDrag.isDragging).toBe(true);
    expect(midDrag.targetEntities.map((e) => e.id)).toEqual(["slot"]);
  });

  it("cổng cử chỉ đóng: không âm nhấc", () => {
    const { engine, playWoodPickup, drag } = build(["drop", "tap"]);
    engine.acceptingInput = false;
    drag(300, 100);
    expect(playWoodPickup).not.toHaveBeenCalled();
  });
});

describe("Thả hụt (BR-EIC-09)", () => {
  it("nét bắt đầu trên vật nguồn thả ra chỗ trống không thành adjust (xoay vật)", () => {
    const { session, drag } = build(["drop", "tap", "adjust"]);
    drag(700, 450);
    expect(session.gestures).toEqual(["drop"]);
  });
});

describe("Nút nộp bằng bàn phím (BR-PSZ-05)", () => {
  it("không có vùng bàn chơi vẫn tôn trọng canCommit", () => {
    const { session, gesture } = build(["tap", "commit"]);
    session.commitAllowed = false;
    gesture.pressActionButton();
    expect(session.gestures).toEqual([]);
    session.commitAllowed = true;
    gesture.pressActionButton();
    expect(session.gestures).toEqual(["commit"]);
  });
});
