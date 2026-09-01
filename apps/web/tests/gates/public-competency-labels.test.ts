import { describe, expect, it } from "vitest";
import {
  GATE_TARGETS,
  runCompetencyLabelGate,
  scanCompetencyLabels,
  scanCompetencyLabelsInFile,
} from "./public-competency-labels.ts";

const FIXTURE_DIR = "apps/web/tests/gates/fixtures/competency-labels";

/**
 * `BR-LND-09` — nhãn năng lực và số lượng nội dung trên bề mặt công khai phải
 * đến từ dữ liệu.
 *
 * Cổng này ra đời sau task 165: sáu bảng nhãn viết tay và ba chỗ in số cứng
 * sống nhiều tháng vì không cổng nào đo. Ca âm ở dưới là phần bắt buộc — cổng
 * chỉ quét nguồn thật thì xanh cả khi hàm quét hỏng.
 */
describe("Cổng nhãn năng lực + số lượng (BR-LND-09)", () => {
  it("ba cây nguồn không còn nhãn hay số viết cứng", () => {
    expect(runCompetencyLabelGate()).toEqual([]);
  });

  it("thật sự quét được cây nguồn — không xanh vì đường dẫn rỗng", () => {
    for (const dir of GATE_TARGETS) {
      expect(() => scanCompetencyLabels(dir)).not.toThrow();
    }
  });

  it("ca âm: bắt nhãn năng lực viết cứng", () => {
    const violations = scanCompetencyLabelsInFile(
      `${FIXTURE_DIR}/bad-label.vue.txt`
    );

    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(violations.every((v) => v.reason.includes("Nhãn năng lực"))).toBe(
      true
    );
  });

  it("ca âm: bắt số lượng viết cứng", () => {
    const violations = scanCompetencyLabelsInFile(
      `${FIXTURE_DIR}/bad-count.ts.txt`
    );

    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.reason).join(" ")).toContain("120+");
  });

  it("ca dương: mã dẫn xuất từ catalog thì sạch", () => {
    expect(scanCompetencyLabelsInFile(`${FIXTURE_DIR}/good.ts.txt`)).toEqual(
      []
    );
  });
});
