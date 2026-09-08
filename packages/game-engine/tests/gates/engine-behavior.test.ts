import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
const FIRST_OBS_ROW_REGEX = /\| "Con nghe hết câu hỏi[^\n]*\n/;
const STRIP_WIN_CHANNEL_REGEX = /\*\*Kênh thắng cuộc\*\*[^\n]*\n/;

describe("Gate check:engine-behavior (BR-EBD-01..13, BR-ESS-16..17)", () => {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const configPath = repoPath(
    "packages/game-engine/config/engine-behavior-domain.json"
  );
  const baselinePath = repoPath("scripts/engine-behavior-baseline.json");

  it("baseline: 37 engine, 37 spec, sàn 2 · 5 · 6 đạt, 0 vi phạm", () => {
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      baselinePath,
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

    expect(result.registryEngineCount).toBe(37);

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
      baselinePath,
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
      baselinePath,
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
      baselinePath,
      templatesRegistry: mockRegistry,
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-04" && v.message.includes("Band 4-5")
      )
    ).toBe(true);
  });

  // Ca âm 8: Engine có trong registry mà thiếu hàng cấu hình làm cổng đỏ (BR-EBD-01)
  it("Ca âm 8: engine trong registry thiếu hàng cấu hình làm cổng đỏ (BR-EBD-01)", () => {
    const baseConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    const { "GT-020": _dropped, ...remainingEngines } = baseConfig.engines;
    const badConfig = { ...baseConfig, engines: remainingEngines };

    const result = scanEngineBehaviorGate({
      specsDir,
      baselinePath,
      customConfig: badConfig,
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-01" && v.templateCode === "GT-020"
      )
    ).toBe(true);

    // Báo cáo in số đo thật của lượt chạy, cấm hằng số 37.
    expect(formatEngineBehaviorReport(result)).toContain(
      "Tổng engine trong cấu hình: 36 · trong registry: 37"
    );
  });

  // Ca âm 9: Mã cấu hình không có trong registry làm cổng đỏ (BR-EBD-01)
  it("Ca âm 9: mã cấu hình không có trong registry làm cổng đỏ (BR-EBD-01)", () => {
    const baseConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    const badConfig = structuredClone(baseConfig);
    badConfig.engines["GT-099"] = {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    };

    const result = scanEngineBehaviorGate({
      specsDir,
      baselinePath,
      customConfig: badConfig,
    });

    expect(
      result.violations.some(
        (v) =>
          v.rule === "BR-EBD-01" &&
          v.templateCode === "GT-099" &&
          v.message.includes("không có trong registry")
      )
    ).toBe(true);
  });

  // Ca âm 10: Từ vựng domains/nhip trong cấu hình lệch từ vựng đóng làm cổng đỏ (BR-EBD-01)
  it("Ca âm 10: domains hoặc nhip trong cấu hình lệch từ vựng đóng làm cổng đỏ (BR-EBD-01)", () => {
    const baseConfig = JSON.parse(readFileSync(configPath, "utf-8"));

    const badDomains = structuredClone(baseConfig);
    badDomains.domains = ["rac-ruoi"];
    expect(
      scanEngineBehaviorGate({
        specsDir,
        baselinePath,
        customConfig: badDomains,
      }).violations.some(
        (v) => v.rule === "BR-EBD-01" && v.message.includes("domains")
      )
    ).toBe(true);

    const badNhip = structuredClone(baseConfig);
    badNhip.nhip = ["bla"];
    expect(
      scanEngineBehaviorGate({
        specsDir,
        baselinePath,
        customConfig: badNhip,
      }).violations.some(
        (v) => v.rule === "BR-EBD-01" && v.message.includes("nhip")
      )
    ).toBe(true);
  });

  // Ca âm 11: Miền phụ khai không có backtick vẫn phải đỏ (BR-ESS-16)
  it("Ca âm 11: miền phụ khai không đặt trong backtick vẫn làm cổng đỏ (BR-ESS-16)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(
      "**Miền phụ:** —",
      "**Miền phụ:** van-chuyen"
    );

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-ESS-16")).toBe(true);
  });

  // Ca âm 12: do_mo ngoài từ vựng nhưng bắt đầu bằng "mở" vẫn phải đỏ (BR-EBD-08)
  it("Ca âm 12: do_mo ngoài từ vựng đóng làm cổng đỏ dù có tiền tố hợp lệ (BR-EBD-08)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(
      "**Độ mở (`do_mo`):** `đóng` — lý do cơ chế:",
      "**Độ mở (`do_mo`):** `mở toang tùy tiện` —"
    );

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-EBD-08")).toBe(true);
  });

  // Ca âm 13: Hàng câu quan sát bỏ trống ô câu vẫn phải đỏ (BR-EBD-05)
  it("Ca âm 13: hàng câu quan sát bỏ trống ô câu làm cổng đỏ (BR-EBD-05)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(FIRST_OBS_ROW_REGEX, "|  |  |  |\n");

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(
      violations.some(
        (v) => v.rule === "BR-EBD-05" && v.message.includes("bỏ trống")
      )
    ).toBe(true);
  });

  // Ca âm 14: Trục tag thứ năm làm cổng đỏ (BR-EBD-03)
  it("Ca âm 14: tag_axis mọc trục thứ năm làm cổng đỏ (BR-EBD-03)", () => {
    const dir = mkdtempSync(join(tmpdir(), "ebd03-"));
    const file = join(dir, "tagging.ts");
    writeFileSync(
      file,
      'export const tagAxisEnum = pgEnum("tag_axis", [\n  "what",\n  "thinking",\n  "mechanic",\n  "theme",\n  "behaviour",\n]);\n'
    );

    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      baselinePath,
      taggingSources: [file],
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-03" && v.message.includes("behaviour")
      )
    ).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  // Ca âm 15: Từ vựng tag nhắc behavior_domain làm cổng đỏ (BR-EBD-03)
  it("Ca âm 15: từ vựng tag nhắc behavior_domain làm cổng đỏ (BR-EBD-03)", () => {
    const dir = mkdtempSync(join(tmpdir(), "ebd03b-"));
    const file = join(dir, "content-tagging.md");
    writeFileSync(file, "| `behavior_domain` | trục thứ năm |\n");

    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      baselinePath,
      taggingSources: [file],
    });

    expect(result.violations.some((v) => v.rule === "BR-EBD-03")).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  // Ca âm 16: Thiếu nguồn từ vựng tag thì BR-EBD-03 KHÔNG được lặng lẽ bỏ qua
  it("Ca âm 16: không có nguồn từ vựng tag thì báo cáo nói rõ BR-EBD-03 không đo", () => {
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      baselinePath,
    });

    expect(result.taggingSourcesChecked).toBe(0);
    expect(formatEngineBehaviorReport(result)).toContain(
      "BR-EBD-03 (miền không phải trục tag): ✗ KHÔNG ĐO"
    );
  });

  // Ca âm 17: Phiếu thiếu dòng kênh thắng cuộc làm cổng đỏ (BR-EBD-07)
  it("Ca âm 17: phiếu thiếu dòng Kênh thắng cuộc làm cổng đỏ (BR-EBD-07)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(STRIP_WIN_CHANNEL_REGEX, "");

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(violations.some((v) => v.rule === "BR-EBD-07")).toBe(true);
  });

  // Ca âm 18: Màu khai làm kênh thắng cuộc làm cổng đỏ (BR-EBD-07)
  it("Ca âm 18: màu khai làm kênh thắng cuộc làm cổng đỏ (BR-EBD-07)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(
      STRIP_WIN_CHANNEL_REGEX,
      "**Kênh thắng cuộc** (`BR-EBD-07`): `hình` · `màu` — thẻ phân biệt bằng màu\n"
    );

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(
      violations.some(
        (v) => v.rule === "BR-EBD-07" && v.message.includes("màu")
      )
    ).toBe(true);
  });

  // Ca âm 19: Một kênh mà không tự khai NỢ làm cổng đỏ (BR-EBD-07)
  it("Ca âm 19: một kênh thắng cuộc mà không ghi NỢ làm cổng đỏ (BR-EBD-07)", () => {
    const gt001 = readFileSync(
      repoPath("docs/specs/01-platform/engines/GT-001.md"),
      "utf-8"
    );
    const badContent = gt001.replace(
      STRIP_WIN_CHANNEL_REGEX,
      "**Kênh thắng cuộc** (`BR-EBD-07`): `hình` — chỉ có hình\n"
    );

    const violations = lintSingleBehaviorSpec("GT-001", badContent, {
      mien: "chi-dinh",
      mien_phu: null,
      nhip: "tu-do",
    });

    expect(
      violations.some((v) => v.rule === "BR-EBD-07" && v.message.includes("NỢ"))
    ).toBe(true);
  });

  // Ca âm 20: Nợ kênh vượt trần bậc thang làm cổng đỏ (BR-EBD-07)
  it("Ca âm 20: nợ kênh vượt trần bậc thang làm cổng đỏ (BR-EBD-07)", () => {
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      customBaseline: {
        min_domains_per_band: { "3-4": 2, "4-5": 5, "5-6": 6 },
        max_engines_below_two_channels: 3,
      },
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-07" && v.message.includes("vượt trần")
      )
    ).toBe(true);
    expect(result.channelDebt).toHaveLength(4);
  });

  // Ca âm 21: Thiếu tệp bậc thang làm cổng đỏ, cấm rơi về mặc định (BR-EBD-04)
  it("Ca âm 21: thiếu tệp bậc thang làm cổng đỏ (BR-EBD-04)", () => {
    const result = scanEngineBehaviorGate({
      specsDir,
      configPath,
      baselinePath: join(tmpdir(), "khong-ton-tai-bac-thang.json"),
    });

    expect(
      result.violations.some(
        (v) => v.rule === "BR-EBD-04" && v.message.includes("bậc thang")
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
      baselinePath,
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
