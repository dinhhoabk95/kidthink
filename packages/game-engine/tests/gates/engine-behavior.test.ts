import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { MVP_TEMPLATES } from "../../src/generated/template-registry.js";
import {
  formatEngineBehaviorReport,
  lintSingleBehaviorSpec,
  scanEngineBehaviorGate,
  type TemplateAgeLimits,
} from "./engine-behavior.js";

const STRIP_OBS_REGEX =
  /\| Câu quan sát[\s\S]*?(?=\*\*Điều kiện phát triển tiên quyết\*\*)/i;
const BAD_OBS_ROW_REGEX = /\| "Con lấy tay[^|\n]+\|/i;
const STRIP_VAR_ROW_REGEX = /\| `vai-tro`[\s\S]*?(?=\*\*Độ mở)/i;
const STRIP_DO_MO_REGEX = /\*\*Độ mở[\s\S]*?\n/i;

describe("Gate check:engine-behavior (BR-EBD-01..13, BR-ESS-16..17)", () => {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const configPath = repoPath(
    "packages/game-engine/config/engine-behavior-domain.json"
  );

  it("baseline: 37 engine, 37 spec, sàn 2 · 5 · 6 đạt, 0 vi phạm", () => {
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
    });

    expect(result.totalEngines).toBe(37);
    expect(result.violations).toHaveLength(0);

    const b34 = result.bandSummaries.find((s) => s.band === "3-4");
    const b45 = result.bandSummaries.find((s) => s.band === "4-5");
    const b56 = result.bandSummaries.find((s) => s.band === "5-6");

    expect(b34?.domainCount).toBe(2);
    expect(b34?.passed).toBe(true);

    expect(b45?.domainCount).toBe(5);
    expect(b45?.passed).toBe(true);

    expect(b56?.domainCount).toBe(6);
    expect(b56?.passed).toBe(true);

    const report = formatEngineBehaviorReport(result);
    expect(report).toContain("Band 3-4: 2/6 miền");
    expect(report).toContain("Band 4-5: 5/6 miền");
    expect(report).toContain("Band 5-6: 6/6 miền");
    expect(report).toContain("0 vi phạm");
  });

  // Ca âm 1: Miền ngoài từ vựng làm cổng đỏ (BR-EBD-01)
  it("Ca âm 1: miền ngoài từ vựng làm cổng đỏ (BR-EBD-01)", () => {
    const baseConfigRaw = readFileSync(configPath, "utf-8");
    const baseConfig = JSON.parse(baseConfigRaw);
    const badConfig = {
      ...baseConfig,
      engines: {
        ...baseConfig.engines,
        "GT-013": { mien: "vach-duong", mien_phu: null, nhip: "tu-do" },
      },
    };

    const result = scanEngineBehaviorGate({
      specsDir,
      customConfig: badConfig,
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-01" && v.templateCode === "GT-013"
      )
    ).toBe(true);
  });

  // Ca âm 2: Hai miền chủ đạo / trùng miền phụ làm cổng đỏ (BR-EBD-02)
  it("Ca âm 2: hai miền chủ đạo hoặc trùng miền phụ làm cổng đỏ (BR-EBD-02)", () => {
    const baseConfigRaw = readFileSync(configPath, "utf-8");
    const baseConfig = JSON.parse(baseConfigRaw);
    const badConfig = {
      ...baseConfig,
      engines: {
        ...baseConfig.engines,
        "GT-014": { mien: "van-chuyen", mien_phu: "van-chuyen", nhip: "tu-do" },
      },
    };

    const result = scanEngineBehaviorGate({
      specsDir,
      customConfig: badConfig,
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-02" && v.templateCode === "GT-014"
      )
    ).toBe(true);
  });

  // Ca âm 3: Phiếu thiếu bảng câu quan sát làm cổng đỏ (BR-EBD-05)
  it("Ca âm 3: phiếu thiếu bảng câu quan sát làm cổng đỏ (BR-EBD-05)", () => {
    const gt011Path = repoPath("docs/specs/01-platform/engines/GT-011.md");
    const gt011Content = readFileSync(gt011Path, "utf-8");
    // Xoá bảng câu quan sát
    const strippedContent = gt011Content.replace(STRIP_OBS_REGEX, "");

    const violations = lintSingleBehaviorSpec("GT-011", strippedContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-EBD-05")).toBe(true);
  });

  // Ca âm 4: Câu quan sát viết bằng từ kỹ thuật làm cổng đỏ (BR-EBD-05)
  it("Ca âm 4: câu quan sát viết bằng từ kỹ thuật làm cổng đỏ (BR-EBD-05)", () => {
    const gt011Path = repoPath("docs/specs/01-platform/engines/GT-011.md");
    const gt011Content = readFileSync(gt011Path, "utf-8");
    // Thêm từ kỹ thuật "chọn đáp án đúng" vào bảng câu quan sát
    const badContent = gt011Content.replace(
      BAD_OBS_ROW_REGEX,
      '| "Con chọn đáp án đúng khi nghe câu hỏi" | `5-6` | Kỹ thuật |'
    );

    const violations = lintSingleBehaviorSpec("GT-011", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(
      violations.some(
        (v) => v.rule === "BR-EBD-05" && v.message.includes("chọn đáp án đúng")
      )
    ).toBe(true);
  });

  // Ca âm 5: Mục 18 chỉ có hai trục biến thể làm cổng đỏ (BR-EBD-10)
  it("Ca âm 5: mục 18 chỉ có hai trục biến thể làm cổng đỏ (BR-EBD-10)", () => {
    const gt025Path = repoPath("docs/specs/01-platform/engines/GT-025.md");
    const gt025Content = readFileSync(gt025Path, "utf-8");
    // Cắt bớt bảng biến thể chỉ còn 2 hàng
    const badContent = gt025Content.replace(STRIP_VAR_ROW_REGEX, "");

    const violations = lintSingleBehaviorSpec("GT-025", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-EBD-10")).toBe(true);
  });

  // Ca âm 6: do_mo bỏ trống làm cổng đỏ (BR-EBD-08)
  it("Ca âm 6: do_mo bỏ trống làm cổng đỏ (BR-EBD-08)", () => {
    const gt022Path = repoPath("docs/specs/01-platform/engines/GT-022.md");
    const gt022Content = readFileSync(gt022Path, "utf-8");
    // Xoá dòng do_mo
    const badContent = gt022Content.replace(STRIP_DO_MO_REGEX, "");

    const violations = lintSingleBehaviorSpec("GT-022", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-EBD-08")).toBe(true);
  });

  // Ca âm 7: Band tụt dưới bậc thang làm cổng đỏ (BR-EBD-04)
  it("Ca âm 7: band tụt dưới bậc thang ratchet làm cổng đỏ (BR-EBD-04)", () => {
    // Mock registry dựa trên MVP_TEMPLATES trong đó GT-013 bị cấm ở band 4-5
    // GT-013 là engine duy nhất đưa lan-net vào band 4-5
    const mockRegistry: Record<string, TemplateAgeLimits> = {};
    for (const [code, t] of Object.entries(MVP_TEMPLATES)) {
      if (code === "GT-013") {
        mockRegistry[code] = {
          age_min: 5,
          age_max: 6,
          banned_age_bands: ["3-4", "4-5"],
        };
      } else {
        mockRegistry[code] = t;
      }
    }

    // Với mock registry này, band 4-5 chỉ có 4 miền (mất lan-net), dưới sàn 5
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      templatesRegistry: mockRegistry,
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-04" && v.message.includes("Band 4-5")
      )
    ).toBe(true);
  });

  // Ca kiểm chứng phụ: Sửa mien trong cấu hình lệch phiếu -> Đỏ và in cả hai giá trị (BR-ESS-16)
  it("phiếu lệch miền với cấu hình làm cổng đỏ và in cả hai giá trị (BR-ESS-16)", () => {
    const baseConfigRaw = readFileSync(configPath, "utf-8");
    const baseConfig = JSON.parse(baseConfigRaw);
    const badConfig = {
      ...baseConfig,
      engines: {
        ...baseConfig.engines,
        "GT-001": { mien: "van-chuyen", mien_phu: null, nhip: "tu-do" },
      },
    };

    const result = scanEngineBehaviorGate({
      specsDir,
      customConfig: badConfig,
    });

    const v = result.violations.find(
      (item) => item.templateCode === "GT-001" && item.rule === "BR-ESS-16"
    );
    expect(v).toBeDefined();
    expect(v?.message).toContain("chi-dinh");
    expect(v?.message).toContain("van-chuyen");
    expect(v?.message).toContain("LỆCH");
  });
});
