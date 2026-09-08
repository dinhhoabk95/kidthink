import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findViolations, findViolationsInSource } from "./check-logic-space.ts";

function writeTemplate(root: string, name: string, source: string): void {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "session.ts"), source, "utf8");
}

describe("Cổng check:logic-space (Task #260 I7)", () => {
  it("LayoutInput có `logic:` thì không vi phạm", () => {
    const source = `
      protected computeSlots(band: AgeBand): readonly Slot[] {
        const layoutFn = resolveLayout("grid");
        return layoutFn({ slotCount: 3, ageBand: band, logic: this.logicSpace });
      }
    `;
    expect(findViolationsInSource("GT-OK", source)).toEqual([]);
  });

  it("Ca âm: gỡ `logic:` khỏi LayoutInput thì cổng bắt được", () => {
    const source = `
      protected computeSlots(band: AgeBand): readonly Slot[] {
        const layoutFn = resolveLayout("grid");
        return layoutFn({ slotCount: 3, ageBand: band });
      }
    `;
    const violations = findViolationsInSource("GT-BAD", source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("layout_input_without_logic");
  });

  it("Ca âm: một trong hai LayoutInput bỏ `logic:` vẫn bị bắt (phép đo theo call site)", () => {
    const source = `
      protected computeSlots(band: AgeBand): readonly Slot[] {
        const a = resolveLayout("grid")({
          slotCount: 2,
          ageBand: band,
          logic: this.logicSpace,
        });
        const b = resolveLayout("row")({ slotCount: 4, ageBand: band });
        return [...a, ...b];
      }
    `;
    const violations = findViolationsInSource("GT-HALF", source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.detail).toContain("thứ 2");
  });

  it("Ca âm: thân tự dựng slot mà không đọc this.logicSpace thì bị bắt", () => {
    const source = `
      protected computeSlots(band: AgeBand): readonly Slot[] {
        return [{ index: 0, x: 480, y: 270, w: 80, h: 80, hitW: 80, hitH: 80, page: 0, role: "source" }];
      }
    `;
    const violations = findViolationsInSource("GT-HAND", source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe("body_without_logic_space");
  });

  it("Cấm — NEVER đếm `this.logicSpace` nằm ngoài thân computeSlots", () => {
    const source = `
      protected computeSlots(band: AgeBand): readonly Slot[] {
        return [{ index: 0, x: 480, y: 270, w: 80, h: 80, hitW: 80, hitH: 80, page: 0, role: "source" }];
      }

      private somethingElse(): number {
        return this.logicSpace.w;
      }
    `;
    expect(findViolationsInSource("GT-LATER", source)).toHaveLength(1);
  });

  it("quét cả thư mục templates và bỏ qua thư mục không phải GT-", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "logic-space-"));
    writeTemplate(
      root,
      "GT-900",
      "protected computeSlots(b: AgeBand) { return layoutFn({ slotCount: 1, ageBand: b }); }"
    );
    writeTemplate(
      root,
      "helpers",
      "protected computeSlots(b: AgeBand) { return layoutFn({ slotCount: 1, ageBand: b }); }"
    );

    const violations = findViolations(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.template).toBe("GT-900");
  });

  it("corpus thật đang ở nợ 0", () => {
    expect(findViolations()).toEqual([]);
  });
});
