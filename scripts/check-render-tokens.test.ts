import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readBaseline,
  runCheck,
  scanFileHexTokens,
  scanRenderTokens,
} from "./check-render-tokens.ts";

describe("Cổng check:render-tokens (Task #268 / BR-DSC-26)", () => {
  it("quét tầng render hiện tại đạt dưới trần baseline", () => {
    const violations = scanRenderTokens();
    const baseline = readBaseline();
    expect(violations.length).toBeLessThanOrEqual(baseline.max_hex_tokens);
    const result = runCheck(false);
    expect(result.success).toBe(true);
  });

  it("Ca âm BR-DSC-26: phát hiện hằng hex thô mới, báo đúng dòng và mã màu", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "render-test-"));
    const filePath = path.join(tmpDir, "test-render.ts");
    const source = `
// Line 1 comment
export function testRender(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#ff00ea"; // Line 4 raw hex
  ctx.strokeStyle = "#123456"; // Line 5 raw hex
}
`;
    fs.writeFileSync(filePath, source, "utf8");

    const violations = scanFileHexTokens(filePath);
    expect(violations).toHaveLength(2);
    expect(violations[0]?.hex).toBe("#ff00ea");
    expect(violations[0]?.line).toBe(4);
    expect(violations[1]?.hex).toBe("#123456");
    expect(violations[1]?.line).toBe(5);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("bỏ qua comment và chuỗi không phải hex color", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "render-test-"));
    const filePath = path.join(tmpDir, "test-ignore.ts");
    const source = `
// Task #268 issue number is not hex color
* Another #202 comment
const issue = "Task #268";
`;
    fs.writeFileSync(filePath, source, "utf8");

    const violations = scanFileHexTokens(filePath);
    expect(violations).toHaveLength(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
