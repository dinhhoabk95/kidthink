import { readdirSync, readFileSync } from "node:fs";
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

/**
 * Engine không vào khung năm vùng, kèm lý do (`play-stage-zones.md` mục 5 hàng
 * "Intro GT-000", câu hỏi mở số 5, quyết 2026-10-03). Danh sách ngắn và có lý do:
 * thêm mã vào đây là một quyết định của spec, không phải đường tắt.
 */
const EXEMPT_CODES: Readonly<Record<string, string>> = {
  "GT-000":
    "màn làm quen không chấm điểm, không khay, không nộp bài; ba nút là DOM của trang",
};

const CODE_FOLDER = /^GT-\d{3}$/;

/** Mã engine có thư mục template mà không thuộc `migrated` lẫn `exempt`. */
function findUncoveredCodes(
  allCodes: readonly string[],
  migrated: readonly string[],
  exempt: Readonly<Record<string, string>>
): string[] {
  return allCodes.filter(
    (code) => !(migrated.includes(code) || code in exempt)
  );
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

  it("phủ đủ mọi mã engine: dời vào khung hoặc ngoại lệ có lý do", () => {
    const allCodes = readdirSync(SRC_ROOT).filter((name) =>
      CODE_FOLDER.test(name)
    );

    expect(findUncoveredCodes(allCodes, MIGRATED_CODES, EXEMPT_CODES)).toEqual(
      []
    );
    expect(allCodes.length).toBe(
      MIGRATED_CODES.length + Object.keys(EXEMPT_CODES).length
    );
  });

  it("ngoại lệ không trùng mã đã dời và mỗi ngoại lệ có lý do", () => {
    for (const [code, reason] of Object.entries(EXEMPT_CODES)) {
      expect(MIGRATED_CODES).not.toContain(code);
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it("ca âm: mã engine mới chưa dời và chưa miễn bị báo", () => {
    expect(
      findUncoveredCodes(["GT-001", "GT-999"], ["GT-001"], EXEMPT_CODES)
    ).toEqual(["GT-999"]);
  });
});
