import { describe, expect, it } from "vitest";
import { getTouchFloor } from "#src/layout/constants";
import {
  computeStageGroupsLayout,
  resolveStageRect,
  type StageGroupsInput,
} from "#src/layout/stage-groups";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

/** Sân khấu 960x540, band 5-6 — khung ngang thấp nhất mà ba engine S7 gặp. */
const LANDSCAPE_STAGE = computeStageZones({
  logicW: 960,
  logicH: 540,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
}).stage;

/** Hình dạng GT-035 lớn nhất đã seed: lưới 3x5, 8 lệnh, 4 thẻ lệnh. */
const ROBOT_INPUT: StageGroupsInput = {
  stage: LANDSCAPE_STAGE,
  ageBand: "5-6",
  groups: [
    { count: 15, role: "target", cols: 5, hasLabels: true },
    { count: 8, role: "target", hasLabels: true },
    { count: 4, role: "source", hasLabels: true },
  ],
};

describe("computeStageGroupsLayout (Task #277 S7)", () => {
  it("hàm thuần: 50 lần gọi cho cùng kết quả (BR-LAY-01)", () => {
    const first = computeStageGroupsLayout(ROBOT_INPUT);
    for (let i = 0; i < 50; i++) {
      expect(computeStageGroupsLayout(ROBOT_INPUT)).toEqual(first);
    }
  });

  it("chỉ số slot liên tục theo thứ tự nhóm, vai trò theo nhóm", () => {
    const slots = computeStageGroupsLayout(ROBOT_INPUT);

    expect(slots.map((slot) => slot.index)).toEqual(
      Array.from({ length: 27 }, (_, i) => i)
    );
    expect(slots.slice(23).every((slot) => slot.role === "source")).toBe(true);
  });

  it("khung ngang không đủ cao thì lưới sang cột trái, vẫn trọn sân khấu và không chồng", () => {
    const slots = computeStageGroupsLayout(ROBOT_INPUT);
    const gridRight = Math.max(
      ...slots.slice(0, 15).map((s) => s.x + s.hitW / 2)
    );
    const queueLeft = Math.min(...slots.slice(15).map((s) => s.x - s.hitW / 2));

    expect(gridRight).toBeLessThan(queueLeft);
    expect(findHitPairViolations(slots)).toEqual([]);
    expect(findSlotsOutsideStage(slots, LANDSCAPE_STAGE)).toEqual([]);
  });

  it("không ô nào dưới sàn chạm của band (BR-LAY-03)", () => {
    const floor = getTouchFloor("5-6");
    const slots = computeStageGroupsLayout(ROBOT_INPUT);

    expect(slots.every((s) => s.hitW >= floor && s.hitH >= floor)).toBe(true);
  });

  it("sân khấu quá nhỏ thì giữ sàn chạm và không chồng, chấp nhận tràn (BR-LAY-04)", () => {
    const tiny = { x: 16, y: 144, w: 200, h: 100 };
    const floor = getTouchFloor("5-6");
    const slots = computeStageGroupsLayout({ ...ROBOT_INPUT, stage: tiny });

    expect(slots.every((s) => s.hitW >= floor)).toBe(true);
    expect(findHitPairViolations(slots)).toEqual([]);
  });

  it("resolveStageRect: không có vùng shell cấp thì dùng cùng hàm vùng ở tỉ lệ 1", () => {
    const space = { w: 960, h: 540 };
    const given = { x: 1, y: 2, w: 3, h: 4 };

    expect(resolveStageRect(space, "5-6")).toEqual(LANDSCAPE_STAGE);
    expect(resolveStageRect(space, "5-6", given)).toBe(given);
  });
});
