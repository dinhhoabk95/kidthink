import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MIGRATED_CODES } from "../layout/migrated-codes.ts";

/**
 * Gate `zone-primitives-only` (Task #283, `BR-PSZ-08..10`): engine đã dời vào
 * khung năm vùng **không** gọi `drawPromptText` — shell vẽ `drawPromptZone`, kể
 * cả ở `/play/preview-sandbox` (`play-stage-zones.md` mục 5). Trước đây còn một
 * nhánh dự phòng `if (!this.stageRect) { drawPromptText(...) }` cho bề mặt chưa
 * có khung; preview-sandbox đã vào khung nên nhánh đó bị xoá và mọi lệnh gọi
 * đều bị báo. Dòng `import` không tính là lệnh gọi.
 */
const SRC_ROOT = path.resolve(import.meta.dirname, "../../src/templates");
const FIXTURE_ROOT = path.resolve(import.meta.dirname, "fixtures");

const CALL = /\bdrawPromptText\(/;

/** Số dòng (1-based) của mọi lệnh gọi `drawPromptText`. */
function findPromptTextCalls(source: string): number[] {
  const offending: number[] = [];
  source.split("\n").forEach((line, index) => {
    if (CALL.test(line) && !line.trimStart().startsWith("import")) {
      offending.push(index + 1);
    }
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
  it.each(MIGRATED_CODES)("%s không gọi drawPromptText", (code) => {
    expect(findPromptTextCalls(readSession(SRC_ROOT, code))).toEqual([]);
  });

  it("ca âm: fixture gọi drawPromptText bị báo", () => {
    const source = readSession(
      path.join(FIXTURE_ROOT, "unguarded-prompt-text"),
      "GT-001"
    );

    expect(findPromptTextCalls(source).length).toBe(1);
  });

  it("ca âm: nhánh dự phòng cũ không còn được chấp nhận", () => {
    const legacyGuard = [
      "render() {",
      "  if (!this.stageRect) {",
      "    drawPromptText(ctx, rs, text);",
      "  }",
      "}",
    ].join("\n");

    expect(findPromptTextCalls(legacyGuard)).toEqual([3]);
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
