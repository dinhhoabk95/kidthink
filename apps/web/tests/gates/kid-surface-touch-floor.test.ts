import { describe, expect, it } from "vitest";
import {
  KID_TOUCH_FLOOR_PX,
  runKidSurfaceTouchFloorGate,
  scanKidSurfaceTouchFloor,
} from "./kid-surface-touch-floor.ts";

describe("BR-DSC-28: nút bề mặt trẻ giữ sàn chạm 64 px", () => {
  it("play-surface.css thật không còn nút nào dưới sàn", () => {
    expect(runKidSurfaceTouchFloorGate()).toEqual([]);
  });

  it("Ca âm: hạ một lớp nút xuống 48 px thì cổng đỏ và nêu đúng lớp", () => {
    const badCss = `
.btn-audio-speak,
.btn-primary,
.btn-secondary {
  display: inline-flex;
  min-height: 48px;
}
`;
    const violations = scanKidSurfaceTouchFloor(badCss);
    expect(violations).toHaveLength(3);
    expect(violations[0]?.minHeightPx).toBe(48);
    expect(violations.map((v) => v.selector)).toContain(".btn-primary");
  });

  it("Ca âm: 3rem (48 px) cũng là vi phạm — đơn vị khác không phải lối thoát", () => {
    const badCss = ".btn-primary { min-height: 3rem; }";
    expect(scanKidSurfaceTouchFloor(badCss)).toHaveLength(1);
  });

  it("Đạt sàn thì xanh", () => {
    const goodCss = `.btn-primary { min-height: ${KID_TOUCH_FLOOR_PX}px; }`;
    expect(scanKidSurfaceTouchFloor(goodCss)).toEqual([]);
  });
});
