import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures";
import { GT022Session } from "#src/templates/GT-022/session";

/**
 * Task #313 Phase 3 — GT-022: hình mẫu của thứ cần tìm ghim ở đầu sân khấu
 * suốt lượt (`BR-E022-05`), mỗi hình đích khác nhau một ô, không chạm được.
 */
function build(index: number): GT022Session {
  const f = GT022_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT022Session(f.content, f.difficulty, 1);
  const space = deriveLogicSpace(964, 628);
  const cssPerLogic = 964 / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "4-5",
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
  return session;
}

describe("GT-022 — hình mẫu ghim (BR-E022-05)", () => {
  it("hàng ghim có đúng một ô cho mỗi hình đích khác nhau", () => {
    const session = build(0);
    const distinct = new Set(
      session.content.scene_objects
        .filter((o) => o.is_target)
        .map((o) => JSON.stringify(o.asset))
    );
    const refs = session.getView().entities.filter((e) => e.role === "neutral");
    expect(refs).toHaveLength(distinct.size);
    // Cảnh nằm dưới hàng ghim, không đè lên hình mẫu.
    const refBottom = Math.max(...refs.map((r) => r.y + r.h / 2));
    for (const obj of session.resolvedObjects) {
      expect(obj.y - obj.height / 2).toBeGreaterThanOrEqual(refBottom);
    }
  });

  it("chạm hình mẫu không phải lượt đoán; tìm đủ vật đích thì hình mẫu sáng", () => {
    const session = build(0);
    const ref = session.getView().entities.find((e) => e.role === "neutral");
    if (!ref) {
      throw new Error("Thiếu hình mẫu");
    }
    expect(
      session.toAction({ type: "tap", x: ref.x, y: ref.y, timeMs: 0 })
    ).toBe(null);
    for (const obj of session.resolvedObjects.filter((o) => o.isTarget)) {
      session.onTapObject(obj.id);
    }
    const after = session.getView().entities.find((e) => e.id === ref.id);
    expect(after?.state).toBe("correct");
  });
});
