import type { EngineView, Gesture } from "#src/index";
import type { HintTarget } from "#src/systems/hint-ladder";
import type { HintPlayable } from "../../hint-actionable.js";

/**
 * Session giả có gợi ý trỏ vào thẻ mà chạm vào không đổi gì (giống GT-000
 * `present`/`echo` trước khi sửa): đi tiếp chỉ có nút DOM, không có trong gợi ý.
 */
export class NoopHintSession implements HintPlayable {
  checkWinCondition(): boolean {
    return false;
  }

  dispatch(_gesture: Gesture): undefined {
    return undefined;
  }

  getHintTarget(): HintTarget {
    return { kind: "slot", index: 0 };
  }

  getView(): EngineView {
    return {
      entities: [
        {
          id: "card",
          slotIndex: 0,
          role: "neutral",
          state: "idle",
          x: 100,
          y: 100,
          w: 80,
          h: 80,
        },
      ],
    };
  }
}
