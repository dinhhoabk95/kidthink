import { describe, expect, it } from "vitest";
import {
  knownSkillCodes,
  runTaxonomyRefsGate,
  scanTaxonomyRefs,
} from "./taxonomy-refs.ts";

describe("Cổng check:taxonomy-refs — không mã kỹ năng chết", () => {
  it("docs/** và seed-content/** không còn mã kỹ năng không tồn tại", () => {
    expect(runTaxonomyRefsGate()).toEqual([]);
  });

  it("thật sự quét được — danh sách mã đọc ra không rỗng", () => {
    expect(knownSkillCodes().size).toBeGreaterThan(300);
  });

  it("Ca âm 1: mã chết trong tài liệu bản đồ giáo án làm cổng đỏ", () => {
    const found = scanTaxonomyRefs(
      "docs/taxonomy/lesson-map.md",
      "| W22 | Tiết 64 | `LES-0104` | Tháp hồng | `C5.LEN.01` |",
      knownSkillCodes()
    );

    expect(found).toHaveLength(1);
    expect(found[0]?.code).toBe("C5.LEN.01");
  });

  it("Ca âm 2: mã chết trong một hạt seed-content làm cổng đỏ", () => {
    const found = scanTaxonomyRefs(
      "packages/db/src/seed-content/c4/levels.ts",
      'skill_codes: ["C4.WGT.01"],',
      knownSkillCodes()
    );

    expect(found).toHaveLength(1);
    expect(found[0]?.code).toBe("C4.WGT.01");
  });

  it("Ca dương: mã có thật thì sạch", () => {
    expect(
      scanTaxonomyRefs("x.md", "`C1.CNT.01` và `C5.WRD.03`", knownSkillCodes())
    ).toEqual([]);
  });
});
