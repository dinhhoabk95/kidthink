import type { AgeBand } from "@mindkid/game-engine";
import {
  ACTION_CORRECT,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type Slot,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

class FakeSession extends TemplateGameSession<
  Record<string, number>,
  Record<string, number>
> {
  readonly dispatched: GameAction[] = [];

  override setupEntities(): void {
    /* noop */
  }

  override validateAction(action: GameAction): ActionResult {
    this.dispatched.push(action);
    // Template kéo-thả: chạm là sai, chỉ `drop` mới đúng.
    return action.type === "drop_item" ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return false;
  }

  override toAction(gesture: { type: string }): GameAction | null {
    return gesture.type === "drop"
      ? { type: "drop_item", data: {} }
      : { type: "tap_item", data: {} };
  }

  protected override computeSlots(_band: AgeBand): readonly Slot[] {
    return [];
  }
}

function makeHarness(entities: { id: string; role: string }[]) {
  const session = new FakeSession({}, {});
  const onMiss = vi.fn();
  const onSuccess = vi.fn();
  const engine = {
    activeSession: session,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
    },
    scaffolding: { onMiss, onSuccess },
    renderSystem: { LOGIC_WIDTH: 960, LOGIC_HEIGHT: 540 },
  };

  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
  });

  gesture.viewEntities.value = entities.map((e, index) => ({
    id: e.id,
    role: e.role,
    x: index * 100,
    y: 100,
    w: 80,
    h: 80,
  })) as never;

  return { gesture, session, onMiss, onSuccess };
}

describe("usePlayGesture — đường bàn phím (Task #260 I11)", () => {
  it("bề mặt kéo-thả: chọn nguồn chỉ stage, Cấm — NEVER tính là chạm sai", () => {
    const { gesture, session, onMiss } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const source = gesture.viewEntities.value[0];
    if (!source) {
      throw new Error("thiếu entity nguồn");
    }
    gesture.handleAccessibleEntityTap(source);

    expect(gesture.stagedEntityId.value).toBe("src-1");
    expect(session.dispatched).toHaveLength(0);
    expect(onMiss).not.toHaveBeenCalled();
  });

  it("bề mặt kéo-thả: Enter trên ô đích phát drop", () => {
    const { gesture, session } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const [source, target] = gesture.viewEntities.value;
    if (!(source && target)) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(source);
    gesture.handleAccessibleEntityTap(target);

    expect(session.dispatched.map((a) => a.type)).toEqual(["drop_item"]);
    expect(gesture.stagedEntityId.value).toBeNull();
  });

  it("đổi nguồn đang chọn trên bề mặt kéo-thả cũng không sinh chạm sai", () => {
    const { gesture, session, onMiss } = makeHarness([
      { id: "src-1", role: "source" },
      { id: "src-2", role: "source" },
      { id: "dst-1", role: "target" },
    ]);

    const [first, second] = gesture.viewEntities.value;
    if (!(first && second)) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(first);
    gesture.handleAccessibleEntityTap(second);

    expect(gesture.stagedEntityId.value).toBe("src-2");
    expect(session.dispatched).toHaveLength(0);
    expect(onMiss).not.toHaveBeenCalled();
  });

  it("bề mặt chạm-chọn (không có ô đích): Enter vẫn gửi tap ngay", () => {
    const { gesture, session } = makeHarness([
      { id: "opt-1", role: "source" },
      { id: "opt-2", role: "source" },
    ]);

    const option = gesture.viewEntities.value[0];
    if (!option) {
      throw new Error("thiếu entity");
    }
    gesture.handleAccessibleEntityTap(option);

    expect(session.dispatched.map((a) => a.type)).toEqual(["tap_item"]);
  });
});
