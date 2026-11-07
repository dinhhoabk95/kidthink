import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures";
import { GT007Session } from "#src/templates/GT-007/session";

function getFixture() {
  const fixture = GT007_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-007 fixture");
  }
  return fixture;
}

describe("GT-007 — tách gộp số (number-bond): hit-test, spokenLabel, retry state", () => {
  const fixture = getFixture();

  function buildSession(): GT007Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: false,
    });
    const session = new GT007Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound(
      "4-5",
      DEFAULT_LOGIC_SPACE,
      zones.stage,
      zones.tray ?? undefined
    );
    return session;
  }

  it("chạm lệch mép trong dung sai TAP_TOLERANCE_PX (24px) chọn được lựa chọn và điền vào ô phần khuyết", () => {
    const session = buildSession();
    const correctIdx = fixture.content.options.findIndex((o) => o.is_correct);
    const optSlot = session.sourceSlots[correctIdx];
    const targetPartIdx = fixture.content.parts.findIndex((p) => p.is_target);
    const partSlot = session.targetSlots[targetPartIdx + 1];
    if (!(optSlot && partSlot)) {
      throw new Error("Missing option or part slot");
    }

    const optOffset = optSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    expect(
      session.toAction({
        type: "tap",
        x: optSlot.x,
        y: optSlot.y + optOffset,
        timeMs: 0,
      })
    ).toBeNull();
    expect(session.getStagedOptionId()).toBe(
      fixture.content.options[correctIdx]?.id
    );

    const partOffset = partSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const action = session.toAction({
      type: "tap",
      x: partSlot.x,
      y: partSlot.y + partOffset,
      timeMs: 10,
    });
    expect(action).toEqual({
      type: "fill_part",
      data: {
        option_id: fixture.content.options[correctIdx]?.id,
        part_id: fixture.content.parts[targetPartIdx]?.id,
      },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán spokenLabel cho ô tổng, ô phần ('Ô trống' khi chưa điền) và các lựa chọn, với id duy nhất", () => {
    const session = buildSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const targetPart = fixture.content.parts.find((p) => p.is_target);
    const targetEntity = view.entities.find((e) => e.id === targetPart?.id);
    expect(targetEntity?.spokenLabel).toBe("Ô trống");

    for (const entity of view.entities) {
      expect(entity.spokenLabel).toBeTruthy();
    }
  });

  it("Montessori 2-Pha (Explore -> Challenge), Control of Error và Micro-Sandbox Retry", () => {
    const session = buildSession();
    session.startExplorePhase();
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    const p1 = session.previewOption("o1");
    expect(p1).toEqual({
      optionValue: 1,
      resultingSum: 4,
      expectedWhole: 5,
    });
    expect(session.getPreviewedOptionId()).toBe("o1");
    expect(session.getExploreTracker().getPhase()).toBe("explore");

    const p2 = session.previewOption("o3");
    expect(p2).toEqual({
      optionValue: 4,
      resultingSum: 7,
      expectedWhole: 5,
    });
    expect(session.getExploreTracker().getPhase()).toBe("challenge");

    // Sai lần 1: chọn o1 (value = 1) -> 3 + 1 = 4 (cần 5)
    session.onPartFilled("o1", "p2");
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Gộp 3 và 1 được 4 (cần 5)"
    );
    expect(session.isMicroSandboxActive()).toBe(false);

    // Sai lần 2 liên tiếp: chọn o3 (value = 4) -> 3 + 4 = 7 (cần 5) -> mở Micro-Sandbox
    session.onPartFilled("o3", "p2");
    expect(session.getControlOfError()?.reasonVi).toBe(
      "Gộp 3 và 4 được 7 (cần 5)"
    );
    expect(session.isMicroSandboxActive()).toBe(true);

    // Trả lời đúng: chọn o2 (value = 2) -> tắt Micro-Sandbox và xoá lỗi
    session.onPartFilled("o2", "p2");
    expect(session.isMicroSandboxActive()).toBe(false);
    expect(session.getControlOfError()).toBeNull();
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-007 — tổng chưa khớp báo trên ô tổng, lựa chọn đứng yên (BR-E007-04)", () => {
  it("điền sai: ô tổng nhịp hổ phách, không lựa chọn nào đỏ, ô phần vẫn trống để thêm bớt", () => {
    const fixture = getFixture();
    const session = new GT007Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5");
    session.onPartFilled("o1", "p2");

    const view = session.getView();
    const whole = view.entities.find((e) => e.id === fixture.content.whole.id);
    expect(whole?.state).toBe("incorrect");
    const options = view.entities.filter((e) => e.role === "source");
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.state).not.toBe("incorrect");
    }
    expect(session.filledParts.size).toBe(0);
    expect(session.checkWinCondition()).toBe(false);
  });
});
