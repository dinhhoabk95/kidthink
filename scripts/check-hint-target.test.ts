import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findLadderViolationInSource,
  findLadderViolations,
  findViolationInSource,
  findViolations,
} from "./check-hint-target.ts";

describe("Cổng check:hint-target (Task #260 T9 & Task #301 S3/S5)", () => {
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

  it("quét thư mục templates thật: nợ getHintTargetIndex đang là 0", () => {
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

  describe("Bậc thang gợi ý getHintTargetForLevel (Task #301 S3/S5)", () => {
    it("Ca dương: L1 trả region, L3 trả getHintTarget thì không vi phạm", () => {
      const source = `
        override getHintTargetForLevel(level: HintLevel): HintTarget | null {
          if (level === 1) {
            return { kind: "region", ids: ["row-0"] };
          }
          if (level === 2) {
            return { kind: "region", ids: ["row-0", "col-0"] };
          }
          return this.getHintTarget();
        }
      `;
      expect(findLadderViolationInSource("GT-LADDER-OK", source)).toBeNull();
    });

    it("Ca âm: thiếu getHintTargetForLevel thì báo missing_ladder", () => {
      expect(
        findLadderViolationInSource("GT-NO-LADDER", "class X {}")?.kind
      ).toBe("missing_ladder");
    });

    it("Ca âm: L1 trả thẳng slot đáp án bị phát hiện (l1_leaks_answer)", () => {
      const leakSlotSource = `
        override getHintTargetForLevel(level: HintLevel): HintTarget | null {
          if (level === 1) {
            return { kind: "slot", index: 0 };
          }
          return this.getHintTarget();
        }
      `;
      expect(
        findLadderViolationInSource("GT-LEAK-SLOT", leakSlotSource)?.kind
      ).toBe("l1_leaks_answer");

      const leakTargetSource = `
        override getHintTargetForLevel(level: HintLevel): HintTarget | null {
          if (level === 1) {
            return this.getHintTarget();
          }
          return this.getHintTarget();
        }
      `;
      expect(
        findLadderViolationInSource("GT-LEAK-TARGET", leakTargetSource)?.kind
      ).toBe("l1_leaks_answer");
    });

    it("5 engine ưu tiên (GT-010, GT-011, GT-012, GT-017, GT-032) đã đạt chuẩn bậc thang, nợ giảm còn 33", () => {
      const ladderViolations = findLadderViolations();
      const missingTemplates = ladderViolations.map((v) => v.template);
      for (const done of ["GT-010", "GT-011", "GT-012", "GT-017", "GT-032"]) {
        expect(missingTemplates).not.toContain(done);
      }
      expect(ladderViolations).toHaveLength(33);
    });
  });
});
