import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findViolationInSource, findViolations } from "./check-hint-target.ts";

describe("Cổng check:hint-target (Task #260 T9)", () => {
  it("override có logic thật thì không vi phạm", () => {
    const source = `
      override getHintTargetIndex(): number | null {
        const idx = this.options.findIndex((o) => o.correct);
        return idx >= 0 ? idx : null;
      }
    `;
    expect(findViolationInSource("GT-OK", source)).toBeNull();
  });

  it("Ca âm: không override thì bị bắt", () => {
    expect(findViolationInSource("GT-NONE", "class X {}")?.kind).toBe(
      "missing"
    );
  });

  it("Ca âm: thân hàm chỉ `return null;` là stub, không phải cài đặt", () => {
    const source = `
      override getHintTargetIndex(): number | null {
        return null;
      }
    `;
    expect(findViolationInSource("GT-STUB", source)?.kind).toBe("stub");
  });

  it("`return null` trong một nhánh vẫn tính là cài đặt thật", () => {
    const source = `
      override getHintTargetIndex(): number | null {
        if (!this.step) {
          return null;
        }
        return 0;
      }
    `;
    expect(findViolationInSource("GT-BRANCH", source)).toBeNull();
  });

  it("quét thư mục templates thật: nợ đang là 0", () => {
    expect(findViolations()).toEqual([]);
  });

  it("bỏ qua thư mục không phải GT-", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "hint-target-"));
    for (const name of ["GT-900", "helpers"]) {
      fs.mkdirSync(path.join(root, name), { recursive: true });
      fs.writeFileSync(path.join(root, name, "session.ts"), "class X {}");
    }
    const violations = findViolations(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.template).toBe("GT-900");
  });
});
