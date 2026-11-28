import { describe, expect, it } from "vitest";
import { applyCanvasFontAtSize } from "#src/render/type-scale";
import { applyBadFamily } from "./fixtures/bad-font-family";

const FONT_700 = /^700 \d+(\.\d+)?px /;

interface FontRecorder {
  font: string;
}

function makeCtx(): { ctx: FontRecorder; rec: FontRecorder } {
  const rec: FontRecorder = { font: "10px sans-serif" };
  return { ctx: rec, rec };
}

describe("applyCanvasFontAtSize", () => {
  it("heading + 700 cho chuỗi font hợp lệ đúng cỡ", () => {
    const { ctx, rec } = makeCtx();
    applyCanvasFontAtSize(ctx, 26, "heading", 700);
    expect(rec.font).toMatch(FONT_700);
    expect(rec.font.startsWith("700 26px ")).toBe(true);
  });

  it("mặc định sans 400", () => {
    const { ctx, rec } = makeCtx();
    applyCanvasFontAtSize(ctx, 18);
    expect(rec.font.startsWith("400 18px ")).toBe(true);
  });

  it("fixture family sai bị kiểu bắt (ts-expect-error biên dịch được)", () => {
    expect(typeof applyBadFamily).toBe("function");
  });
});
