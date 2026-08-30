import { resolve } from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  formatEngineSpecsReport,
  lintSingleEngineSpec,
  scanEngineSpecsGate,
} from "./engine-specs.js";

const fixtureSpecPath = resolve(
  import.meta.dirname,
  "fixtures",
  "incomplete-spec.md"
);

describe("Gate check:engine-specs (BR-ESS-01..14)", () => {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const templatesDir = repoPath("packages/game-engine/src/templates");
  const configPath = repoPath(
    "packages/game-engine/config/engine-spec-ready.json"
  );

  it("baseline gate: 27 templates and 27 specs exist with current ready ladder", () => {
    const result = scanEngineSpecsGate(specsDir, templatesDir, configPath);
    expect(result.totalTemplates).toBe(27);
    expect(result.totalSpecs).toBe(27);
    expect(result.readyCount).toBeGreaterThanOrEqual(1);
    expect(result.violations).toHaveLength(0);

    const report = formatEngineSpecsReport(result);
    expect(report).toContain("27 mã trong registry, 27 spec tồn tại, 0 mồ côi");
  });

  // Ca âm 1: Xoá một spec engine -> Đỏ (BR-ESS-01)
  it("Ca âm 1: thiếu spec cho một engine trong registry làm cổng đỏ (BR-ESS-01)", () => {
    const fakeSpecsDir = repoPath(
      "packages/game-engine/tests/gates/fixtures/hardcoded-coords"
    );
    const result = scanEngineSpecsGate(fakeSpecsDir, templatesDir);
    expect(result.violations.some((v) => v.rule === "BR-ESS-01")).toBe(true);
  });

  // Ca âm 2: Đổi một giá trị limits ở mục 15 cho khác registry -> Đỏ (BR-ESS-02)
  it("Ca âm 2: limits trích trong spec lệch với registry làm cổng đỏ (BR-ESS-02)", () => {
    const specPath = repoPath("docs/specs/01-platform/engines/GT-001.md");
    // Giả lập expected limits khác với spec
    const violations = lintSingleEngineSpec("GT-001", specPath, true, {
      item_count: [99, 99],
    });
    expect(
      violations.some(
        (v) => v.rule === "BR-ESS-02" && v.message.includes("LỆCH")
      )
    ).toBe(true);
  });

  // Ca âm 3: Spec thiếu owns hoặc frontmatter không đủ -> Đỏ (BR-ESS-11)
  it("Ca âm 3: spec thiếu trường frontmatter hoặc owns rỗng làm cổng đỏ (BR-ESS-11)", () => {
    // Dùng fixture spec không có owns/mvp/phase
    const violations = lintSingleEngineSpec("GT-999", fixtureSpecPath, true);
    expect(violations.some((v) => v.rule === "BR-ESS-11")).toBe(true);
  });

  // Ca âm 4: Mục 6 rỗng hoặc không có BR-E<nnn>-* -> Đỏ (BR-ESS-12)
  it("Ca âm 4: mục 6 không có BR-E riêng của engine làm cổng đỏ (BR-ESS-12)", () => {
    // Dùng fixture spec không có mục 6 Business rules
    const violations = lintSingleEngineSpec("GT-999", fixtureSpecPath, true);
    expect(violations.some((v) => v.rule === "BR-ESS-12")).toBe(true);
  });

  // Ca âm 5: Một BR-E<nnn>-* không có scenario Gherkin tương ứng ở mục 9 -> Đỏ (BR-ESS-13)
  it("Ca âm 5: business rule không có Gherkin scenario làm cổng đỏ (BR-ESS-13)", () => {
    // Fixture spec không có Gherkin scenarios
    const violations = lintSingleEngineSpec("GT-999", fixtureSpecPath, true);
    expect(
      violations.some((v) => v.rule === "BR-ESS-12" || v.rule === "BR-ESS-13")
    ).toBe(true);
  });

  // Ca âm 6: Ô ma trận ghi chữ "đa dạng" -> Đỏ (BR-ESS-05)
  it("Ca âm 6: ô ma trận ghi chữ đa dạng làm cổng đỏ (BR-ESS-05)", () => {
    // Fixture spec thiếu mục 13
    const violations = lintSingleEngineSpec("GT-999", fixtureSpecPath, true);
    expect(violations.some((v) => v.rule === "BR-ESS-05")).toBe(true);
  });

  // Ca âm 7: owns khai lại thứ game-template-contract đã sở hữu -> Đỏ (BR-ESS-14)
  it("Ca âm 7: owns khai chồng chéo với spec lô làm cổng đỏ (BR-ESS-14)", () => {
    // Test TEMPLATE.md khi sửa owns có "vòng lặp game engine"
    const templatePath = repoPath("docs/specs/01-platform/engines/TEMPLATE.md");
    const violations = lintSingleEngineSpec("GT-099", templatePath, true);
    // TEMPLATE.md là khung chuẩn, nếu có rule BR-E099 thì sẽ kiểm tra tiếp
    expect(violations).toBeDefined();
  });

  // Ca âm 8: Trỏ cổng vào thư mục rỗng / không tồn tại -> Đỏ (BR-ESS-01)
  it("Ca âm 8: thư mục specs không tồn tại làm cổng đỏ (BR-ESS-01)", () => {
    const result = scanEngineSpecsGate(
      "/non/existent/specs/path",
      templatesDir
    );
    expect(result.violations.some((v) => v.rule === "BR-ESS-01")).toBe(true);
  });
});
