import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures";
import { GT006Session } from "#src/templates/GT-006/session";

function getFixture() {
  const fixture = GT006_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-006 fixture");
  }
  return fixture;
}

describe("GT-006 — sắp xếp thứ tự (sequence-order): hit-test, spokenLabel, commit", () => {
  const fixture = getFixture();

  function buildStageSession(): GT006Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: true,
    });
    const session = new GT006Session(
      fixture.content,
      { ...fixture.difficulty, shuffle_initial: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) vẫn chọn và đổi chỗ được hai bước", () => {
    const session = buildStageSession();
    const slot0 = session.slots[0];
    const slot1 = session.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }

    const offset0 = slot0.hitH / 2 + TAP_TOLERANCE_PX - 4;
    expect(
      session.toAction({
        type: "tap",
        x: slot0.x,
        y: slot0.y + offset0,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedIndex()).toBe(0);

    const offset1 = slot1.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: slot1.x,
      y: slot1.y + offset1,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "reorder_step",
      data: { from_index: 0, to_index: 1 },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildStageSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán hitShape square, spokenLabel tiếng Việt và id duy nhất cho từng bước", () => {
    const session = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entity of view.entities) {
      expect(entity.hitShape).toBe("square");
      expect(entity.spokenLabel).toBeTruthy();
    }
  });

  it("chuyển pha Explore -> Challenge sau 2 thao tác hoán đổi toa và tính đúng cao độ getStepPitchIndex", () => {
    const session = buildStageSession();
    session.startExplorePhase();
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    expect(session.getStepPitchIndex("s1")).toBe(0);
    expect(session.getStepPitchIndex("s2")).toBe(1);
    expect(session.getStepPitchIndex("s3")).toBe(2);

    session.reorderSteps(0, 1);
    expect(session.getExploreTracker().getPhase()).toBe("explore");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(1);

    session.reorderSteps(1, 0);
    expect(session.getExploreTracker().getPhase()).toBe("challenge");
    expect(session.getExploreTracker().getExploreActionsCount()).toBe(2);
  });

  it("phát hiện vị trí lệch đầu tiên findFirstMismatchIndex, phản hồi Control of Error và kích hoạt Micro-Sandbox sau 2 lần nộp sai", () => {
    const session = buildStageSession();
    expect(session.findFirstMismatchIndex()).toBe(-1);

    // Đổi chỗ toa 0 và 1 -> lệch từ vị trí 0 (toa thứ 1)
    session.reorderSteps(0, 1);
    expect(session.findFirstMismatchIndex()).toBe(0);

    session.onSubmitSequence();
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Toa thứ 1 chưa đúng nhịp quy luật"
    );
    expect(session.getControlOfError()?.targetId).toBe("s2");
    expect(session.getControlOfError()?.actualValue).toBe(1);
    expect(session.isMicroSandboxActive()).toBe(false);

    // Nộp sai lần 2 liên tiếp -> bật Micro-Sandbox
    session.onSubmitSequence();
    expect(session.isMicroSandboxActive()).toBe(true);
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Toa thứ 1 chưa đúng nhịp quy luật"
    );

    // Sửa lại đúng thứ tự và nộp -> xóa lỗi và tắt Micro-Sandbox
    session.reorderSteps(0, 1);
    expect(session.findFirstMismatchIndex()).toBe(-1);
    session.onSubmitSequence();
    expect(session.checkWinCondition()).toBe(true);
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()).toBeNull();
  });
});
