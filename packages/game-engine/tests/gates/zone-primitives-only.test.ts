import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MIGRATED_CODES } from "../layout/migrated-codes.ts";

/**
 * Gate `zone-primitives-only` (Task #283 N, `BR-PSZ-08..10`): engine đã dời vào
 * khung năm vùng không tự vẽ lời dẫn — shell vẽ `drawPromptZone`. Engine chỉ
 * còn được gọi `drawPromptText` ở **nhánh dự phòng** cho bề mặt chưa có khung,
 * tức khối `if (!this.stageRect) { ... }` (hoặc `if (!zones) { ... }` ở GT-003,
 * nơi `zones` là `stageRect` và `trayRect` cùng có). Gọi ở bất kỳ chỗ nào khác
 * là lời dẫn vẽ đôi.
 *
 * Quy tắc quét, theo dòng: mỗi lệnh gọi `drawPromptText(` phải có dòng khối
 * bao ngoài gần nhất (thụt lề nhỏ hơn) khớp `GUARD_LINE`. Dòng `import` không
 * tính là lệnh gọi.
 */
const SRC_ROOT = path.resolve(import.meta.dirname, "../../src/templates");
const FIXTURE_ROOT = path.resolve(import.meta.dirname, "fixtures");

const CALL = /\bdrawPromptText\(/;
const GUARD_LINE = /^\s*if \(!(?:this\.stageRect|zones)\) \{\s*$/;

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** Số dòng (1-based) của lệnh gọi `drawPromptText` không nằm trong nhánh dự phòng. */
function findUnguardedPromptCalls(source: string): number[] {
  const lines = source.split("\n");
  const offending: number[] = [];
  lines.forEach((line, index) => {
    if (!CALL.test(line) || line.trimStart().startsWith("import")) {
      return;
    }
    const callIndent = indentOf(line);
    for (let up = index - 1; up >= 0; up--) {
      const above = lines[up] ?? "";
      if (above.trim() === "" || indentOf(above) >= callIndent) {
        continue;
      }
      if (!GUARD_LINE.test(above)) {
        offending.push(index + 1);
      }
      return;
    }
    offending.push(index + 1);
  });
  return offending;
}

function readSession(root: string, code: string): string {
  return readFileSync(path.join(root, code, "session.ts"), "utf8");
}

describe("zone-primitives-only — engine đã dời không tự vẽ lời dẫn", () => {
  it.each(MIGRATED_CODES)(
    "%s chỉ gọi drawPromptText trong nhánh dự phòng không khung",
    (code) => {
      expect(findUnguardedPromptCalls(readSession(SRC_ROOT, code))).toEqual([]);
    }
  );

  it("ca âm: fixture gọi drawPromptText không qua nhánh dự phòng bị báo", () => {
    const source = readSession(
      path.join(FIXTURE_ROOT, "unguarded-prompt-text"),
      "GT-001"
    );

    expect(findUnguardedPromptCalls(source).length).toBe(1);
  });

  it("ca âm: nhánh dự phòng đúng dạng thì không bị báo", () => {
    const guarded = [
      "render() {",
      "  if (!this.stageRect) {",
      "    drawPromptText(ctx, rs, text);",
      "  }",
      "}",
    ].join("\n");
    const wrongGuard = guarded.replace("!this.stageRect", "this.stageRect");

    expect(findUnguardedPromptCalls(guarded)).toEqual([]);
    expect(findUnguardedPromptCalls(wrongGuard)).toEqual([3]);
  });
});
