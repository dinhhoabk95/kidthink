import { beforeAll, describe, expect, it } from "vitest";
import { preloadGameSession } from "#src/index";
import {
  canvasBoxOf,
  casesFor,
  measureOverflow,
  SHELL_VIEWPORTS,
} from "./helpers/shell-frame.ts";

/**
 * Sân khấu cao hơn không được làm bố cục GT-022 tệ hơn (`BR-PSZ-03`,
 * `BR-LAY-13`): nhánh dự phòng của level nhiều vật không để ô thò đáy canvas.
 */
describe("GT-022 — mọi vùng chạm nằm trong canvas ở khung play 3-4@360x640", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-022");
  });

  it("không ca nào tràn khung", () => {
    const viewport = SHELL_VIEWPORTS.find((v) => v.name === "360x640");
    if (!viewport) {
      throw new Error("Thiếu viewport 360x640");
    }
    const box = canvasBoxOf(viewport, "3-4", "play");
    const overflowing = casesFor("GT-022", "3-4").filter(
      ({ config }) => measureOverflow("GT-022", config, "3-4", box).length > 0
    );
    expect(overflowing).toHaveLength(0);
  });
});
